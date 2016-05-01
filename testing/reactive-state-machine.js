
'use strict';


import { Tracker } from 'meteor/tracker';

import ReactiveStateMachine from './../client/rtc/libs/reactive-state-machine';



const rsm = new ReactiveStateMachine( 'firstState' );

Tracker.autorun( ()=>{
    console.log( rsm.state );
});


window.setTimeout( ()=>{
    console.log( 'tout1' );
    rsm.state = '2nState';
}, 1000 );


window.setTimeout( ()=>{
    console.log( 'tout2' );
    rsm.state = '3rdState';
}, 2000 );


window.setTimeout( ()=>{
    console.log( 'tout3' );
    rsm.state = '3rdState';
}, 3000 );


window.setTimeout( ()=>{
    console.log( 'tout4' );
    rsm.state = '4thState';
}, 4000 );

