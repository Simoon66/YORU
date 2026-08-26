const admin = require('firebase-admin');
const serviceAccount = require('./firebase-applet-config.json');

// Initialize without credential if running in the same environment, 
// but wait, we are in node. We don't have the private key!
