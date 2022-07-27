/**
 * Created by lucasmckeon on 4/26/22.
 */
import * as React from 'react'
import {useParams} from 'react-router-dom'
import {createBrowserHistory} from 'history'
import {hangUp,createOrJoinRoom} from '../utils/rtbWebRTC'

export function ReadingRoom() {
  const {readingRoomName} = useParams();
  const localVideoRef = React.useRef(null);
  const remoteVideoRef = React.useRef(null);
  const [status,setStatus] = React.useState('not-initialized');

  React.useEffect(()=>{
    //Trick to be able to reference these values in the cleanup function
    let localCurrentRefValue = null, remoteCurrentRefValue = null;
    if(localVideoRef.current){
      localCurrentRefValue = localVideoRef.current;
    }
    if(remoteVideoRef.current){
      remoteCurrentRefValue = remoteVideoRef.current;
    }
    return ()=>{
      //Hang up needed for when Discover button pressed causing dismount
      hangUp(readingRoomName,localCurrentRefValue.srcObject,remoteCurrentRefValue.srcObject);
    }
  },[]);

  React.useEffect(()=>{
    if( status === 'failed' ){
      alert('Video conferencing failed and room was deleted. Please restart the video conferencing to recreate the room.');
      setStatus('not-initialized');
    }
  },[status]);

  function initRoom() {
    navigator.mediaDevices.getUserMedia(
        {video: true, audio: true}).then(async localStream=> {
          localVideoRef.current.srcObject=localStream;
          remoteVideoRef.current.srcObject=new MediaStream();
          function failureCallback() {
            hangUp(readingRoomName,localVideoRef.current.srcObject,remoteVideoRef.current.srcObject);
            localVideoRef.current.srcObject = null;
            remoteVideoRef.current.srcObject = null;
            setStatus('failed');
          }
          await createOrJoinRoom(readingRoomName,localVideoRef.current.srcObject,
              remoteVideoRef.current.srcObject,failureCallback);
          setStatus('initialized');
        })
        .catch(err=>{
          console.error(err);
          alert(err);
        });
  }

  /*
  Display all characters in a row of boxes, allow users to become character,
  which will trigger asking to enable WebRTC, once permission is granted, show users face in box
   */
  return (
      <div>
        <h1>{readingRoomName}</h1>
        { status === 'not-initialized' ? <button onClick={initRoom}>Start video conferencing</button> : null }
        <div>
          <video ref={localVideoRef} width={400} height={400} autoPlay/>
          <video ref={remoteVideoRef} width={400} height={400} autoPlay/>
        </div>
      </div>
  )
}