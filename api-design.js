
'use strict';



import Rtc from 'meteor/lucendio:rtc';



//  Initialize the Realtime Connection machinery by setting some options
//
Rtc.init( /* options */ );



// closing all open connections, shutdown RtcManager adn destroy its instance
//
Rtc.destroy();



// current state of the Rtc instance
// @return {String} status - TODO
Rtc.status();



// Establishes a webrtc connection to another given user
//
// @arg {string} userIdentifier - username or userId; if no argument
//
// @return {Promise} - resolves to connection object, only if connection could get established,
//                     otherwise it rejects to an Error, whether connection attempt got refused
//                     or something went wrong
Rtc.connect( /* user */ )
   .then( ( connection )=>{
       
   });


// Disconnecting existing connections to other users
//
// @arg {string, Rtconnection } [userIdentifier] - username or userId; if no argument, it will 
//                                                 disconnect all existing connections
// @return {Number} [amount] - closed Connections 
Rtc.disconnect( /* user */ );



// Handling new incoming connection attempts 
// TODO: if e use generators, check if we can call for it multiple times!
// NOTE: if the filter returns false, the knocking connections will be refused
//
const connections = Rtc.incoming( function filter( knockingConnection ){
    const { userId } = knockingConnection;
    // IDEA: returns Boolean or Promises which then resolves to Boolean
    return true;
});

for( let connection in connections ){
    // do stuff with connection
}

// 2 ways: it returns generator as above, or takes cbs as params
Rtc.incoming().filter( ()=>{ /* filter things and return boolean*/ } ).connections( ( connection )=>{ /* do things with it */ } );


// @return {Rtconnection} - connection object with a bunch of reactive variables, functions and 
//                          info fields
const rtconnection = Rtc.connection( /* user */ );



// close a connection on itself (if its available)
// TODO: need to trigger an removal in RtcManager
// @return {Promise} - resolved, if successful, otherwise will reject
rtconnection.close();

rtconnection.send( /* data */ );
rtconnection.receive( ( data )=>{ /* handle incoming data */ } );
