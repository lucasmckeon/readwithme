/**
 * Created by lucasmckeon on 4/26/22.
 */
import * as React from 'react'
import {useParams} from 'react-router-dom'
import {clientGet} from '../utils/apiClient'
import {hangUp,createOrJoinRoom} from '../utils/webRTC'
import {getReadingRoom} from '../utils/dbHandler'

function Character({name,becomeCharacter,disabled}) {
  async function handleClick(e) {
    e.preventDefault();
    const stream = await navigator.mediaDevices.getUserMedia(
        {video: true, audio: true});
    becomeCharacter(stream);
  }
  return (
      <li>
          <button disabled={disabled} onClick = {handleClick}>Become {name}</button>
      </li>
  )
}

export function ReadingRoom() {
  const {roomName} = useParams();
  const [room,setRoom] = React.useState(null);
  const [localStream,setLocalStream] = React.useState(null);
  const [remoteStream,setRemoteStream] = React.useState(null);
  const [becameCharacter,setBecameCharacter] = React.useState(false);
  const localVideoRef = React.useRef(null);
  const remoteVideoRef = React.useRef(null);

  React.useEffect(()=>{
    const fetch = async ()=>{
      const room = await getReadingRoom(roomName);
      if(room === null ) {
        alert(`Room with name ${roomName} doesn't exist`);
        return;
      }
      setRoom(room);
    };
    fetch().catch(console.error);
    return ()=>{
      setBecameCharacter(false);
      setLocalStream(null);
      setRemoteStream(null);
      if(localVideoRef.current){
        localVideoRef.current.srcObject=null;
      }
      if(remoteVideoRef.current){
        remoteVideoRef.current.srcObject=null;
      }
    }
  },[roomName]);

  React.useEffect(()=>{
    return ()=>{
      //console.log(`N: ${roomName} ls ${localStream} rs ${remoteStream}`);
      hangUp(roomName,localStream,remoteStream);
    }
  },[roomName,localStream,remoteStream]);

  function becomeCharacter(stream) {
    if(localStream === null){
      setLocalStream(stream);
      const remoteMediaStream = new MediaStream();
      setRemoteStream(remoteMediaStream);
      setBecameCharacter(true);
      localVideoRef.current.srcObject=stream;
      remoteVideoRef.current.srcObject=remoteMediaStream;
      createOrJoinRoom(roomName,stream,remoteStream);
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
          {
            room?.characters.map(character => <Character disabled={ becameCharacter } key={character} name={character} becomeCharacter={becomeCharacter}/>)
          }
        </ul>
        <video ref={localVideoRef} width={400} height={400} autoPlay/>
        <video ref={remoteVideoRef} width={400} height={400} autoPlay/>
      </div>
  )
}