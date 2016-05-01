
'use strict';


import { Match } from 'meteor/check';



const DEFAULTS = {

    connection: {
        configuration: {
            iceServers: [
                {
                    urls: 'stun:stun.stunprotocol.org:3478'
                },
                {
                    urls: 'stun:stun.services.mozilla.com'
                },
                {
                    urls: 'stun:stun3.l.google.com:19302'
                }
            ]
        },
        options: {
            optional: [

                { DtlsSrtpKeyAgreement: true }, // turn on TLS over client2client connection

                { RtpDataChannels: true } // allow DataChannel
            ]
        }
    },


    // NOTE: on Chrome - if only a DataChannel is needed, there has to be at least one
    // media set to be true as well - not sure whether its a bug or not, it
    // doesnt make any sense
    //
    sdpConstraints: {
        mandatory: {
            OfferToReceiveAudio: false,
            OfferToReceiveVideo: false
        }
    },


    // NOTE:
    // for UDP semantic, set ordered: false & maxRetransmits
    channel: {

        //id: String,

        ordered: true,              // SCTP on per default, so is ordered = reliable = true

        // NOTE: new name will be: maxPacketLifeTime
        maxRetransmitTime: null,    // milliseconds; default: 3000 (forces unreliable mode)

        maxRetransmits: null,       // count, default: 5 (forces unreliable mode)

        protocol: '',               // will fail if unsupported

        negotiated: false           // true: automatically | false: manually
                                    // ...creating a channel on the other side

    },


    options: {

    }

};

Object.freeze( DEFAULTS );


const DEFAULTS_BASIC = {
    ices: null,
    video: false,
    audio: false,
    data: true,
    reliable: true
};

Object.freeze( DEFAULTS_BASIC );


const SCHEMA_BASIC = {
    ices: Match.Maybe( Match.OneOf( [ String ], null ) ),
    video: Match.Maybe( Boolean ),
    audio: Match.Maybe( Boolean ),
    data: Match.Maybe( Boolean ),
    reliable: Match.Maybe( Boolean )
};

Object.freeze( SCHEMA_BASIC );


const Rtconfiguration = {
  
    defaults: {
        get basic(){
            return Object.assign( {}, DEFAULTS_BASIC );
        },
        get full(){
            return Object.assign( {}, DEFAULTS );
        } 
    },
    
    clean( config = {} ){
        if( Match.test( config, SCHEMA_BASIC ) ){
            return config;
        }
        
        const cleanedRtconfiguration = Object.keys( config ).reduce( ( newOptions, optionName )=>{
            const { [ optionName ]: pattern } = SCHEMA_BASIC;
            const { [ optionName ]: value } = config;
            if( typeof  pattern !== 'undefined' && Match.test( value, pattern ) ){
                newOptions[ optionName ] = value;
            }
            return newOptions;
        }, { /* newOptions */ } );
        
        if( !Match.test( cleanedRtconfiguration, SCHEMA_BASIC ) ){
            throw new Error( 'invalid config' );
        }
        
        return cleanedRtconfiguration;
    },
    
    resolve( options = {} ){
        if( !Match.test( options, SCHEMA_BASIC ) ){
            throw new Error( 'invalid options' );
        }
        
        const config = Object.assign( {}, DEFAULTS_BASIC, options );
        
        let {
            ices,
            video,
            audio,
            data,
            reliable
        } = config;
        
        
        let rtcConfig = Object.assign( {}, DEFAULTS );
        
        
        if( typeof ices !== 'undefined' && ices !== null ){

            const ICESERVERS = rtcConfig.connection.configuration.iceServers;

            if( typeof ices === 'string' ){
                ices = [
                    {
                        urls: ices
                    }
                ];
            }

            let ices = ices.map( ( ice )=>{
                if( typeof ice === 'string'){
                    return {
                        urls: ice
                    };
                }
                if( typeof ice === 'object'){
                    return ice;
                }
            });

            rtcConfig.connection.configuration.iceServers = ices.concat( ICESERVERS );
        }


        if( typeof video === 'boolean' ){
            rtcConfig.sdpConstraints.mandatory.OfferToReceiveVideo = video;
        }


        if( typeof audio === 'boolean' ){
            rtcConfig.sdpConstraints.mandatory.OfferToReceiveAudio = audio;
        }


        if( typeof data === 'boolean' ){
            rtcConfig.connection.options.optional.forEach( ( config, key )=>{
                if( typeof config.RtpDataChannels !== 'undefined'){
                    rtcConfig.connection.options.optional[ key ].RtpDataChannels = options.data;
                }
            });
        }


        if( typeof reliable === 'boolean' ){
            if( reliable === true){
                rtcConfig.channel.ordered = true;

                rtcConfig.channel.maxRetransmitTime = null;
                rtcConfig.channel.maxRetransmits = null;
            }else{
                rtcConfig.channel.ordered = false;

                rtcConfig.channel.maxRetransmitTime = 3000;
                rtcConfig.channel.maxRetransmits = 3;
            }
        }

        return rtcConfig;
    }
    
};



export { Rtconfiguration as default };
