/**
 * Created by lucasmckeon on 5/2/22.
 */
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {getFirestore} from 'firebase/firestore';
import { getDatabase } from "firebase/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC0eSkhroWSWjAFgxVfURDXm1SHqXgvMOw",
  authDomain: "readwithme-a21c2.firebaseapp.com",
  databaseURL: "https://readwithme-a21c2-default-rtdb.firebaseio.com",
  projectId: "readwithme-a21c2",
  storageBucket: "readwithme-a21c2.appspot.com",
  messagingSenderId: "398979005803",
  appId: "1:398979005803:web:7cf8b4ee8dcb0555f5602e",
  measurementId: "G-9654LCZ141"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db =getFirestore(app);
const realtimeDatabase = getDatabase(app);
export {db,realtimeDatabase}