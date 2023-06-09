import {Component, OnInit} from '@angular/core';
import {Apollo} from "apollo-angular";
import {Router} from "@angular/router";
import { HttpHeaders } from '@angular/common/http';
import {BASKET} from "../graphql/graphql.basket";
import {REMOVEFROMBASKET, RENTMOVIES} from "../graphql/graphql.mutations";
import {FormControl} from '@angular/forms';

@Component({
  selector: 'app-basket',
  templateUrl: './basket.component.html',
  styleUrls: ['./basket.component.css']
})
export class BasketComponent {


  token = sessionStorage.getItem('token') || "";

  basket: any[] = [];
  loading: any;
  error: any;
  minDate: Date= new Date();
  maxDate: Date = new Date();

  selectedFilmMap = new Map<number, {film_id: number; store_id: number; rental_date: Date}>

  date: any = new FormControl(new Date());

  success = false;
  result = false

  apolloBasket(){
    this.apollo
      .watchQuery({
        query : BASKET,
        context: {
          headers: new HttpHeaders().set("authorization", this.token),
        },

      }).valueChanges.subscribe((result : any) => {
        this.basket = result?.data?.basket?.film;
        this.loading = result.loading;
        this.error = result.error;

        for (let i = 0; i < this.basket.length; i++) {
          this.getFillSelectedBook(this.basket[i])
        }

    });
  }

  apolloRemoveFromBasket(film_id?: number){
    this.apollo
      .mutate({
        mutation : REMOVEFROMBASKET,
        variables : {
          film_id :  film_id
        },
        context: {
          headers: new HttpHeaders().set("authorization", this.token),
        },
        refetchQueries: [BASKET],
      }).subscribe((result : any) => {
        console.log(result)

    });
  }

  apolloRentMovies(values: { film_id: number; store_id: number; rental_date: Date; }[]){
    this.apollo
      .mutate({
        mutation : RENTMOVIES,
        variables : {
          "rentInput" : values
        },
        context: {
          headers: new HttpHeaders().set("authorization", this.token),
        },
        refetchQueries: [BASKET],
      }).subscribe((result : any) => {
        this.success = result?.data.rentMovies;
        this.result = true
    });
  }

  constructor(private apollo : Apollo, private router : Router){
  }

  ngOnInit(): void {
    this.apolloBasket()
    this.maxDate.setDate(this.maxDate.getDate() + 2);

  }



  onSelectStore(selected: boolean, store_id: number,film_id: number) {

    if (this.selectedFilmMap.get(film_id) != undefined){
      this.selectedFilmMap.get(film_id)!.store_id = store_id
    }else{
      throw new Error("non possibile")
    }
  }

  updateDate(rental_date: Date, film_id: number) {
    if (this.selectedFilmMap.get(film_id) != undefined ){
      this.selectedFilmMap.get(film_id)!.rental_date = rental_date
    }else{
      throw new Error("non possibile")
    }
  }

  onClickDelete(film_id: number) {
    this.apolloRemoveFromBasket(film_id)
  }

  getFillSelectedBook(movie: any){
    if (this.selectedFilmMap.get(movie.film_id) === undefined ){
      this.selectedFilmMap.set(movie.film_id, {
        film_id: movie.film_id,
        store_id: movie.store_availability[0].store_id,
        rental_date: new Date()
      })
    }
  }

  isStoreSelected(film_id: number, store_id: number){
    if (this.selectedFilmMap.get(film_id) != undefined ){
      return this.selectedFilmMap.get(film_id)!.store_id === store_id
    }else{
      throw new Error("non possibile")
    }
  }

  onClickRent($event: MouseEvent) {
    const values = Array.from(this.selectedFilmMap.values());

    this.apolloRentMovies(values)

  }




}
