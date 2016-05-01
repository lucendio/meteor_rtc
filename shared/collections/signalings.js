
'use strict';


import { Mongo } from 'meteor/mongo';

import signaling from './../schemas/signaling.participant';



const Signalings = new Mongo.Collection( 'signalings' );

Signalings.attachSchema( signaling );



export { Signalings as default };
