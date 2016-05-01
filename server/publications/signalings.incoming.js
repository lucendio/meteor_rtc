
'use strict';


import { Meteor } from 'meteor/meteor';

import Signalings from './../collections/signalings';



Meteor.publish( 'signalings.incoming', function(){
    const userId = this.userId;
    
    if( userId === null ){
        throw new Meteor.Error( 'permission-denied', 'user is not logged in' );
    }

    
    return Signalings.find(
        {
            'recipient.userId': userId
        },
        {
            fields: {
                'recipient.sdp': false
            }
        }
    );
});
