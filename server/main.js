
'use strict';


import './../shared/shims/object.merge';

import './allow-deny-rules/signalings.allow';
import './allow-deny-rules/signalings.deny';

import './publications/signalings.all';
import './publications/signalings.initiated';
import './publications/signalings.incoming';
import './publications/signalings.outgoing';

import './methods/signaling.offer';
import './methods/signaling.answer';
import './methods/signaling.decline';
import './methods/signaling.remove';
import './methods/signalings.remove';



const Rtc = { not: 'available on server' };

Object.freeze( Rtc );



export { Rtc as default };
