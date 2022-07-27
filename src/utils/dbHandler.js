/**
 * Created by lucasmckeon on 5/18/22.
 */
import {realtimeDatabase,db} from './firebase'
import {doc,getDoc,setDoc,collection,addDoc,onSnapshot,
    updateDoc,getDocs,deleteDoc,query,where,runTransaction, Timestamp} from 'firebase/firestore'
import {ref,child, set, get,query as rtbQuery,orderByKey,startAt,endBefore} from 'firebase/database'

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

async function addQuote(contributorName, bookRoomName, text, comment ) {
  try{
    return await runTransaction(db,async(transaction)=>{
      const quote = {
        contributorName,
        bookRoomName,
        text,
        comments:[{
          comment,
          timestamp: Timestamp.now()
        }],
        timestamp: Timestamp.now()
      };
      const quoteRef = doc(db,'quotes',quote.text);
      const quoteDoc = await transaction.get(quoteRef);
      if(quoteDoc.exists()){
        throw "Quote with text " + quote.text + " already exists.";
      }
      const bookRoomRef = doc(db,'book-rooms',bookRoomName);
      const bookRoomDoc = await transaction.get(bookRoomRef);
      if(!bookRoomDoc.exists()){
        throw "Retrieving book room failed";
      }
      const newQuotes = [...bookRoomDoc.data().quotes,quote.text];
      transaction.update(bookRoomRef,{quotes:newQuotes});
      transaction.set(doc(db,'quotes',quote.text),quote);
      return quote;
    });
  } catch(e) {
    console.error(e);
    throw e;
  }
}

async function updateQuoteComments(quote,comment){
  const quoteRef = doc(db,'quotes',quote.text);
  quote.comments.push({comment,timestamp:Timestamp.now()});
  //TODO test if error occurs what happens
  try{
    await updateDoc(quoteRef,{
      comments:quote.comments
    });
    return quote;
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
  return roomSnapshot.data();
}

async function getQuotes(quoteIds) {
  const idRefs = quoteIds?.map(quoteId => getDoc(doc(db,'quotes',quoteId)));
  return Promise.all(idRefs).then(quoteSnapshots=> quoteSnapshots.map(snapshot => snapshot.data())
  ).catch((e)=> {
    console.error(e);
    console.log('Get quotes error :'+e.message);
  });
}

//Unused function TODO DELETE ****
async function createReadingRoom(name, book, characters,{roomExistsCb,roomDoesntExistCb}) {
  name = name.trim();
  book = book.trim();
  const roomRef = ref(realtimeDatabase,'readingRooms/'+name);
  // let roomSnapshot =  await getDoc(roomRef);
  // if(roomSnapshot.exists()){
  //   roomExistsCb();
  //   return;
  // }
  const result = await set(roomRef, {
    name,
    book,
    characters
  });
  console.log('R: ' + result);
  // roomSnapshot = await getDoc(roomRef);
  // if(!roomSnapshot.exists()){
  //   roomDoesntExistCb();
  //   return;
  // }
  return result;
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

async function addComment(username, text) {

}

export {createReadingRoom,getReadingRoom,getReadingRooms, doesReadingRoomExist,
    createBookRoom,getBookRoom, getBookRooms, addQuote, updateQuoteComments,
    getQuote,getQuotes,addComment}