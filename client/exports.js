
'use strict';


import { Tracker } from 'meteor/tracker';

import RtcManager from './rtcomponents/rtcmanager';



let rtcManager = undefined;


const Rtc = {
    
    
    bootup( options ){
        if( typeof rtcManager !== 'undefined' ){
            throw new Error( 'Rtc already initialized. Shutdown first' );
        }
        
        rtcManager = Tracker.nonreactive( ()=>{ return new RtcManager( options ); } );
    },
    
    
    shutdown(){
        if( typeof rtcManager === 'undefined' ){
            return Promise.reject( 'already down' );
        }
        const closedConnectionAmount = rtcManager.quit();
        rtcManager = undefined;
        return closedConnectionAmount;
    },
    
    
    // current state of the Rtc machine, reactive data source
    // @return {String} status - TODO
    status(){
        return rtcManager.state;
    },
    
    
    // Establishes a webrtc connection to another given user
    //
    // @arg {string} userIdentifier - username or userId; if no argument
    //
    // @return {Promise} - resolves to connection object, only if connection could get established,
    //                     otherwise it rejects to an Error, whether connection attempt got refused
    //                     or something went wrong
    connect( userId, options ){
        if( typeof userId !== 'string' || userId.trim().length <= 0 ){
            throw new TypeError( 'invalid user ID' );
        }
        return rtcManager.connect( userId, options );
    },
    
    
    // Disconnecting existing connections to other users
    //
    // @arg {string, Rtconnection } [userIdentifier] - username or userId; if no argument, it will 
    //                                                 disconnect all existing connections
    // @return {Number} [amount] - closed Connections 
    disconnect( userId ){
        if( typeof userId !== 'undefined' ){
            if( typeof userId !== 'string' || userId.trim().length <= 0 ){
                throw new TypeError( 'invalid user ID' );
            }
            return rtcManager.disconnect( userId );
        }else{
            return rtcManager.disconnect();
        }
    },
   
   
    incoming(){
        return {
            filter,
            connections
        }; 
    },
   
   
    // @return {Rtconnection} - connection object with a bunch of reactive variables, functions and 
    //                          info fields
    connection( userId ){
        if( typeof rtcManager === 'undefined' ){
            return null;
        }
        return rtcManager._getConnectionInstance( userId );
    }
    
};


Object.freeze( Rtc );



export { Rtc as default };





function filter( filterFn ){
    return {
        connections( handler ){
            connections( handler, filterFn );
        }
    };
}

function connections( handler, filterFn ){
    if( typeof rtcManager === 'undefined' || rtcManager === null ){
        throw new Error( 'Rtc not initialized' );
    }
    rtcManager.incoming( handler, filterFn );
}
