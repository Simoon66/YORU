const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
const { readFileSync } = require('fs');

const config = JSON.parse(readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function run() {
  try {
    const snap = await getDocs(collection(db, 'users'));
    snap.forEach(doc => {
      console.log(doc.id, doc.data().email, doc.data().role);
    });
    console.log("Done");
  } catch(e) {
    console.error(e);
  }
}
run();
