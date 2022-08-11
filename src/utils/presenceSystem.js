/**
 * Created by lucasmckeon on 8/3/22.
 */
import {auth,db,realtimeDatabase,onAuthStateChanged} from './firebase'
import {off,ref,serverTimestamp,onValue,onDisconnect,set } from 'firebase/database'
import {doc,Timestamp,setDoc} from 'firebase/firestore'

onAuthStateChanged(auth,(user)=>{
  if(user) {
    // Fetch the current user's ID from Firebase Authentication.
    var uid = user.uid;

    // Create a reference to this user's specific status node.
    // This is where we will store data about being online/offline.
    // var userStatusDatabaseRef = ref(realtimeDatabase,'/status/' + uid);
    var userStatusDatabaseRef = ref(realtimeDatabase,'/status/' + uid);

    // We'll create two constants which we will write to
    // the Realtime database when this device is offline
    // or online.
    var isOfflineForDatabase = {
      state: 'offline',
      last_changed: serverTimestamp(),
    };

    var isOnlineForDatabase = {
      state: 'online',
      last_changed: serverTimestamp(),
    };

    // ...
    var userStatusFirestoreRef = doc(db,'/status/' + uid);

    // Firestore uses a different server timestamp value, so we'll
    // create two more constants for Firestore state.
    var isOfflineForFirestore = {
      state: 'offline',
      last_changed: Timestamp.now(),
    };

    var isOnlineForFirestore = {
      state: 'online',
      last_changed: Timestamp.now(),
    };

    onValue(ref(realtimeDatabase,'.info/connected'), function(snapshot) {
      if (snapshot.val() == false) {
        // Instead of simply returning, we'll also set Firestore's state
        // to 'offline'. This ensures that our Firestore cache is aware
        // of the switch to 'offline.'
        setDoc(userStatusFirestoreRef,isOfflineForFirestore);
        return;
      }

      onDisconnect(userStatusDatabaseRef).set(isOfflineForDatabase).then(function() {
        set(userStatusDatabaseRef,isOnlineForDatabase);

        // We'll also add Firestore set here for when we come online.
        setDoc(userStatusFirestoreRef,isOnlineForFirestore);
      });
    });
  } else{
    //Remove listener when user signs out
    off( ref(realtimeDatabase,'.info/connected') );
  }
});
