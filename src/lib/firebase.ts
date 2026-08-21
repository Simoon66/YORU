import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, collection, doc, getDoc, setDoc } from 'firebase/firestore';
const firebaseConfig = {
  apiKey: "AIzaSyC8uJw5pSdOFvPX0MCBQhBZt12HAL1_0bg",
  authDomain: "yuro-live.firebaseapp.com",
  databaseURL: "https://yuro-live-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "yuro-live",
  storageBucket: "yuro-live.firebasestorage.app",
  messagingSenderId: "907964173677",
  appId: "1:907964173677:web:5b701af913ecdb8e221e64",
  measurementId: "G-Z2DWP302PR"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

let googleSignInPromise: Promise<any> | null = null;

export const signInWithGoogle = async () => {
  if (googleSignInPromise) {
    return googleSignInPromise;
  }

  googleSignInPromise = (async () => {
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
    } catch (error: any) {
      if (
        error?.code === "auth/popup-closed-by-user" || 
        error?.code === "auth/cancelled-popup-request"
      ) {
        // Harmless cancellation / user closed the popup window
        return null;
      }
      throw error;
    } finally {
      googleSignInPromise = null;
    }
  })();

  return googleSignInPromise;
};

export const logout = () => signOut(auth);
