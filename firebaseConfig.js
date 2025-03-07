import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBuB7vC5dE8-RCS9ywrcgmRrpB5ztJWvAc",
  authDomain: "meezak-task-manager.firebaseapp.com",
  projectId: "meezak-task-manager",
  storageBucket: "meezak-task-manager.firebasestorage.app",
  messagingSenderId: "682625141511",
  appId: "1:682625141511:web:8fb48f744e501b7ed513a2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Initialize Authentication
const auth = getAuth(app);

export { db, auth };