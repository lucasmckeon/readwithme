/**
 * Created by lucasmckeon on 5/18/22.
 */
import {realtimeDatabase,db} from './firebase'
import {doc,getDoc,setDoc,collection,addDoc,onSnapshot,
    updateDoc,getDocs,deleteDoc,query,where,runTransaction, Timestamp} from 'firebase/firestore'
import {ref,child, set, get,query as rtbQuery,orderByKey,startAt,endBefore} from 'firebase/database'

async function getUser(id){
  const userRef = doc(db,'users',id);
  const user = await getDoc(userRef);
  if(!user.exists()){
    return null;
  }
  return {id:user.id,...user.data()};
}

async function createBookRoom(name, bookName ) {
  name = name.trim();
  bookName = bookName.trim();
  const roomRef = doc(db,'book-rooms',name);
  let roomSnapshot =  await getDoc(roomRef);
  if(roomSnapshot.exists()){
    throw new Error("Book room with name '"+ name +"' already exists, please try another name.");
  }
  await setDoc(doc(db,'book-rooms',name), {
    name,
    bookName,
    quotes:[],
    timestamp: Timestamp.now()
  });
  roomSnapshot = await getDoc(roomRef);
  if(!roomSnapshot.exists()){
    throw new Error("Creation of book room failed. Please try again.");
  }
  return roomSnapshot.data();
}

async function getBookRoom(name){
  const roomRef = doc(db,'book-rooms',name.trim());
  const roomSnapshot =  await getDoc(roomRef);
  if(!roomSnapshot.exists()){
    return null;
  }
  return roomSnapshot.data();
}

//TODO this can return false if permission is denied
async function doesBookRoomExist(name) {
  const roomSnapshot = await getDoc(doc(db,'book-rooms',name));
  return roomSnapshot.exists();
}

async function getBookRooms(startingText) {
  let rooms = [];
  let roomRef = collection(db,'book-rooms');
  let roomsSnapshot;
  if(startingText.trim() === '' ){
    roomsSnapshot = await getDocs(roomRef);
  }
  else{
    const endText = incrementEndOfStringCharacterByOne(startingText);
    const roomsQuery = query(roomRef,where('name','>=',startingText),where('name','<',endText));
    roomsSnapshot = await getDocs(roomsQuery);
  }
  roomsSnapshot?.forEach((doc)=>{
    rooms.push(doc.data());
  });
  return rooms;
}

async function addQuote(contributer, userId, bookRoomName, text, comment ) {
  try{
    const userQuotesRef = doc(db,'users',userId,'book-quotes',bookRoomName);
    let userQuotesDoc = await getDoc(userQuotesRef);
    if(!userQuotesDoc.exists()){
      await setDoc(userQuotesRef,{quotes:[]});
      userQuotesDoc = await getDoc(userQuotesRef);
      if(!userQuotesDoc.exists()){
        throw 'Retrieving user quotes failed';
      }
    }

    return await runTransaction(db,async(transaction)=>{
      const quoteRef = doc(db,'quotes',generateFirestoreId());
      const comments = [];
      if(comment && comment.trim()!==''){
        comments.push({
          comment,
          timestamp: Timestamp.now()
        });
      }
      const quote = {
        contributer: {
          //Add id because idk if we are going to expose username -> userId database collection
          id:userId,
          name: contributer
        },
        bookRoomName,
        text,
        comments,
        timestamp: Timestamp.now()
      };
      const bookRoomRef = doc(db,'book-rooms',bookRoomName);
      const bookRoomDoc = await transaction.get(bookRoomRef);
      if(!bookRoomDoc.exists()){
        throw "Retrieving book room failed";
      }
      if(comment && comment.trim() !== ''){
        const userRef = doc(db,'users',userId);
        const userDoc = await transaction.get(userRef);
        if(!userDoc){
          throw 'Retrieving user failed';
        }
        const userComments = userDoc.data().comments ? [...userDoc.data().comments,{quoteId: quote.id,comment}] : [{quoteId: quote.id,comment}];
        await transaction.update(userRef,{comments:userComments});
      }
      await transaction.set(quoteRef,quote);
      const newBookQuotes = [...bookRoomDoc.data().quotes,quoteRef.id];
      const newUserQuotes = [...userQuotesDoc.data().quotes,quoteRef.id];

      await transaction.update(bookRoomRef,{quotes:newBookQuotes});
      await transaction.update(userQuotesRef,{quotes:newUserQuotes});
      return quote;
    });
  } catch(e) {
    console.error(e);
    throw e;
  }
}

