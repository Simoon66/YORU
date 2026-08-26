import { initializeApp } from "firebase/app";
import { getFirestore, doc, updateDoc, collection, addDoc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  projectId: "ai-studio-remixyoru-a104dab9-25b8-47f5-87dc-4ee5ad263997"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// wait, this is from admin SDK maybe? No, we don't have auth here. We can't authenticate as titumamma2425@gmail.com easily from node.js
