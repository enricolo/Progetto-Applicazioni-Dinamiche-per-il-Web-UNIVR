import {
  Component,
  OnInit
} from '@angular/core';
import {Apollo} from 'apollo-angular';
import {MOVIES} from '../graphql/graphql.movies';
import {CATEGORIES} from "../graphql/graphql.categories";
import {ActivatedRoute, Router} from "@angular/router";
import { HttpHeaders } from '@angular/common/http';
import {MatChipSelectionChange} from "@angular/material/chips";

// @ts-ignore
@Component({
  selector: 'app-film',
  templateUrl: './film.component.html',
  styleUrls: ['./film.component.css'],
})

export class FilmComponent implements OnInit{

  reset = ""
  // @ts-ignore
  ismovie : boolean;
  // 3 things I need to talk with the graphql api
  movies : any[] = [];
  loading = true;
  error : any;

  categories : any[] = [];

  selectedCategories : number[] = [];
  title : string = ""

  token = sessionStorage.getItem('token') || "";

  constructor(private apollo : Apollo, private route : ActivatedRoute, private _router : Router) {
  }

  categoriesApollo()
  {
    this.apollo
      .watchQuery({
        query : CATEGORIES,
        context: {
          headers: new HttpHeaders().set("authorization", this.token),
        }
      }).valueChanges.subscribe((result : any) => {
        this.categories = result?.data?.categories;
    });
  }

  apolloCheck(){
    this.apollo
      .watchQuery({
        query : MOVIES,
        variables : {
          film_title :  this.title,
          film_category :  this.selectedCategories,
        },
        context: {
          headers: new HttpHeaders().set("authorization", this.token),
        }
      }).valueChanges.subscribe((result : any) => {
      this.movies = result?.data?.movies;
      this.loading = result.loading;
      this.error = result.error;
    });

  }

  ngOnInit(): void {
    this.apolloCheck()
    this.categoriesApollo();
  }


// Taking the string of the filter -> HTMLInputElement is a casting
  onInput(event : Event) {
    this.reset = (<HTMLInputElement>event.target).value
    this.selectedCategories = []  // È GIUSTO COSI?????????????????????????????
    this.apolloCheck()
  }

  onClick(e : any, title : string) {
    this._router.navigateByUrl('films/filmForm/'.concat(title));
  }

  onSearch(name : any)
  {
    this.title = name.target.value
    this.apolloCheck()
  }

  onSearchCat(selected: boolean, category_id : number) {

    if (selected){
      this.selectedCategories = [category_id]
    }else{
      this.selectedCategories = []
    }

    this.apolloCheck()
  }
}
