
'use strict';


// TODO: checking browser compatibility


import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { Match } from 'meteor/check';

import Signalings from './../../shared/collections/signalings';

import Firewall from './libs/firewall';
import EventMachine from './libs/event-machine';
import ReactiveStateMachine from './libs/reactive-state-machine';
import Rtconfiguration from './rtconfiguration';
import Rtconnection from './rtconnection';
import RtcPool from './rtcpool';



let incomingSignalingObservation = null;


function RtcManager( options ){
    const self = this;
    
    EventMachine.call( self );
    
    // boot     -->
    // up       -->
    // block    -->
    // down     -->
    //
    ReactiveStateMachine.call( self, 'boot' );

    self._rtconfiguration = Rtconfiguration.defaults.basic;

    self._firewall = new Firewall();
    // NOTE subscription in rtconnection is currently not activated
    // self._firewall.in.allow();
    self._firewall.allow();


    Tracker.autorun( ( computation )=>{
        if( self._firewall.in.is === 'allowed'
            && self._firewall.out.is === 'allowed' 
        ){
            // NOTE: need to be wrapped, otherwise the subscription
            // triggered in setup() wont work, because its a child computation
            Tracker.nonreactive( ()=>{ self.setup( options ); });
            computation.stop();
        }
    });
}


Object.merge( RtcManager.prototype, EventMachine.prototype, ReactiveStateMachine.prototype, {

    constructor: RtcManager,

    setup( configs ){
        const self = this;

        if( self._state === 'up' ){
            return;
        }
        
        Object.assign( self._rtconfiguration, Rtconfiguration.clean( configs ) );
        self.accepting();


        // INFO: event handler registration goes here

        self.state = 'up';
    },

    quit(){
        const self = this;

        self.off( 'incoming' );
        self.blocking();
        self._firewall.deny();

        
        const rtcCount = self.disconnect();
        self.state = 'down';
        return rtcCount; 
    },


    // connect with a user (do signaling and establish a connection)
    // @param participantId (Meteor.userId)
    // @param options
    // @return {???} - whatever instantiation of Rtconnection returns
    //
    connect( participantId, options = {} ){
        if( Meteor.userId() === null ){
            throw new Error( 'in order to connect to someone, being logged in is required' );
        }
        if( typeof participantId !== 'string' || participantId.trim().length <= 0 ){
            throw new Error( 'the participants userId has to be defined' );
        }

        const self = this;

        const existingRtconnection = RtcPool.with( participantId );
        if( existingRtconnection !== null){
            return existingRtconnection;
        }
        
        options.configs = self._resolveConfig( options.configs );
        const rtcPromise = new Rtconnection( participantId, options );
        
        return self._wrapRtconnectionPromise( rtcPromise, options.configs );
    },

    // @param participantId {String} disconnects specific participant
    //                      {undefined} disconnects ALL participants
    // @return {Number} - amount of affected connections
    disconnect( participantId ){
        if( typeof participantId !== 'string' && typeof participantId !== 'undefined' ){
            return Promise.reject( new Error( 'disconnect:invalid argument' ) ); 
        }
        
        let rtcs = [];

        if( typeof participantId === 'string' ){
            const rtc = RtcPool.with( participantId );
            if( rtc !== null ){ rtcs.push( rtc ); }
        }else if( Match.test( participantId, Rtconnection ) ){
            rtcs.push( participantId );
        }else if( typeof participantId === 'undefined' ){
            rtcs = RtcPool.all();
        }else{
            return 0;
        }

        let promises = rtcs.map( ( rtc )=>{
            const rtcId = rtc.id;
            return rtc.close().then( ()=>{ RtcPool.remove( rtcId ); });
        });

        Promise.all( promises );
        
        return promises.length;
    },
    
    
    incoming( handler, filter ){
        const self = this;
        
        if( typeof handler !== 'function' ){
            throw new Error( 'handler is not defined' );
        }
       
        self.on( 'incoming', ( participantId, options )=>{
            if( typeof filter === 'function' && !filter( participantId, options.configs ) ){
                return Meteor.call( 'signaling.decline', options.id );
            }
            const rtcPromise = new Rtconnection( participantId, options );
            return handler( self._wrapRtconnectionPromise( rtcPromise, options.configs ) );
        });
    },


    accepting( options ){
        const self = this;
        const userId = Meteor.userId();
        
        if( userId === null ){
            throw new Error( 'to receive incoming Connections, you have to be logged in' );
        }

        if( incomingSignalingObservation !== null ){
            return;
        }

        const cursor = Signalings.find(
            {
                'recipient.userId': userId
            }
        );
        
        incomingSignalingObservation = cursor.observeChanges({

            added( docId, fields = {} ){

                const { dispatcher } = fields;
                
                if( typeof dispatcher.sdp !== 'string'
                        && typeof dispatcher.userId !== 'string' ){
                    return;
                }

                const getsHandled = self._trigger( 'incoming',
                    dispatcher.userId,
                    {
                        configs: self._resolveConfig( options ),
                        sdp: dispatcher.sdp,
                        id: docId
                    }
                );
                
                if( !getsHandled ){
                    Meteor.call( 'signaling.decline', docId );
                }
            },

            
            removed( docId ){
                // can either be done by dispatcher or recipient

                const connection = RtcPool.get( docId );

                if( connection !== null && typeof connection === 'object' ){
                    if( connection.state !== 'closed' ){
                        // here a connection where closed remotely
                        self.disconect( connection );
                    }
                }else{
                    self._trigger( 'withdrawn', docId );
                }
            }
        });
    },

    blocking(){
        const self = this;
        incomingSignalingObservation.stop();
        incomingSignalingObservation = null;
        self.state = 'block';
    },

    
    _resolveConfig( configs = {} ){
        const self = this;
        
        const cleanedConfig = Rtconfiguration.clean( configs );
        const mergedConfig = Object.assign( {}, self._rtconfiguration, cleanedConfig );

        return mergedConfig;
    },
    
    
    _wrapRtconnectionPromise( rtcPromise, configs ){
        if( !Match.test( rtcPromise, Promise )){
            return Promise.reject( new Error( 'RtcManager._prepRtcPromise:invalid argument' ) );
        }
        
        const self = this;
        const { audio, video, data } = configs;
        
        
        return rtcPromise.then( ( rtc )=>{
            
            if( !Match.test( rtc, Rtconnection )){
                return Promise.reject( new TypeError( 'no type of Rtconnection' ) );
            }
            
            RtcPool.add( rtc );
            rtc.on( 'terminated', ( rtcId )=>{
                self.disconnect( rtcId );
            });
            
            let promises = [];
            
            if( audio || video ){
                const promise = new Promise( ( __ful, rej__ )=>{
                    Tracker.autorun( ( c )=>{
                        if( rtc.stream !== null ){
                            __ful();
                            c.stop();
                        }
                    });
                });
                promises.push( promise );
            }
            
            if( data ){
                promises = rtc._allParticipants().reduce( ( promises, participantId )=>{
                    const { sockets = [] } = rtc._participants[ participantId ];
                    return promises.concat( 
                        sockets.map( ( socket )=>{
                            return new Promise( ( __ful, rej__ )=>{
                                Tracker.autorun( ( c )=>{
                                    if( socket.state === 'verified' ){
                                        __ful();
                                        c.stop();
                                    }
                                });
                            });
                        })
                    );
                }, promises );
            }
            
            return Promise.all( promises ).then( ()=>{ return Promise.resolve( rtc ); } );
        });
    },
    
    
    _getConnectionInstance( identifier ){
        if( typeof identifier !== 'string' || identifier.trim().length <= 0 ){
            throw new TypeError( 'invalid argument' );
        }
        
        let rtc = RtcPool.with( identifier );
        if( rtc !== null ){
            return rtc;
        }
        rtc = RtcPool.get( identifier );
        return rtc;
    }

});



export { RtcManager as default };
