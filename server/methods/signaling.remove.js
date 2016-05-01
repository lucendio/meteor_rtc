
'use strict';


import Future from 'fibers/future';

import { Meteor } from 'meteor/meteor';

import { SimpleSchema } from 'meteor/aldeed:simple-schema';

import Signalings from './../collections/signalings';



Meteor.methods({


    'signaling.remove': function( participantId ){
        const userId = this.userId;
        if( userId === null ){
            throw new Meteor.Error( 'permission-denied', 'user is not logged in' );
        }

        if( typeof participantId !== 'string'
            || participantId.trim().length <= 0
            || !SimpleSchema.RegEx.Id.test( participantId ) ){
            throw new Meteor.Error( 'missed-argument', 'dispatcherId has to be defined' );
        }


        const future = new Future();


        Signalings.remove(
            {
                $or: [
                    {
                        'dispatcher.userId': userId,
                        'recipient.userId': participantId
                    },
                    {
                        'dispatcher.userId': participantId,
                        'recipient.userId': userId
                    }
                ]
            },
            ( err, affected )=>{
                if( typeof err !== 'undefined' && err !== null ){
                    future.throw( err );
                }else{
                    future.return( affected );
                }
            }
        );

        return future.wait();
    }

});
