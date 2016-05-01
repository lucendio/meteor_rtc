
'use strict';


// NOTE: an addition to the webrtc.adapter
//       since google hasnt implement the mediaDevices API
//       additionally the webrtc.adapter polyfills navigator.getUserMedia


const { navigator } = window;

if( typeof navigator.mediaDevices === 'undefined' ){
    navigator.mediaDevices = {};
}

if( typeof navigator.mediaDevices.getUserMedia === 'undefined' 
        && typeof navigator.getUserMedia === 'function' ){
    navigator.mediaDevices.getUserMedia = function( constraints ){
        return new Promise(( __ful, rej__ )=>{
            navigator.getUserMedia( constraints, __ful, rej__ );
        });
    };
}

