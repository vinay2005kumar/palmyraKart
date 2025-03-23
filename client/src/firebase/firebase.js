import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue,get,update,runTransaction } from "firebase/database";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged,linkWithCredential,EmailAuthProvider,getRedirectResult,signInWithRedirect } from "firebase/auth";
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,  // ✅ Add this
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};
// console.log('firebase',firebaseConfig)
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app); 
export { database, ref, set, onValue, get,getAuth, update, signInWithPopup, GoogleAuthProvider, linkWithCredential,auth,EmailAuthProvider,signInWithRedirect,getRedirectResult,runTransaction};
