
'use strict';


import { Meteor } from 'meteor/meteor';

import Signalings from './../../shared/collections/signalings';



const signalingsApi = {
    
    exists( dispatcherId, recipientId ){
        if( arguments.length === 1 ){
            if( dispatcherId === Meteor.userId() ){
                throw new Error( 'no recipient ID provided' );
            }
            recipientId = dispatcherId;
            dispatcherId = Meteor.userId();
        }


        const result = Signalings.find({
            'dispatcher.userId': dispatcherId,
            'recipient.userId': recipientId
        });

        const count = result.count();

        if( count === 1 ){
            return result.fetch()[ 0 ]._id;
        }else if( count < 1 ){
            return null;
        }else{
            throw new Error( 'a signaling of two individual participants has to be unique' );
        }

    },

    cleanup( userId ){
        if( typeof userId !== 'string' || userId.trim().length <= 0 ){
            return new Promise.reject( new Error( 'invalid argument' ) );
        }

        return new Promise( ( __ful, rej__ )=>{

            Signalings.remove(
                {
                    $or: [
                        { 'dispatcher.userId': userId },
                        { 'recipient.userId': userId }
                    ]
                },
                ( err, res )=>{
                    if( typeof err !== 'undefined' && err !== null ){
                        return rej__( err );
                    }
                    return __ful( res );
                }
            );

        });

    }
};



export { signalingsApi as default };
