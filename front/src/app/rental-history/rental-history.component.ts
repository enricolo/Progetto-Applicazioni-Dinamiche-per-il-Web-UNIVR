import {
  AfterContentChecked,
  AfterContentInit,
  AfterViewChecked,
  AfterViewInit,
  Component,
  DoCheck, OnDestroy,
  OnInit, Output
} from '@angular/core';
import {Apollo} from 'apollo-angular';
import {RENTAL_HISTORY} from '../graphql/graphql.rental_history';
import {util} from "protobufjs";
import EventEmitter = util.EventEmitter;
import {ActivatedRoute, Router} from "@angular/router";
import { HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-rental-history',
  templateUrl: './rental-history.component.html',
  styleUrls: ['./rental-history.component.css']
})
export class RentalHistoryComponent implements OnInit{

  toDate(timemillis: string) {
    var date = parseInt(timemillis);
    var d = new Date(date);
    var ds = d.toLocaleString();
    return ds
  }

  getDuration(milli: any){
    let minutes = Math.floor(milli / 60000);
    let hours = Math.round(minutes / 60);
    let days = Math.round(hours / 24);
    return days
  };

  totalExpense:number=0

  ishistory = false

  // @ts-ignore
  // 3 things I need to talk with the graphql api
  history : any[] = [];
  loading = true;
  error : any;

  token = sessionStorage.getItem('token') || "";

  constructor(private apollo : Apollo, private route : ActivatedRoute, private _router : Router) {
  }

  apolloCheck(){
    this.apollo
      .watchQuery({
        query : RENTAL_HISTORY,
        context: {
          headers: new HttpHeaders().set("authorization", this.token),
        }
      }).valueChanges.subscribe((result : any) => {
      this.history = result?.data?.pecunia_pagata;

      this.loading = result.loading;
      this.error = result.error;

      for (let i = 0; i < this.history.length; i++) {
        console.log(this.history[i])
        console.log(this.history[i].amount)
        this.totalExpense+=this.history[i].amount
        console.log(this.totalExpense)

        // this.getFillSelectedBook(this.basket[i])
      }
    });

  }

  ngOnInit(): void {
    this.apolloCheck()
  }

  changeOrder(): void{
    this.history.reverse
  }





}
