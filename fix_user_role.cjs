const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { readFileSync } = require('fs');

// We need to use firebase-admin if we have service account credentials to bypass rules.
// But we only have firebase-applet-config.json which is client credentials.
