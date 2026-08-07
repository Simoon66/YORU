import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, collection, doc, getDoc, setDoc } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Check if user document exists, if not create it
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    
    const isAdmin = user.email === 'simoonabdulla@gmail.com' || user.email === 'kamaluddin124578@gmail.com';
    let role = isAdmin ? 'admin' : 'user';

    if (!userSnap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: role,
        createdAt: Date.now()
      });
    } else if (isAdmin && userSnap.data().role !== 'admin') {
      await setDoc(userRef, { role: 'admin' }, { merge: true });
    }
    
    return user;
  } catch (error) {
    if ((error as any).code === "auth/popup-closed-by-user") { console.log("Login popup closed"); return null; } console.error("Error signing in with Google:", error);
    throw error;
  }
};

export const logout = () => signOut(auth);
