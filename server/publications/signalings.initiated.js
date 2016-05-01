
'use strict';


import { Meteor } from 'meteor/meteor';
import { Match } from 'meteor/check';

import Signalings from './../collections/signalings';



Meteor.publish( 'signalings.initiated', function( recipientId ){
    const userId = this.userId;
    
    if( userId === null ){
        throw new Meteor.Error( 'permission-denied', 'user is not logged in' );
    }
    if( Match.test( recipientId, String) === false ){
        throw new Meteor.Error( 'permission-denied', 'recipient has to be user Id' );
    }


    return Signalings.find(
        {
            'recipient.userId': recipientId,
            'dispatcher.userId': userId
        },
        {
            fields: {
                'dispatcher.sdp': false
            }
        }
    );
});
