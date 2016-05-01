
'use strict';


import { Random } from 'meteor/random'; 

import RtcPool from './../client/rtc/rtcpool';



console.log( RtcPool.list() );

RtcPool.add( { id: Random.id(), fake: 'rtc' } );
RtcPool.add( Random.id(), { fake: 'rtc' } );

try{
    RtcPool.add( Random.id(), null );
}catch( exc ){
    console.log( exc );
}
try{
    RtcPool.add( true );
}catch( exc ){
    console.log( exc );
}
try{
    RtcPool.add( true );
}catch( exc ){
    console.log( exc );
}
try{
    RtcPool.add();
}catch( exc ){
    console.log( exc );
}
try{
    RtcPool.add( Random.id() );
}catch( exc ){
    console.log( exc );
}
try{
    RtcPool.add( { id: 23 } );
}catch( exc ){
    console.log( exc );
}

let ID = Random.id();
RtcPool.add( ID, { bar: 'foo' } );
RtcPool.add( ID, { bar: 'foo again' } );
console.log( RtcPool.all() );
console.log( RtcPool.list().length );
RtcPool.remove( ID );
console.log( RtcPool.list().length );

ID = Random.id();
RtcPool.add( { id: ID } );
console.log( RtcPool.list() );
console.log( RtcPool.exists( ID ) );
RtcPool.remove( ID );
console.log( RtcPool.exists( ID ) );
