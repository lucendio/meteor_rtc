
'use strict';


import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import Signalings from './../../shared/collections/signalings';

import EventMachine from './libs/event-machine';
import ReactiveStateMachine from './libs/reactive-state-machine';

import Rtconfiguration from './rtconfiguration';
import RtcData from './rtcdata';
import RtcMedia from './rtcmedia';



const { 
    RTCPeerConnection, 
    navigator: { mediaDevices },
    RTCSessionDescription
} = window;


function Rtconnection( participantId, options ){
    if( typeof participantId !== 'string' || participantId.trim().length <= 0 ){
        throw new Error( 'invalid participant ID' );
    }
    
    const self = this;
    const {
        id = null,
        configs
    } = options;
    let { sdp } = options;
    
    
    EventMachine.call( self );
    
    //  initialized
    //  gathering
    //  signaling
    //  open
    //  closed
    //
    ReactiveStateMachine.call( self, 'initialized' );
    
    self._id = id;
    
    self._role = ( typeof sdp === 'undefined' ) ? 'dispatcher' : 'recipient'; 

    if( typeof configs === 'undefined' ){
        self._configs = Rtconfiguration.defaults.full;
    }else{
        self._configs = Rtconfiguration.resolve( configs );
    }

    self._rtcMediaDeps = new Tracker.Dependency();
    self._rtcMedia = null;
    
    self._rtcDataDeps = new Tracker.Dependency();

    self._participants = {};

    const { configuration: rtpcConfig, options: rtpcOptions } = self._configs.connection;

    self._rtcPeerConnection = new RTCPeerConnection( rtpcConfig, rtpcOptions );

    self._bindDefaultHandlersToNativeEvents();
    self._addParticipant( participantId );


    const { video, audio, data } = configs;
    const chain = [];
    
    if( video === true || audio === true ){
        const promise = new RtcMedia( { video, audio } );
        
        promise.then( ( rtcm )=>{
            self._rtcPeerConnection.addStream( rtcm.stream );
            self._rtcMedia = rtcm;
            self._rtcMediaDeps.changed();
        });
       
        chain.push( promise );
    }

   
    if( self._role === 'dispatcher' ){

        if( data === true ){
            const promise = new Promise( ( __ful, rej__ )=>{
                const self = this;
        
                const channel = self._rtcPeerConnection.createDataChannel(                    
                    // NOTE: can be used fo initial data exchange, handshakes etc.
                    Random.secret( 23 )                    
                    
                    // [20150323] NOTE: currently chrome does not like a config
                    //, this.configs.channel  
                );
        
                __ful();
                
                const rtcDataPromise = new RtcData( channel, participantId );
                rtcDataPromise
                    .then( ( rtcData )=>{
                        // NOTE: will only be added __after__ channel has reached state 'connected'
                        self._addSocket( rtcData, participantId );
                        self._trigger( 'channelopened', rtcData );
                    })
                    .catch( ( exc )=>{
                        console.error( exc );
                    });
            });
            chain.push( promise );
        }
     
        chain.push( 
            self._gathering()
                .then( ( localSdp )=>{
                    return self._pushing( localSdp, participantId );
                })
                .then( ( signalingId )=>{
                    return self._awaiting( signalingId );
                })
        );
    }


    if( self._role === 'recipient' ){
      
        try{
            self._mount( sdp );
        }catch( exc ){
            return Promise.reject( exc );
        }

        chain.push( 
            self._gathering()
                .then( ( localSdp )=>{
                    return self._pushing( localSdp, participantId );
                })
        );
    }

        
    if( data === true ){
        const promise = new Promise( ( __ful, rej__ )=>{
            self.on( 'channelopened', __ful );
        });
        chain.push( promise );
    }

  
    chain.push( Promise.resolve( self ) );
   
    return chain
            .reduce( ( chain, promise )=>{ 
                return chain.then( ()=>{ return promise; } ); 
            }, Promise.resolve() )
            .catch( ( err )=>{
                console.error( err );
            });
   
}


