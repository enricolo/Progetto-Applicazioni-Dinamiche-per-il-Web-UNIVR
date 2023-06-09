const bcrypt = require('bcrypt')
const query = require('../config/db')
const query_credentials = require('../config/db_credentials')
const jwt = require('jsonwebtoken')
const queries = require('../src/queries')
const queriesCredentials = require('../src/queriesCredentials')
const _ = require('lodash')
const {RentInputType} = require('../src/inputTypes')

const {
  CategoryType,
  MovieType,
  PaymentType,
  UserType,
  BasketType,
  RentalType
}  = require('../src/types');


const {
    GraphQLObjectType,
    GraphQLID,
    GraphQLString,
    GraphQLSchema,
    GraphQLList,
    GraphQLInt,
    GraphQLBoolean,
    GraphQLNonNull,
    GraphQLEnumType,
    GraphQLError,
    GraphQLInputObjectType
  } = require('graphql');


const RootQueryType = new GraphQLObjectType({
    name: 'RootQueryType',
    description: 'this is a root query',
    fields: {
        movies: {
          type: new GraphQLList(MovieType),
          description: 'get list of all movies',
          args: { 
            film_title: { type: GraphQLString,
              description: 'list of movies that matches argument'},
            film_category: { type : new GraphQLList(GraphQLID),
                            description: 'list of id of wanted categories'},
            only_available: { type: GraphQLBoolean,
                            description: 'return only available movies'},
            limit: { type: GraphQLInt,
                              description: 'how many movie to return'},
            offset: { type: GraphQLInt,
                                description: 'how much offset from the first element in list'}
          },
          resolve: async (parent, args, {user}) => {
            if (user){
              let conditionNumber = 0
              let newQuery = queries.getMovies
              let paramsList = []

              if (args.film_title != null && args.film_title!=""){
                if (conditionNumber == 0){
                  newQuery += " WHERE " 
                }else{
                  newQuery += " AND "
                }
                conditionNumber++
                newQuery += queries.moviesByTitleCondition.replace("$1", "$"+conditionNumber); 
                paramsList.push('%' + args.film_title + '%');
              }

              if (args.film_category != undefined && args.film_category.length != 0){
                if (conditionNumber == 0){
                  newQuery += " WHERE "
                }else{
                  newQuery += " AND "
                }
                conditionNumber++
                newQuery += queries.moviesByCategoryCondition.replace("$1", "$"+conditionNumber); 
                paramsList.push(args.film_category);
              }

              if (args.only_available != null && args.only_available==true){
                if (conditionNumber == 0){
                  newQuery += " WHERE "
                }else{
                  newQuery += " AND "
                }
                newQuery += queries.moviesAvailabilityCondition; 

              }
              if (args.limit != null && args.limit != undefined){
                conditionNumber++
                newQuery += " LIMIT $1".replace("$1", "$"+conditionNumber);
                paramsList.push(args.limit);
              }

              if (args.offset != null && args.offset != undefined){
                conditionNumber++
                newQuery += " OFFSET $1".replace("$1", "$"+conditionNumber);
                paramsList.push(args.offset);
              }

              const result = await query(newQuery, paramsList)
              return result.rows
            }
            return null
            
          }          
        },

        movie: {
          type: MovieType,
          description: 'get movie by id',
          args: { 
            film_id: { type: GraphQLID },
         },
          resolve: async (parent, args, {user}) => {
            if (user){
            let result = ""
            if (args.film_id != null){
              result = await query(queries.getMovieById, [args.film_id])
            }
            return result.rows[0]
          }
            return null
          }
        },


        categories: {
          type: new GraphQLList(CategoryType),
          description: 'get all categories',
          resolve: async ( parent, args, {user}) => {
            if (user){
            const result = await query(queries.getcategoryById)
            return result.rows
          }          
            return null
          }          
        },


        pecunia_pagata:{
          type: new GraphQLList(RentalType),
          description: 'list of payment',
         resolve: async (parent, args, {user}) => {
          if (user){
            const result = await query(queries.getRentalByCustomerId, [user.customer_id])
          return result.rows
        }  
          return null
          }  
        },

        basket:{
          type: BasketType,
          description: 'list movie in basket',
          resolve: async (parent, args, {user}) => {
            if (user){
              const result = await query_credentials(queriesCredentials.getCustomerIdAndFilmIdFromCustomerId, [user.customer_id])
              console.log (result.rows)
              const basket = {
                'customer_id': user.customer_id,
                'film_id': result.rows.map(a => a.film_id)               
              }

              return basket
        }  
            return null

        }
        }

    },
  });



