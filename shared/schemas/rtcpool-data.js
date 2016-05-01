
'use strict';


import { SimpleSchema } from 'meteor/aldeed:simple-schema';



const rtcPoolData = new SimpleSchema({
    rtcId: {
        type: String,
        label: 'rtconnection/sginaling identifier'
    },
    participants: {
        type: [ String ],
        label: 'participants',
        optional: true,
        custom(){
            const { isInsert, isUpsert } = this;
            if( isInsert || isUpsert ){
                return 'required';
            }
        }
    },
    ts: {
        type: Number,
        label: 'timestamp',
        autoValue( doc ){
            const { isInsert, isUpsert } = this;
            if( isInsert || isUpsert ){
                return Date.now();
            }
        },
        optional: true
    }
});



export { rtcPoolData as default };
