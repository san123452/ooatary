import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC-VKLWfkQwocUvyE1rnoIOVWdVkxS-z1o",
  authDomain: "myapp-f6fbd.firebaseapp.com",
  projectId: "myapp-f6fbd",
  storageBucket: "myapp-f6fbd.firebasestorage.app",
  messagingSenderId: "109281518154",
  appId: "1:109281518154:web:a4f4900b5690d4fe1fbcb3",
  measurementId: "G-ZR4B8LDG7X"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);