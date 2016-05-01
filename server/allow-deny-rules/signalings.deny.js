
'use strict';


import Signalings from './../../shared/collections/signalings';



Signalings.deny({
    insert( userId, doc ){
        if( userId && userId === doc.dispatcher.userId ){
            return false;
        }
        return true;
    },

    update( userId, doc, fieldName, modifier ){
        if( userId 
            && ( userId === doc.dispatcher.userId 
                 || userId === doc.recipient.userId )
        ){
            return false;
        }
        return true;
    },

    remove( userId, doc ){
        if( userId ){
            if( userId === doc.dispatcher.userId ){
                return false;
            }else if( userId === doc.recipient.userId
                      && typeof doc.recipient.sdp === 'undefined' ){
                return false;
            }
        }
        return true;
    },

    fetch: [ 'dispatcher', 'recipient' ],

    transform: null
});