const RootMutationType = new GraphQLObjectType({
  name: 'RootMutationType',
  description: 'this is a root mutation',
  fields: {


    register:{
      type: GraphQLBoolean,
      description: 'testiamo il register',
      args: { 
        email: { type: new GraphQLNonNull(GraphQLString) },
        password: { type: new GraphQLNonNull(GraphQLString) },
        customer_id: { type: new GraphQLNonNull(GraphQLID) }
      },
      resolve: async (parent, args, ) => {
        let password = await bcrypt.hash(args.password, 10)
        try{
          await query_credentials(    `INSERT INTO public."user"
            (email, "password", customer_id)
            VALUES($1, $2, $3);`, [args.email, password, args.customer_id])
        }catch(e){
          return false
        }
        console.log(password)
        return true
      }   
    },

    addToBasket:{
      type: GraphQLBoolean,
      description: 'add movie to basket of a customer',
      args: { 
        film_id: { type: new GraphQLNonNull(GraphQLID),
        description: 'list of payment' },
        
      },
      resolve: async (parent, args, {user}) => {
        if (user){
          try{
            await query_credentials(queriesCredentials.insertIntoBasketCustomerIdAndFilmId, [user.customer_id, args.film_id])
          }catch(e){
            return false
          }
          return true
        }  
        return null
      }
    },


    rentMovies:{
      type: GraphQLBoolean,
      description: 'add movie to basket of a customer',
      args: { 
        rentObj: { type: new GraphQLNonNull(new GraphQLList(RentInputType)) },
      },
      resolve: async (parent, args, {user}) => {
        if (user){
         
            try{
              for (let i = 0; i < args.rentObj.length; i++) {

                if (args.rentObj[i].rental_date == null){
                  return false
                }

                const result = await query(queries.getAvailableInventoryIdByFilmIdAndStoreId, [args.rentObj[i].film_id, args.rentObj[i].store_id])

                let customer_id = user.customer_id;
                let rental_date = args.rentObj[i].rental_date.slice(0, 19).replace('T', ' ');
                let inventory_id = result.rows[0].inventory_id


                await query(queries.insertNewRental, [rental_date, inventory_id, customer_id, 1]) //staff_id hardcoded to 1

                await query_credentials(queriesCredentials.deleteBasketByCustomerIdAndFilmId, [user.customer_id, args.rentObj[i].film_id])
              }
              // await query_credentials(queriesCredentials.deleteBasketByCustomerId, [user.customer_id])
            }catch(e){
              console.log(e)
              return false
            }
          return true
        }  
        return null
      }
    },

    removeFromBasket:{
      type: GraphQLBoolean,
      description: 'remove movie from basket of a customer',
      args: { 
        film_id: { type: GraphQLID,
        description: 'id of movie to remove, remove all otherwise'},
      },
      resolve: async (parent, args, {user}) => {

        if (user){
          if (args.film_id){

            console.log(args)
            console.log(user.customer_id)
            console.log(args.film_id)

            try{
              await query_credentials(queriesCredentials.deleteBasketByCustomerIdAndFilmId, [user.customer_id, args.film_id])
              console.log("cancello " + user.customer_id, args.film_id)
            }catch(e){
              return false
            }
            return true
          }
          try{
            await query_credentials(queriesCredentials.deleteBasketByCustomerId, [user.customer_id])
            console.log("cancello tutto" + user.customer_id, args.film_id)
          }catch(e){
            return false
          }
          return true
          
        }  
        return "null"
      }
    },


    login:{
      type: GraphQLString,
      description: 'testiamo il login',
      args: { 
        email: { type: new GraphQLNonNull(GraphQLString) },
        password: { type: new GraphQLNonNull(GraphQLString) }
      },
      resolve: async (parent, {email, password}, {SECRET}) => {
        
        const user = await query_credentials(queriesCredentials.getUserByEmail, [email]) ||  ""
        console.log(user)

        if(user.rows[0] === null){
          throw new Error('Incorret user or password'); 
        }

        const valid = await bcrypt.compare(password, user.rows[0].password)
        if (!valid){  
          throw new Error('Incorret user or password');
        }
        const token = jwt.sign(
          {
            user: _.pick(user.rows[0], ['user_id', 'customer_id'])
          },
          SECRET,
          {
            expiresIn: '1y'
          }
        );
        return token
      }   
    },
  }
  })
  
module.exports = new GraphQLSchema ({
  query: RootQueryType,
  mutation: RootMutationType
})
