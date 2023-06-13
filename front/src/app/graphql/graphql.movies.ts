import {gql} from 'apollo-angular';

const MOVIES = gql`query($film_title : String!){
  movies(film_title : $film_title){
    title,
    description,
    release_year
  }
}`
;

const MOVIE = gql`query($film_title : String!){
  movies(film_title : $film_title){
    title,
    description,
    language{
      name
    },
    rental_duration,
    replacement_cost,
    category{
      name
    }
  }
}`
;


export {MOVIES};
export {MOVIE};
