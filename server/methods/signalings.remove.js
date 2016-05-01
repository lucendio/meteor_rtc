
'use strict';


import Future from 'fibers/future';

import { Meteor } from 'meteor/meteor';
import { Match } from 'meteor/check';

import { SimpleSchema } from 'meteor/aldeed:simple-schema';

import Signalings from './../collections/signalings';



Meteor.methods({


    'signalings.remove': function( participantIds ){
        const userId = this.userId;
        if( userId === null ){
            throw new Meteor.Error( 'permission-denied', 'user is not logged in' );
        }

        if( typeof participantIds === 'string' ){
            participantIds = [ participantIds ];
        }
        
        if( !Match.test( participantIds, [ String ] ) ){
            throw new Meteor.Error( 'invalid-argument', 'dispatcherIds needs to be defined' );
        }


        const $or = participantIds.reduce( ( selector, participantId )=>{
            selector.push(
                {
                    'dispatcher.userId': userId,
                    'recipient.userId': participantId
                },
                {
                    'dispatcher.userId': participantId,
                    'recipient.userId': userId
                }
            );
            return selector;
        }, [ /*selector*/ ] );
        
        
        const future = new Future();


        Signalings.remove(
            { $or },
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
