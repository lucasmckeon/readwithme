/**
 * Created by lucasmckeon on 5/18/22.
 */
import {db} from './firebase'
import {doc,getDoc,setDoc,collection,addDoc,onSnapshot,updateDoc,getDocs,deleteDoc,query,where} from 'firebase/firestore'

async function createBookRoom(name, bookName, {roomExistsCb,roomDoesntExistCb}) {
  name = name.trim();
  bookName = bookName.trim();
  const roomRef = doc(db,'book-rooms',name);
  let roomSnapshot =  await getDoc(roomRef);
  if(roomSnapshot.exists()){
    roomExistsCb();
    return null;
  }
  await setDoc(doc(db,'book-rooms',name), {
    name,
    bookName
  });
  roomSnapshot = await getDoc(roomRef);
  if(!roomSnapshot.exists()){
    roomDoesntExistCb();
    return null;
  }
  return roomSnapshot.data();
}

async function createReadingRoom(name, book, characters,{roomExistsCb,roomDoesntExistCb}) {
  name = name.trim();
  book = book.trim();
  const roomRef = doc(db,'rooms',name);
  let roomSnapshot =  await getDoc(roomRef);
  if(roomSnapshot.exists()){
    roomExistsCb();
    return;
  }
  await setDoc(doc(db,'rooms',name), {
    name,
    book,
    characters
  });
  roomSnapshot = await getDoc(roomRef);
  if(!roomSnapshot.exists()){
    roomDoesntExistCb();
    return;
  }
  return roomSnapshot.data();
}

async function getReadingRoom(name) {
  const roomRef = doc(db,'rooms',name.trim());
  let roomSnapshot =  await getDoc(roomRef);
  return roomSnapshot?.data();
}

async function getReadingRooms(startingText) {
  let rooms = [];
  let roomRef = collection(db,'rooms');
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

function incrementEndOfStringCharacterByOne(startingText) {
  const frontString = startingText.slice(0,startingText.length-1);
  const lastChar = startingText.slice(startingText.length -1 );
  return frontString + String.fromCharCode(lastChar.charCodeAt(0) + 1);
}

export {createReadingRoom,getReadingRoom,getReadingRooms}
