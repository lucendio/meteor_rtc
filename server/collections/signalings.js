
'use strict';


import Signalings from './../../shared/collections/signalings';
import signalingsApi from './signalings.api';



Signalings.rawCollection().createIndex(
    {
        'dispatcher.userId': 1,
        'recipient.userId': 1
    },
    {
        name: 'connection',
        unique: true,
        spare: true
    },
    ( err, res )=>{
        if( typeof err !== 'undefined' && err !== null ){ console.debug( err ); }
    }
);


Signalings.rawCollection().createIndex(
    {
        'dispatcher.userId': 1
    },
    {
        name: 'dispatcherId'
    },
    ( err, res )=>{
        if( typeof err !== 'undefined' && err !== null ){ console.debug( err ); }
    }
);


Signalings.rawCollection().createIndex(
    {
        'recipient.userId': 1
    },
    {
        name: 'recipientId'
    },
    ( err, res )=>{
        if( typeof err !== 'undefined' && err !== null ){ console.debug( err ); }
    }
);


Signalings.api = Object.assign( {}, signalingsApi );



export { Signalings as default };
