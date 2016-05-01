
'use strict';


import { Meteor } from 'meteor/meteor';

import Signalings from './../collections/signalings';



Meteor.publish( 'signalings.outgoing', function(){
    const userId = this.userId;
    
    if( userId === null ){
        throw new Meteor.Error( 'permission-denied', 'user is not logged in' );
    }

    return Signalings.find(
        {
            'dispatcher.userId': userId
        },
        {
            fields: {
                'dispatcher.sdp': false
            }
        }
    );
});
