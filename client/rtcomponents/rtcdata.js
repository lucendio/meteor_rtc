
'use strict';


import { Match } from 'meteor/check';
import { Tracker } from 'meteor/tracker';

import EventMachine from './libs/event-machine';
import ReactiveStateMachine from './libs/reactive-state-machine';



function RtcData( channel, participantId ){
    if( typeof channel !== 'object' || channel === null ){
        return Promise.reject( 'invalid argument: channel' );
    }
    if( typeof participantId !== 'string' || participantId.trim().length <= 0 ){
        return Promise.reject( 'invalid argument: participantId' );
    }
    
    
    const self = this;
    
    EventMachine.call( self );
    
    // verified
    // unauthorized
    // connected
    // disconnected
    // initialized
    //
    ReactiveStateMachine.call( self, 'initialized' );
    
    self._rtcDataChannel = channel;
    
    self._bindDefaultHandlersToNativeEvents();

    
    Tracker.autorun( ( c )=>{
        const state = self.state;
        console.log( `rtcData state: ${ state }` );
    });
    
    const promise = new Promise( ( __ful, rej__ )=>{
        
        const OPEN_EVENT = 'open';
        const ERROR_EVENT = 'error';
        let openHandler = null;
        let errorHandler = null; 
        
        openHandler = self.on( OPEN_EVENT, ()=>{
            __ful( self );
            self._verify( participantId );
            self.off( OPEN_EVENT, openHandler );
            self.off( ERROR_EVENT, errorHandler );
        });
        
        errorHandler = self.on( ERROR_EVENT, ( err )=>{
            rej__( err );
            self.off( ERROR_EVENT, errorHandler );
            self.off( OPEN_EVENT, openHandler );
        }); 
    });

    return promise;
}


Object.merge( RtcData.prototype, EventMachine.prototype, ReactiveStateMachine.prototype, {
   
    constructor: RtcData,
    
    get id(){
        const self = this;
        
        if( typeof self._rtcDataChannel !== 'object' || self._rtcDataChannel === null ){
            return null;
        }
        return self._rtcDataChannel.label;
    },  
   
    
    send( data ){
        if( typeof data === 'undefined' ){
            throw new TypeError( 'invalid argument' );
        }
        
        const self = this;
        
        self._rtcDataChannel.send( data );
    },
    
    
    receive( fn ){
        if( typeof fn !== 'function' ){
            throw new TypeError( 'invalid argument' );
        }
        
        const self = this;
        
        self.on( 'message', fn );
    },
    
    
    close(){
        const self = this;
        self._rtcDataChannel.close();
    },
    
    
    _verify( participantId ){
        const self = this;
        
        if( typeof participantId !== 'string' || participantId.trim().length <= 0 ){
            throw new TypeError( 'invalid argument' );
        }
        
        if( self._state !== 'connected' ){
            console.debug( 'current status is not connected, initializing verification aborted' );
            return;
        }
        
        const userId = Meteor.userId();
        
        self._rtcDataChannel.onmessage = ( e )=>{
            let msg = null;
            try{
                msg = JSON.parse( e.data );
            }catch( exp ){
                console.error( exp );
                self.state = 'unauthorized';
                self._rtcDataChannel.onmessage = null;
                return;
            }
            
            const { sender, receiver, valid, error } = msg;
            let response = null;

            if( typeof error !== 'undefined' ){
                if( error === 'unauthorized' ){
                    self.state = 'unauthorized';
                    self._trigger( 'error', error );
                }
                return;
            }
            
            if( typeof sender === 'string' && sender.trim().length > 0
                    && typeof receiver === 'string' && receiver.trim().length > 0 ){
                if( sender === participantId && receiver === userId ){
                    response = { valid: true };
                }else{
                    response = { valid: false };
                }
            }else{
                if( typeof valid === 'undefined' ){
                    response = { error: 'invalid message' };
                }else{
                    if( valid === true ){
                        self._rebindDefaultMessageHandler();
                        self._trigger( 'verified', self );
                    }else{
                        self._rtcDataChannel.onmessage = null;
                        self._trigger( 'unauthorized' );
                    }

                    return;
                }
            }

            response = JSON.stringify( response );
            self.send( response );
        };
        
        
        let msg = {
            sender: userId,
            receiver: participantId
        };
        msg = JSON.stringify( msg );
        self.send( msg );
    },
    
    
    _rebindDefaultMessageHandler(){
        const self = this;
        const eventName = 'message';
        const nativeEventName = `on${ eventName }`;
        
        self._events[ 'message' ] = [];
        
        self._rtcDataChannel[ nativeEventName ] = function(  e /*, args */ ){
            const args = [ e.data ];
            self._events[ eventName ].forEach( ( fn )=>{
                if( typeof fn === 'function' ){ fn.apply( self, args ); }
            });
        };
    },

    _bindDefaultHandlersToNativeEvents(){
        const self = this;
        
        if( Object.keys( self._events ).length > 0 ){
            throw new Error( 'event handlers are already bound' );
        }
        
        const handlers = {
            open(){
                self.state = 'connected';
            },
            close(){
                self.state = 'disconnected';
            },
            error( e ){
                console.error( e );
            },
            bufferedamountlow(){
                
            },
            
            verified(){
                self.state = 'verified';
            },
            unauthorized(){
                self.state = 'unauthorized';
            },
            
            // NOTE: following events are aliases & for compatibility to DDP 
            connect(){
                self._trigger( 'open', arguments );
            },
            disconnect(){
                self._trigger( 'close', arguments );
            }
        };
        
        const eventNames = Object.keys( handlers );
        eventNames.forEach( ( eventName )=>{
            const nativeEventName = `on${ eventName }`;
            if( typeof self._rtcDataChannel[ nativeEventName ] === 'undefined' ){
                console.debug( `event handler [${ nativeEventName }] not native` );
            }else{
                self._rtcDataChannel[ nativeEventName ] = function( /* args */ ){
                    const args = arguments;
                    self._events[ eventName ].forEach( ( fn )=>{
                        if( typeof fn === 'function' ){ fn.apply( self, args ); }
                    });
                };                
            }
            
            self.on( eventName, handlers[ eventName ] );
        });
    }
    
});



export { RtcData as default };
