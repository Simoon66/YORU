import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, updateDoc } from "firebase/firestore";
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  const snap = await getDocs(collection(db, 'anime'));
  for (const d of snap.docs) {
    const data = d.data();
    if (data.seasons) {
      let changed = false;
      const seen = new Set();
      const newSeasons = [];
      for (const s of data.seasons) {
        if (seen.has(s.id)) {
          s.id = s.id + '_' + Date.now() + Math.random().toString(36).substring(7);
          changed = true;
        }
        seen.add(s.id);
        newSeasons.push(s);
      }
      if (changed) {
        console.log(`Fixing anime ${d.id}`);
        await updateDoc(doc(db, 'anime', d.id), { seasons: newSeasons });
      }
    }
  }
  console.log('done');
  process.exit(0);
}
run();
