import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";

const firebaseConfig = {
  projectId: "ai-studio-remixyoru-a104dab9-25b8-47f5-87dc-4ee5ad263997"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  const q = query(collection(db, "users"), where("email", "==", "titumamma2425@gmail.com"));
  const snap = await getDocs(q);
  snap.forEach(d => console.log(d.id, d.data()));
  process.exit();
}
run();
