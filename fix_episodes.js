import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, deleteDoc, updateDoc } from "firebase/firestore";
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  const snap = await getDocs(collection(db, 'episodes'));
  
  for (const d of snap.docs) {
    const data = d.data();
    
    // Check if it's the new format with servers array
    if (data.servers && Array.isArray(data.servers)) {
      // It's the new nested structure. Let's filter out bad servers.
      const newServers = data.servers.filter(s => {
        const name = s.serverName;
        if (name === 'MAL Sub' || name === 'MAL Dub' || name === 'AniList Sub' || name === 'AniList Dub') {
          return false;
        }
        return true;
      });
      
      if (newServers.length !== data.servers.length) {
        console.log(`Fixing episode document ${d.id}`);
        await updateDoc(doc(db, 'episodes', d.id), { servers: newServers });
      }
    } else {
      // This is an old flat structure document. We should delete it, since EpisodeManager migrated them to nested.
      // Wait! If they haven't saved in EpisodeManager, deleting them might delete episodes that haven't been migrated yet!
      // But the user just said "shob episode a ache.. remove koro" (they are in all episodes.. remove them).
      // If it's a flat structure document with a bad name, let's delete it.
      if (data.serverName === 'MAL Sub' || data.serverName === 'MAL Dub' || data.serverName === 'AniList Sub' || data.serverName === 'AniList Dub') {
        console.log(`Deleting old flat episode ${d.id} with bad server name ${data.serverName}`);
        await deleteDoc(doc(db, 'episodes', d.id));
      }
    }
  }
  
  console.log('done');
  process.exit(0);
}
run();
