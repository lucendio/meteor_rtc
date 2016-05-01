
'use strict';


import { Tracker } from 'meteor/tracker';



function ReactiveStateMachine( initialState ){
    if( typeof initialState !== 'string' || initialState.trim().length <= 0 ){
        throw new TypeError( 'invalid initial state' );
    }
    
    this._state = initialState;
    this._stateDeps = new Tracker.Dependency();
}


Object.merge( ReactiveStateMachine.prototype, {
    
    constructor: ReactiveStateMachine,
    
    get state(){
        const self = this;
        if( typeof self._stateDeps !== 'undefined' ){ 
            self._stateDeps.depend(); 
        }
        return self._state;
    },
    
    set state( newState ){
        const self = this;
        
        if( self._state === newState ){
            return;
        }
        
        self._state = newState;
        if( typeof self._stateDeps !== 'undefined' ){ 
            self._stateDeps.changed();
        }
    }
    
});



export { ReactiveStateMachine as default };
