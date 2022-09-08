const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// Since this code will be running in the Cloud Functions environment
// we call initialize Firestore without any arguments because it
// detects authentication from the environment.
const firestore = admin.firestore();

// Create a new function which is triggered on changes to /status/{uid}
// Note: This is a Realtime Database trigger, *not* Firestore.
exports.onUserStatusChanged = functions.database.ref('/status/{uid}').onUpdate(
    async (change, context) => {
      // Get the data written to Realtime Database
      const eventStatus = change.after.val();

      // Then use other event data to create a reference to the
      // corresponding Firestore document.
      const userStatusFirestoreRef = firestore.doc(`status/${context.params.uid}`);

      // It is likely that the Realtime Database change that triggered
      // this event has already been overwritten by a fast change in
      // online / offline status, so we'll re-read the current data
      // and compare the timestamps.
      const statusSnapshot = await change.after.ref.once('value');
      const status = statusSnapshot.val();
      functions.logger.log(status, eventStatus);
      // If the current timestamp for this data is newer than
      // the data that triggered this event, we exit this function.
      if (status.last_changed > eventStatus.last_changed) {
        return null;
      }

      // Otherwise, we convert the last_changed field to a Date
      eventStatus.last_changed = new Date(eventStatus.last_changed);

      // ... and write it to Firestore.
      return userStatusFirestoreRef.set(eventStatus);
    });

exports.onUsernameUpdated = functions.https.onCall(async (data, context) => {
    // Checking attribute.
    if (!(typeof data.text === 'string') || data.text.length === 0) {
        // Throwing an HttpsError so that the client gets the error details.
        throw new functions.https.HttpsError('invalid-argument', 'The function must be called with ' +
            'one arguments "text" containing the message text to add.');
    }
    // Checking that the user is authenticated.
    if (!context.auth) {
        // Throwing an HttpsError so that the client gets the error details.
        throw new functions.https.HttpsError('failed-precondition', 'The function must be called ' +
            'while authenticated.');
    }
    // Message text passed from the client.
    const username = data.text;
    // Authentication / user information is automatically added to the request.
    const uid = context.auth.uid;
    const usernamesCollection = firestore.collection('usernames');
    const usernameRef = firestore.doc('usernames/' + username);
    const userRef = firestore.doc('users/' + uid);
    //Ensure text is valid username
    if(username.trim().length < 4) {
        return {
            message: 'Username must be at least 4 characters.',
            success:false
        }
    }
    //Ensure username isn't already assigned to user or anyone else
    try{
        return await firestore.runTransaction( async (t)=>{
            const doc = await t.get(usernameRef);
            if(doc.exists){
                if( doc.data().id === uid ){
                    return {
                        message: 'Username already assigned to current user',
                        success: false
                    }
                }
                else {
                    return {
                        message: 'Username assigned to someone else',
                        success:false
                    }
                }
            }
            //We know that a new username is going to be assigned at this point, query to see if current user has
            //any other usernames and delete them before adding new username
            const usernamesQueryRes = await usernamesCollection.where('id','==',uid).get();
            usernamesQueryRes.forEach(async res => await t.delete(res.ref));
            await t.set(usernamesCollection.doc(username),{id:uid},{merge:true});
            await t.update(userRef,{username:username},{merge:true});
            return {
                message: `Username ${username} successfully assigned`,
                success:true
            }
        });
    }
    catch(e){
        return e;
    }
});