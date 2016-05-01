
'use strict';


import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';



function Firewall(){
    const self = this;

    let inSubHandler = null;
    let outSubHandler = null;


    let _incoming = null;
    let _inDeps = new Tracker.Dependency();

    let _outgoing = null;
    let _outDeps = new Tracker.Dependency();


    self.in = {
        allow(){
            if( inSubHandler !== null ){
                return;
            }

            inSubHandler = Meteor.subscribe( 'signalings.incoming', {

                onReady(){
                    if( _incoming !== 'allowed' ){
                        _incoming = 'allowed';
                        _inDeps.changed();
                    }
                },

                onStop( err ){
                    if( typeof err !== 'undefined' ){
                        console.log( err );
                    }else{
                        if( _incoming !== 'denied' ){
                            _incoming = 'denied';
                            _inDeps.changed();
                        }
                    }
                    console.log( 'incoming stopped' );
                }
            });

        },

        deny(){
            if( inSubHandler === null ){
                return;
            }

            inSubHandler.stop();
            inSubHandler = null;
        },

        get is(){
            _inDeps.depend();
            return _incoming;
        }
    };

    self.out = {
        allow(){

            if( outSubHandler !== null ){
                return;
            }

            outSubHandler = Meteor.subscribe( 'signalings.outgoing', {

                onReady(){
                    if( _outgoing !== 'allowed' ){
                        _outgoing = 'allowed';
                        _outDeps.changed();
                    }
                },

                onStop( err ){
                    if( typeof err !== 'undefined' ){
                        console.log( err );
                    }else{
                        if( _outgoing !== 'denied' ){
                            _outgoing = 'denied';
                            _outDeps.changed();
                        }
                    }
                    console.log( 'outgoing stopped' );
                }
            });
        },

        deny(){
            if( outSubHandler === null ){
                return;
            }

            outSubHandler.stop();
            outSubHandler = null;
        },

        get is(){
            _outDeps.depend();
            return _outgoing;
        }
    };

}


Object.merge( Firewall.prototype, {

    constructor: Firewall,

    allow(){
        const self = this;
        self.in.allow();
        self.out.allow();
    },

    deny(){
        const self = this;
        self.in.deny();
        self.out.deny();
    }

});



export { Firewall as default };
