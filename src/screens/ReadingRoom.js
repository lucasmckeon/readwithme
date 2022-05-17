/**
 * Created by lucasmckeon on 4/26/22.
 */
import * as React from 'react'
import {useParams} from 'react-router-dom'
import {clientGet} from '../utils/apiClient'
import {db} from '../utils/firebase'
import {doc,getDoc} from 'firebase/firestore'
import {createRoom,joinRoom} from '../utils/webRTC'

function Character({name,becomeCharacter}) {
  async function handleClick(e) {
    e.preventDefault();
    const stream = await navigator.mediaDevices.getUserMedia(
        {video: true, audio: true});
    becomeCharacter(stream);
    console.log("Clicked: " + name);
}
  return (
      <li key={name}>
          <button onClick={handleClick}>Become {name}</button>
      </li>
  )
}

export function ReadingRoom() {
  const {roomName} = useParams();
  const [room,setRoom] = React.useState(null);
  const [localStream,setLocalStream] = React.useState(null);
  const [remoteStream,] = React.useState(new MediaStream());
  const localVideoRef = React.useRef(null);
  const remoteVideoRef = React.useRef(null);
  const roomId = '1234';
  const [roomSnapshot,setRoomSnapshot] = React.useState(null);
  React.useEffect(()=>{
    const fetch = async ()=>{
      const room = await clientGet(`room/?name=${roomName}`);
      setRoom(room);
    };
    fetch();
  },[roomName]);

  React.useEffect(()=>{
    async function setSnapshot() {
      const roomRef = doc(db,'rooms',roomId);
      const snapshot = await getDoc(roomRef);
      //console.log("SNAP: " + snapshot);
      setRoomSnapshot(snapshot);
    }
    setSnapshot();
    remoteVideoRef.current.srcObject=remoteStream;
    return ()=>{
      //Clean up RTC
    }
  },[]);

  async function becomeCharacter(stream) {
    if(localStream === null){
      setLocalStream(stream);
      localVideoRef.current.srcObject=stream;
      if( roomSnapshot !== null ){
        if(!roomSnapshot.exists()){
          console.log("CREATE ROOM");
          createRoom(roomId,stream,remoteStream);
        }
        else{
          joinRoom(roomId,stream,remoteStream);
        }
      }
    }
  }

  /*
  Display all characters in a row of boxes, allow users to become character,
  which will trigger asking to enable WebRTC, once permission is granted, show users face in box
   */
  return (
      <div>
        <h3>{room?.name}</h3>
        <h4>{room?.book}</h4>
        <ul style={{listStyleType: 'none'}}>
          {room?.characters.map(character => <Character name={character} becomeCharacter={becomeCharacter}/>)}
        </ul>
        <video ref={localVideoRef} width={400} height={400} autoPlay/>
        <video ref={remoteVideoRef} width={400} height={400} autoPlay/>
      </div>
  )
}