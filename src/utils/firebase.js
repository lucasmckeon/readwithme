/**
 * Created by lucasmckeon on 5/2/22.
 */
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {getFirestore,connectFirestoreEmulator} from "firebase/firestore";
import { getDatabase, connectDatabaseEmulator } from "firebase/database";
import {getAuth,onAuthStateChanged, connectAuthEmulator} from "firebase/auth"
import {getFunctions,connectFunctionsEmulator} from "firebase/functions"
import {useState,useEffect} from 'react'
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
const auth = getAuth(app);
const functions = getFunctions(app);
if(window.location.hostname === 'localhost'){
  connectFirestoreEmulator(db,'localhost',8080);
  connectDatabaseEmulator(realtimeDatabase,'localhost',9000);
  connectAuthEmulator(auth, "http://localhost:9099");
  connectFunctionsEmulator(functions, "localhost", 5001);
}
let initialCall = false;
function useAuthUser() {
  const [authUser,setAuthUser] = useState(null);
  useEffect(()=>{
    //Use listener in useEffect so that the listener isn't setup
    //multiple times
    const unsubscribe = onAuthStateChanged(auth,(authUser)=>{
      //Registration call: skip the first call with a flag. https://stackoverflow.com/questions/37673616/firebase-android-onauthstatechanged-called-twice?noredirect=1&lq=1
      if(initialCall === false ){
        initialCall = true;
        return;
      }
      if(authUser){
        console.log('USER SIGNED IN');
        setAuthUser(authUser);
      }
      else{
        setAuthUser(null);
      }
    });
    //Unsubscribe the listener on page unload
    return ()=>{ unsubscribe(); };
  },[auth]);

  return authUser;
}

export {db,realtimeDatabase,auth,useAuthUser,onAuthStateChanged}