async function addComment(userId,quote,comment) {
  const quoteRef = doc(db,'quotes',quote.id);
  //TODO Does this update the react state ??
  const quoteComments = quote.comments;
  quoteComments.push({comment,timestamp:Timestamp.now()});
  //TODO test if error occurs what happens
  try{
    return await runTransaction(db,async(transaction)=>{
      const userRef = doc(db,'users',userId);
      const userDoc = await transaction.get(userRef);
      if(!userDoc){
        throw 'Retrieving user failed';
      }
      const userComments = userDoc.data().comments ? [...userDoc.data().comments,{quoteId: quote.id,comment}] : [{quoteId: quote.id,comment}];
      await transaction.update(quoteRef,{
        comments:quoteComments
      });
      await transaction.update(userRef,{comments:userComments});
      return comment;
    })
  }
  catch(e){
    console.error(e);
    throw e;
  }
}

async function getQuote(quoteId) {
  const docRef = doc(db,'quotes',quoteId);
  const roomSnapshot = await getDoc(docRef);
  if(!roomSnapshot.exists()){
    throw new Error('There was an error retrieving a quote. Please try again.');
  }
  return {id:roomSnapshot.id,...roomSnapshot.data()};
}

async function getQuotes(quoteIds) {
  const idRefs = quoteIds?.map(quoteId => getDoc(doc(db,'quotes',quoteId)));
  return Promise.all(idRefs).then(quoteSnapshots=> quoteSnapshots.map(snapshot => ({id:snapshot.id, ...snapshot.data()}) )
  ).catch((e)=> {
    console.error(e);
    console.log('Get quotes error :'+e.message);
  });
}

async function getReadingRoom(name) {
  const dbRef = ref(realtimeDatabase);
  return await get(child(dbRef,`readingRooms/${name.trim()}`)).then((snapshot) => {
    if(snapshot.exists()){
      return snapshot.val();
    }
    return null;
  }).catch((error)=>{ console.error(error); });
}

async function doesReadingRoomExist(name) {
  const dbRef = ref(realtimeDatabase);
  const room = await get(child(dbRef,`readingRooms/${name.trim()}`)).then((snapshot) => {
    if(snapshot.exists()){
      return snapshot.val();
    }
    return null;
  }).catch((error)=>{ console.error(error); });
  return room !== null;
}

async function getReadingRooms(startingText) {
  let rooms = [];
  let roomRef = ref(realtimeDatabase,'readingRooms');
  let roomsSnapshot;
  if(startingText.trim() === '' ){
    const roomsByKeyRef = rtbQuery(roomRef,orderByKey());
    roomsSnapshot = await get(roomsByKeyRef).then((snapshot)=>{
      return snapshot;
    }).catch((err)=>console.error(err));
  }
  else{
    const endText = incrementEndOfStringCharacterByOne(startingText);
    const roomsQueryRef = rtbQuery(roomRef,orderByKey(),startAt(startingText),endBefore(endText));
    roomsSnapshot = await get(roomsQueryRef).then((snapshot)=>{
      return snapshot;
    }).catch((err)=>console.error(err));
  }
  roomsSnapshot?.forEach((doc)=>{
    rooms.push({name: doc.key});
  });
  return rooms;
}

function incrementEndOfStringCharacterByOne(startingText) {
  const frontString = startingText.slice(0,startingText.length-1);
  const lastChar = startingText.slice(startingText.length -1 );
  return frontString + String.fromCharCode(lastChar.charCodeAt(0) + 1);
}

//credit https://stackoverflow.com/a/55674368
function generateFirestoreId(){
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let autoId = '';
  for (let i = 0; i < 20; i++) {
    autoId += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  //assert(autoId.length === 20, 'Invalid auto ID: ' + autoId);
  return autoId;
}

export {getReadingRoom,getReadingRooms, doesReadingRoomExist,
    createBookRoom,getBookRoom, getBookRooms, addQuote,
    getQuote,getQuotes,addComment,getUser}