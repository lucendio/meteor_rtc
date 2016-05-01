
'use strict';


import { SimpleSchema } from 'meteor/aldeed:simple-schema';



const participant = new SimpleSchema({
    userId: {
        type: String,
        label: 'userId',
        regEx: SimpleSchema.RegEx.Id,
        custom(){
            if( this.isInsert && !this.isSet ){
                return 'required';
            }
        },
        optional: true
    },
    sdp: {
        type: String,
        label: 'sdp',
        autoValue(){
            if( !this.isSet && ( this.isUpsert || this.isUpdate ) ){
                this.isSet = true;
                this.operator = '$unset';
                this.value = '';
            }
        },
        optional: true
    },
    ts: {
        type: Number,
        label: 'timestamp',
        autoValue( doc ){
            var sdp = this.siblingField( 'sdp' );
            if( sdp.isSet ){
                return Date.now();
            }else if( this.isUpsert || this.isUpdate ){
                this.isSet = true;
                this.operator = '$unset';
                this.value = '';
            }
        },
        optional: true
    }
});


const signaling = new SimpleSchema({
    dispatcher: {
        type: participant,
        label: 'dispatcher'
    },
    recipient: {
        type: participant,
        label: 'recipient',
        optional: true
    }
});



export { 
    signaling as default,
    participant
};
