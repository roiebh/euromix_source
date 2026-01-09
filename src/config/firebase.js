import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  // *** הכנס כאן את פרטי ה-Firebase שלך ***
  apiKey: "YOUR_API_KEY",
  authDomain: "euromix-sources.firebaseapp.com",
  projectId: "euromix-sources",
  storageBucket: "euromix-sources.firebasestorage.app",
  messagingSenderId: "125861053780",
  appId: "1:125861053780:web:11810b2596041e98f174c1",
  measurementId: "G-D5R5KXG86H"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
