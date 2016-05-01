
'use strict';


import { Meteor } from 'meteor/meteor';

import Signalings from './../collections/signalings';



Meteor.publish( 'signalings.all', function(){
    const userId = this.userId;
    
    if( userId === null ){
        throw new Meteor.Error( 'permission-denied', 'user is not logged in' );
    }
    

    return Signalings.find({
        $or: [
            { 'recipient.userId': userId },
            { 'dispatcher.userId': userId }
        ]
    });
});
