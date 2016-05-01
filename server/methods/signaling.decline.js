
'use strict';


import Future from 'fibers/future';

import { Meteor } from 'meteor/meteor';

import { SimpleSchema } from 'meteor/aldeed:simple-schema';

import Signalings from './../collections/signalings';



Meteor.methods({


    'signaling.decline': function( signalingId ){
        const userId = this.userId;
        if( userId === null ){
            throw new Meteor.Error( 'permission-denied', 'user is not logged in' );
        }

        if( typeof signalingId !== 'string'
            || signalingId.trim().length <= 0
            || !SimpleSchema.RegEx.Id.test( signalingId ) ){
            throw new Meteor.Error( 'missed-argument', 'signalingId has to be defined' );
        }


        const future = new Future();


        Signalings.remove(
            {
                $and: [
                    { 
                        _id: signalingId 
                    },
                    {
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
