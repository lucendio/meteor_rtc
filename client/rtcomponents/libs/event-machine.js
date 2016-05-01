
'use strict';


// TODO: implement and store cb for errors and wrap apply in try-catch


import { Match } from 'meteor/check';



function EventMachine(){
    this._events = {};
}


Object.merge( EventMachine.prototype, { 

    constructor: EventMachine,

    on( eventNames, handler ){

        if( typeof handler !== 'function' ){
            throw new TypeError( 'fn has to be a function');
        }
        
        if(typeof eventNames === 'string' ){
            eventNames = [ eventNames ];
        }
        
        if( !Match.test( eventNames, [ String ] ) ){
            throw new TypeError( 'eventName(s) argument invalid' );
        }
        
        const self = this;
    
        handler = handler.bind( self );
        
        eventNames.map( ( eventName )=>{
            if( typeof self._events[ eventName ] === 'undefined' ){
                self._events[ eventName ] = [];
            }
            self._events[ eventName ].push( handler );
        });
        
        return handler;
    },
    
    
    when( eventName ){
        const self = this;
        
        return new Promise( ( __ful, rej__ )=>{
            const handler = self.on( eventName, __ful );
        });
    },
    
    
    // NOTE: does not work if more then one identical functions were registered
    // @return {Boolean} - after the first handler has been found and deleted, 
    //                     the functions returns
    //
    off( eventNames, fn ){
        if( arguments.length === 0 ){
            throw new Error( 'invalid argument(s)' );
        }
        
        const self = this;

        if(typeof eventNames === 'string' ){
            eventNames = [ eventNames ];
        }
        
        if( arguments.length === 1 && typeof eventNames === 'function' ){
            fn = eventNames;
            eventNames = Object.keys( self._events );
        }
        
        if( fn === null ){
            return false;    
        }
    
        return eventNames.reduce( ( succeeded, nameName )=>{
            if( typeof fn === 'undefined' ){
                delete self._events[ nameName ];
                return true;
            }
    
            for( let i = 0; i < self._events[ nameName ].length; i += 1 ){
                if( self._events[ nameName ][ i ] === fn ){
                    self._events[ nameName ].splice( i, 1 );
                    fn = undefined;
                    return true;
                }
            }
            
            return succeeded;
        }, false );
    },
    
    
    _trigger( eventName /*, args*/ ){
        const self = this;
        
        const { [ eventName ]: eventArray = [] } = self._events;
        const args = Array.from( arguments );
        args.shift();
        eventArray.map( ( handler )=>{ handler.apply( self, args ); } );
        return eventArray.length > 0;
    }
});



export { EventMachine as default };
