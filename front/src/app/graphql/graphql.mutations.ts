import {gql} from 'apollo-angular';



const LOGIN = gql`mutation Login($email : String!, $password : String!){
  login(email : $email, password : $password)
}`;


const REMOVEFROMBASKET = gql`mutation RemoveFromBasket($film_id : ID) {
  removeFromBasket(film_id: $film_id)
}`;


const ADDTOBASKET = gql`mutation AddToBasket($film_id : ID!){
  addToBasket(film_id: $film_id)
}`;

const RENTMOVIES = gql`mutation RentMovies($rentInput : [RentInput]!) {
  rentMovies(rentObj: $rentInput)
}
`;



export {LOGIN, REMOVEFROMBASKET, ADDTOBASKET, RENTMOVIES};
