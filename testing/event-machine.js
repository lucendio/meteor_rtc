
'use strict';


import EventMachine from './../client/rtc/libs/event-machine';

const evm = new EventMachine();

evm.on( 'ev1', ()=>{ console.log( 'ev10' ); } );
evm.on( 'ev1', ( data )=>{ console.log( data ); } );
evm.on( 'ev2', ()=>{ console.log( 'ev2' ); } );
evm.trigger( 'ev1', { some: 'data' } );
evm.trigger( 'ev2' );
evm.off( 'ev1' );
evm.trigger( 'ev1' );