Object.merge( Rtconnection.prototype, EventMachine.prototype, ReactiveStateMachine.prototype, {

    constructor: Rtconnection,

    // NOTE:
    // - this ID will be defined by Signalings Collection on (up-)insert
    // - channel ID will be randomly defined by dispatchers constructor
    // (and automatically ship during signaling process (see ondatachannel event handler)
    // - rtconnections are stored in RtcPool via corresponding participant
    //
    get id(){
        const self = this;
        return self._id;
    },

    set id( string ){
        if( typeof string !== 'string' || string.trim().length <= 0 ){
            throw new Error( 'invalid value for ID' );
        }
        const self = this;
        if( self._id === null ){
            self._id = string;
        }else{
            throw new Error( 'Rtconnection ID cant be changed, once it is set' );
        }
    },

    get configs(){
        const self = this;
        return self._configs;
    },

    set configs( arg ){
        throw new Error( 'setter is not supported' );
    },

    get role(){
        const self = this;
        return self._role;
    },


    _addParticipant( participantId ){
        const self = this;
        if( typeof self._participants[ participantId ] !== 'undefined' ){
            throw new Error( 'participant already exists' );    
        }
        self._participants[ participantId ] = { sockets: [] };
    },
    _removeParticipant( participantId ){
        const self = this;
        if( typeof self._participants[ participantId ] === 'undefined' ){
            return false;
        }
        delete self._participants[ participantId ];
    },
    _allParticipants(){
        const self = this;
        return Object.keys( self._participants );
    },
    
    _addSocket( rtcData, participantId ){
        const self = this;
        self._participants[ participantId ].sockets.push( rtcData );
        self._rtcDataDeps.changed();
    },
    

    // @return {Boolean} - true for sending successfully, false if it could'nt get sent
    send( data ){
        if( typeof data === 'undefined' ){
            throw new TypeError( 'invalid argument' );
        }
        
        const self = this;
        
        return self._allParticipants().reduce( ( confirmed, participantId )=>{
            const { sockets = [] } = self._participants[ participantId ];
            const count = sockets.reduce( ( count, socket )=>{
                if( socket._state !== 'verified' ){
                    throw new Error( 'not authorized' );
                }
                socket.send( data );
                count += 1;
                return count;
            }, 0 );
            return confirmed === true || count > 0;
        }, false );
    },
    
    // @return {Boolean} - whether handler registration was successful or not
    receive( fn ){
        if( typeof fn !== 'function' ){
            throw new TypeError( 'invalid argument' );
        }
        
        const self = this;
        
        return self._allParticipants().reduce( ( confirmed, participantId )=>{
            const { sockets = [] } = self._participants[ participantId ];
            const count = sockets.reduce( ( count, socket )=>{
                if( socket._state !== 'verified' ){
                    throw new Error( 'not authorized' );
                }
                socket.receive( fn );
                count += 1;
                return count;
            }, 0 );
            return confirmed === true || count > 0;
        }, false );
    },
    
    close(){
        const self = this;
        
        self._allParticipants().forEach( ( participantId )=>{
            const { sockets = [] } = self._participants[ participantId ];
            sockets.forEach( ( socket )=>{
                socket.close();
            });
            delete self._participants[ participantId ];
        });
        
        self._rtcPeerConnection.close();
        
        self.state = 'closed';
        
        return new Promise( ( __ful, rej__ )=>{
            Meteor.call( 
                'signaling.remove', 
                self._allParticipants(), 
                ( err, res )=>{
                    if( typeof err !== 'undefined' && err !== null ){
                        return rej__( err );
                    }
                    return __ful( res );
                }
            );
        });
    },


    get stream(){
        const self = this;
        self._rtcMediaDeps.depend();
        if( self._rtcMedia === null ){
            return null;
        }
        return self._rtcMedia.stream;
    },


    _gathering(){
        const self = this;
        const { role, _configs: configuration, _rtcPeerConnection: rtcPC } = self;
        
        const creator = ( role === 'dispatcher' ) ? rtcPC.createOffer : rtcPC.createAnswer;
        
        self.state = 'gathering';
        
        return new Promise( function( __ful, rej__ ){

            creator.call( rtcPC,
                ( sdp )=>{
                    rtcPC.setLocalDescription( sdp );
                },

                ( err )=>{
                    if( typeof err !== 'undefined' && err !== null ){ 
                        return rej__( err ); 
                    }
                },

                configuration.sdpConstraints
            );

            const eventName = 'gatheringcompleted';
            const handler = self.on( eventName, ()=>{
                __ful( rtcPC.localDescription );
                self.off( eventName, handler );
            });

        });
    },

    // transferring locally gathered SDP to the server and therefore to the recipient
    //
    _pushing( localSdp, participantId ){
        const self = this;
        const { role } = self;
        const methodName = ( role === 'dispatcher' ) ? 'signaling.offer' : 'signaling.answer';
        
        if( localSdp === null ){
            return Promise.reject( new Error( `${ role }'s localDescription is null` ) );
        }

        if( typeof localSdp !== 'string' ){
            localSdp = JSON.stringify( localSdp );
        }

        self.state = 'signaling';
        
        return new Promise( ( __ful, rej__ )=>{
            Meteor.call( methodName,
                participantId, localSdp,
                function( err, signalingId ){
                    if( typeof err !== 'undefined' && err !== null ){
                        return rej__( err );
                    }
                    return __ful( signalingId );
                }
            );
        });
    },
    
    _awaiting( signalingId ){
        if( typeof signalingId !== 'string' || signalingId.trim().length <= 0 ){
            return Promise.reject( new Error( 'invalid signalingId' ) );
        }
        
        const self = this;
        
        const cursor = Signalings.find(
            {
                _id: signalingId
                // OR:
                // 'dispatcher.userId': Meteor.userId(),
                // 'recipient.userId': participantId
            }
        );
        
        return new Promise( ( __ful, rej__ )=>{
            
            const observation = cursor.observeChanges({

                added( docId, fields ){
                    if( typeof docId === 'string' ){
                        self._id = docId;
                    }
                },


                changed( docId, { recipient: { sdp } = {} } = {} ){
                    
                    console.debug( `signaling doc [${ docId }] has changed on dispatcher` );

                    if( typeof sdp === 'undefined' || sdp === null ){
                        return;
                    }

                    try{
                        self._mount( sdp );
                    }catch( exp ){
                        return rej__( exp );
                    }
                    
                    return __ful();
                },


                removed( docId ){
                    if( typeof observation === 'object' ){
                        observation.stop();
                    }
                    
                    if( self._state !== 'closed' ){
                        // here a connection were closed remotely, even before 
                        // it got fully established
                        self._trigger( 'terminated', docId );
                    }
                }

            });
            
        });
    },
    
    _mount( sdp ){
        if( typeof sdp !== 'string' && ( typeof sdp !== 'object' || sdp === null ) ){
            throw new Error('invalid sdp' );
        }
        
        if( typeof sdp === 'string' ){
            sdp = JSON.parse( sdp );
        }
        
        const self = this;

        const remoteSdp = new RTCSessionDescription( sdp );
        self._rtcPeerConnection.setRemoteDescription( remoteSdp );
        self._trigger( 'remotedescriptionset' );
    },
    

    _bindDefaultHandlersToNativeEvents(){
        const self = this; 
        
        if( Object.keys( self._events ).length > 0 ){
            throw new Error( 'event handlers are already bound' );
        }

        const handlers = {
            negotiationneeded( e ){
                console.debug( 'onnegotiationneeded [DEFAULTHANDLER]' );
            },
            icecandidate( e ){
                // src: https://www.w3.org/TR/webrtc/#idl-def-RTCIceGatheringState
                // new
                // gathering
                // complete
                //
                const gatheringState = self._rtcPeerConnection.iceGatheringState;
                console.debug( `onicecandidate:${ gatheringState } [DEFAULTHANDLER]` );
                
                switch( gatheringState ){
                    case 'complete': {
                        self._trigger( 'gatheringcompleted' );
                    }
                }
            },
            icecandidateerror( err ){
                self._trigger( 'error', err );
            },
            signalingstatechange( e ){
                // src: https://www.w3.org/TR/webrtc/#idl-def-RTCSignalingState
                // stable
                // have-local-offer
                // have-remote-offer
                // have-local-pranswer
                // have-remote-pranswer
                // closed
                //
                const state = self._rtcPeerConnection.signalingState;
                console.debug( `onsignalingstatechange:${ state } [DEFAULTHANDLER]` );
            },
            icegatheringstatechange( e ){
                // src: https://www.w3.org/TR/webrtc/#idl-def-RTCIceGatheringState
                // new
                // gathering
                // complete
                //
                const state = self._rtcPeerConnection.iceGatheringState;
                console.debug( `onicegatheringstatechange:${ state } [DEFAULTHANDLER]` );
            },
            iceconnectionstatechange( e ){
                // src: https://www.w3.org/TR/webrtc/#idl-def-RTCIceConnectionState
                // new
                // connecting
                // connected
                // disconnected
                // failed
                //
                const state = self._rtcPeerConnection.iceConnectionState;
                console.debug( `oniceconnectionstatechange:${ state } [DEFAULTHANDLER]` );
                
                switch( state ){
                    case 'connected': {
                        self.state = 'open';
                        break;
                    }
                    case 'failed': {
                        self._trigger( 'error', new Error( 'connection failed' ) );
                        break;
                    }
                }
            },
            connectionstatechange( e ){
                // src: https://www.w3.org/TR/webrtc/#idl-def-RTCPeerConnectionState
                // new
                // connecting
                // connected
                // disconnected
                // failed
                //
                const state = self._rtcPeerConnection.connectionState;
                console.debug( `onconnectionstatechange:${ state } [DEFAULTHANDLER]` );
            },

            track( e ){
                console.debug( 'ontrack [DEFAULTHANDLER]' );
    
                const stream = e.track;
                const promise = new RtcMedia( stream );
                promise.then( ( rtcm )=>{
                    self._rtcMedia = rtcm;
                    self._rtcMediaDeps.changed();
                });
            },

            datachannel( e ){
                console.debug( 'ondatachannel [DEFAULTHANDLER]' );
                
                const { channel } = e;
                
                // NOTE: will add new rtcData to multiple participants, if exist
                const promises = self._allParticipants().map( ( participantId )=>{
                    const rtcDataPromise = new RtcData( channel, participantId );
                    return rtcDataPromise
                        .then( ( rtcData )=>{
                            // NOTE: will only be added __after__ channel has 
                            // reached state 'connected'
                            self._addSocket( rtcData, participantId );
                            self._trigger( 'channelopened', rtcData );
                        })
                        .catch( ( exc )=>{
                            console.error( exc );
                        });
                });
            }
        };
        
        const eventNames = Object.keys( handlers );
        eventNames.forEach( ( eventName )=>{
            const nativeEventName = `on${ eventName }`;
            if( typeof self._rtcPeerConnection[ nativeEventName ] === 'undefined' ){
                console.debug( `native event [${ nativeEventName }] does not exists` ); 
            }else{
                self._rtcPeerConnection[ nativeEventName ] = function( /* args */ ){
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



export { Rtconnection as default };
