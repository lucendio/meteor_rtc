
'use strict';


// import { Mongo } from 'meteor/mongo';

// import { rtcPoolData as rtcDataSchema } from './../../shared/schemas/rtcpool-data'; 



const RTCS = new Map();
// const RtcData = new Mongo.Collection( 'rtcdata', { connection: null } );
// RtcData.attachSchema( rtcDataSchema );


function _resetPool(){
    const count = RTCS.size;
    for( let [ id ] of RTCS ){
        RTCS.delete( id );
    }
    return count;
}


const RtcPool = {
    
    // @return null or Rtconnection
    //
    get( rtcId ){
        if( typeof rtcId !== 'string' ){
            throw new TypeError( 'rtcId has to be a string' );
        }

        const self = this;
        
        if( self.exists( rtcId ) !== null ){
            return RTCS.get( rtcId );
        }else{
            return null;
        }
    },
    
    
    // NOTE: 
    // @return null or Rtconnection
    //
    with( participantId ){
        if( typeof participantId !== 'string' || participantId.trim().length <= 0 ){
            throw new TypeError( 'rtcId has to be a string' );
        }
        
        for( let rtc of RTCS.values() ){
            const participantIds = rtc._allParticipants();
            const found = participantIds.find( ( id )=>{
                return id === participantId;
            });
            if( typeof found !== 'undefined' ){
                return rtc;
            }
        }
        
        return null;
    },


    add( id, rtc ){
        if( arguments.length <= 0 ){
            throw new TypeError( 'invalid arguments' );
        }
        
        if( ( typeof id !== 'string' && typeof id !== 'object' ) || id === null ){
            throw new TypeError( 'invalid id' );
        }
        
        if( typeof id === 'string' && ( typeof rtc !== 'object' || rtc === null ) ){
            throw new TypeError( 'invalid rtconnection' );
        }
        
        
        if( typeof id === 'object' ){
            rtc = id;
            
            if( typeof rtc.id !== 'string' ){
                throw new TypeError( 'invalid id' );
            }
            
            id = rtc.id;
        }

        if( RTCS.has( id ) ){
            console.warn( 'existing rtconnection will be overwritten' );
        }

        RTCS.set( id, rtc );
    },


    remove( rtc ){
        const rtcId = this.exists( rtc );
        if( rtcId === null ){
            return false;
        }
        RTCS.delete( rtcId );
    },


    // @return null or String (rtcId)
    //
    exists( rtc ){
        let rtcId = null;

        if( typeof rtc === 'undefined' ){
            return rtcId;
        }

        if( typeof rtc === 'string' ){
            rtcId = rtc.trim();
        }else if( typeof rtc === 'object' && rtc !== null && typeof rtc.id === 'string' ){
            rtcId = rtc.id;
        }else{
            console.debug( 'rtcpool.exists:no valid argument ' );
            return rtcId;
        }

        if( RTCS.has( rtcId ) ){
            return rtcId;
        }else{
            return null;
        }
    },


    // @return {Array} with a list of userIds the RtcManager is connected to
    //
    list(){
        return Array.from( RTCS.keys() );
    },


    // @returns {Array} with Rtconnections
    //
    all(){
        return Array.from( RTCS.values() );
    }
};


Object.freeze( RtcPool );



export { RtcPool as default, _resetPool };
