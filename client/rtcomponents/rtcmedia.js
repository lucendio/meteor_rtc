
'use strict';


import { Match } from 'meteor/check';



const { 
    navigator: { mediaDevices },
    URL: { createObjectURL }
} = window;

const optionsSchema = { 
    video: Match.Maybe( Boolean ), 
    audio: Match.Maybe( Boolean ) 
};


function RtcMedia( stream = {} ){
    
    const self = this;
    
    self._stream = null;
    
    if( Match.test( stream, optionsSchema ) ){
        if( mediaDevices.getUserMedia === null ){
            return Promise.reject( new Error( 'media device not available' ) );
        }
        
        const options = Object.assign( { video: false, audio: false }, stream );
        
        return mediaDevices
                .getUserMedia( options )
                .then( ( stream )=>{
                    self._stream = stream;
                    return Promise.resolve( self );
                });
    }else{
        self._stream = stream;
        return Promise.resolve( self );
    }
}


Object.merge( RtcMedia.prototype, {
   
    constructor: RtcMedia,
    
    get stream(){
        const self = this;
        return self._stream; 
    },
    
    
    get url(){
        const self = this;
        
        if( self._stream === null ){
            return null;
        }
        
        if( typeof createObjectURL !== 'function' ){
            throw new Error( 'creation of object urls not support this environment' );
        }
        
        createObjectURL( self._stream );
    }
    
});



export { RtcMedia as default };
