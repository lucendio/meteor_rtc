
'use strict';


import Signalings from './../../shared/collections/signalings';



Signalings.allow({
    insert( userId, doc ){
        return true;
    },

    update( userId, doc, fieldName, modifier ){
        return true;
    },

    remove( userId, doc ){
        return true;
    },

    fetch: [],

    transform: null
});
