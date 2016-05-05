
'use strict';


// src: https://github.com/tc39/proposal-object-getownpropertydescriptors


(function( globalNamespace ){
    
    const Object = globalNamespace.Object;
    
    // Step 1: polyfilling Object.getOwnPropertyDescriptors
    if( !Object.hasOwnProperty( 'getOwnPropertyDescriptors' ) ){
        Object.defineProperty( Object, 'getOwnPropertyDescriptors', {
            configurable: true,
            writable: true,
            value: function getOwnPropertyDescriptors( object ){
                return Reflect.ownKeys( object ).reduce( ( descriptors, key )=>{
                    return Object.defineProperty( descriptors, key, {
                        configurable: true,
                        enumerable: true,
                        writable: true,
                        value: Object.getOwnPropertyDescriptor( object, key )
                    });
                }, {});
            }
        });
    }

    // Step 2: adding Object.merge, to fix Object.assign (failing to copy setters & getters)
    if( !Object.hasOwnProperty( 'merge' ) ){
        Object.merge = function( target, ...sources ){
            sources.reduce( ( target, source )=>{
                const descriptors = Object.getOwnPropertyDescriptors( source );
                Reflect.ownKeys( descriptors ).forEach( ( key )=>{
                    if( !descriptors[ key ].enumerable ){
                        delete descriptors[ key ];
                    }
                });
                return Object.defineProperties( target, descriptors );
            }, target );
        };    
    }

}( ( typeof window !== 'undefined' ) ? window : global ));
