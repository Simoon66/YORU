const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc } = require('firebase/firestore');
const { readFileSync } = require('fs');

const config = JSON.parse(readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function run() {
  try {
    const docRef = await addDoc(collection(db, 'community_posts'), {
      content: 'test',
      userId: 'test_admin'
    });
    console.log("Successfully wrote document with ID:", docRef.id);
  } catch(e) {
    console.error("Error writing document:", e.message);
  }
}
run();
