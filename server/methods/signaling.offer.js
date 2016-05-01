
'use strict';


import Future from 'fibers/future';

import { Meteor } from 'meteor/meteor';

import Signalings from './../collections/signalings';



Meteor.methods({


    'signaling.offer': function( recipientId, sdp ){
        const userId = this.userId;
        if( userId === null ){
            throw new Meteor.Error( 'permission-denied', 'user is not logged in' );
        }

        if( typeof recipientId !== 'string' || recipientId.trim().length <= 0 ){
            throw new Meteor.Error( 'missed-argument', 'recipientId has to be defined' );
        }
        if( typeof sdp !== 'string' ){
            throw new Meteor.Error( 'missed-argument', 'sdp has to be defined' );
        }

        const signalingId = Signalings.api.exists( userId, recipientId.trim() );
                
        const future = new Future();
        

        if( signalingId === null ){

            Signalings.insert(
                {
                    dispatcher: {
                        userId: userId,
                        sdp: sdp
                    },
                    recipient: {
                        userId: recipientId.trim()
                    }
                },
                ( err, newDocId )=>{
                    if( typeof err !== 'undefined' && err !== null ){
                        future.throw( err );
                    }else{
                        future.return( newDocId );
                    }
                }
            );

        }else{

            Signalings.upsert(
                {
                    'dispatcher.userId': userId,
                    'recipient.userId': recipientId.trim()
                },
                {
                    $set: {
                        'dispatcher.sdp': sdp
                    }
                },
                ( err, affected )=>{
                    if( typeof err !== 'undefined' && err !== null ){
                        future.throw( err );
                    }else{
                        future.return( signalingId );
                    }
                }
            );

        }


        return future.wait();
    }


});
