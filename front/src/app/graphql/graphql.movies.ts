import {gql} from 'apollo-angular';

const MOVIES = gql`query($film_title : String, $film_category : [ID], $only_available:Boolean,
  $limit : Int, $offset : Int){
  movies(
      film_title : $film_title,
      film_category : $film_category,
      only_available:$only_available,
      limit: $limit,
      offset : $offset
  ){
    film_id,
    title,
    description,
    release_year,
    rating,
    rental_duration,
    rental_rate,
    length,
    category{
      name
    },
    actor{
      first_name,
      last_name
    },
    language{
      name
    },
    store_availability{
      address{
        address
      }
    }
  }
}`
;




export {MOVIES};
