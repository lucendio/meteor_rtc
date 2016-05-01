
'use strict';


import Future from 'fibers/future';

import { Meteor } from 'meteor/meteor';

import { SimpleSchema } from 'meteor/aldeed:simple-schema';

import Signalings from './../collections/signalings';



Meteor.methods({


    'signaling.answer': function( dispatcherId, sdp ){
        const userId = this.userId;
        if( userId === null ){
            throw new Meteor.Error( 'permission-denied', 'user is not logged in' );
        }

        if( typeof dispatcherId !== 'string'
            || dispatcherId.trim().length <= 0
            || !SimpleSchema.RegEx.Id.test( dispatcherId ) ){
            throw new Meteor.Error( 'missed-argument', 'dispatcherId has to be defined' );
        }
        if( typeof sdp !== 'string' ){
            throw new Meteor.Error( 'missed-argument', 'sdp has to be defined' );
        }

        const signalingId = Signalings.api.exists( dispatcherId.trim(), userId );

        if( signalingId === null ){
            throw new Meteor.Error( 'there is no such offer to answer on' );
        }
        
        
        const future = new Future();

        Signalings.update(
            {
                _id: signalingId
            },
            {
                $set: {
                    'recipient.sdp': sdp
                }
            },
            function( err, affected ){
                if( typeof err !== 'undefined' && err !== null ){
                    future.throw( err );
                }else{
                    future.return( signalingId );
                }
            }
        );

        return future.wait();
    }
    

});
