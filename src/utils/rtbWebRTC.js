import {realtimeDatabase} from './firebase'
import {getReadingRoom} from './dbHandler'
import {ref,set,push,onValue,onChildAdded,remove,off, onDisconnect} from 'firebase/database'
const configuration = {
  iceServers: [
    {
      urls: [
        "stun:stun1.l.google.com:19302",
        "stun:stun2.l.google.com:19302",
        "stun:stun.l.google.com:19302",
        "stun:stun3.l.google.com:19302",
        "stun:stun4.l.google.com:19302",
      ],
    },
  ],
  iceCandidatePoolSize: 10,
};
let peerConnection = null;
let failureCallback = null;
let roomRef = null, calleeCandidatesRef = null, callerCandidatesRef = null;

//TODO split Create and Join into two diffeent modules
export async function createOrJoinRoom(roomId,localStream,remoteStream,failureCb) {
  roomRef = ref(realtimeDatabase,'readingRooms/'+roomId);
  callerCandidatesRef = ref(realtimeDatabase,'readingRooms/'+roomId+'/callerCandidates');
  calleeCandidatesRef = ref(realtimeDatabase,'readingRooms/'+roomId+'/calleeCandidates');
  failureCallback = failureCb;
  onDisconnect(roomRef).remove().catch((err)=>{
    if(err){
      console.error('could not establish onDisconnect event',err);
    }
  });
  window.addEventListener('offline', () => failureCallback());
  const readingRoom = await getReadingRoom(roomId);
  const offer = readingRoom?.offer;
  const answer = readingRoom?.answer;
  if(offer && answer){
    throw 'Reading room already exists and is full. Please create or join a different reading room.';
  }
  if(!readingRoom){
    await createRoom(roomId,localStream,remoteStream);
  }
  else if(offer && !answer){
    await joinRoom(roomId,localStream,remoteStream);
  }
}

async function createRoom(roomId,localStream,remoteStream) {
  console.log('Create PeerConnection with configuration: ', configuration);
  peerConnection = new RTCPeerConnection(configuration);

  registerPeerConnectionListeners(peerConnection);

  localStream.getTracks().forEach(track => {
    peerConnection.addTrack(track, localStream);
  });

  // Code for collecting ICE candidates below
  peerConnection.addEventListener('icecandidate',async event => {
    if (!event.candidate) {
      console.log('Got final candidate!');
      return;
    }
    console.log('Got candidate: ', event.candidate);
    await push(callerCandidatesRef,event.candidate.toJSON());
  });
  // Code for collecting ICE candidates above

  // Code for creating a room below
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  console.log('Created offer:', offer);

  const roomWithOffer = {
      type: offer.type,
      sdp: offer.sdp,
  };
  await set(ref(realtimeDatabase,'readingRooms/'+roomId+'/offer'),roomWithOffer);
  console.log(`New room created with SDP offer. Room ID: ${roomRef.id}`);

  //Set bookRoom.readingRooms.readingRoom.participants to 1

  peerConnection.addEventListener('track', event => {
    console.log('Got remote track:', event.streams[0]);
    event.streams[0].getTracks().forEach(track => {
      console.log('Add a track to the remoteStream:', track);
      remoteStream.addTrack(track);
    });
  });

  // Listening for remote session description below
  //TODO listening on top level roomRef is not good, try to listen for just addition of answer
  onValue(roomRef,async (doc)=>{
    const data = doc.val();
    if (!peerConnection.currentRemoteDescription && data && data.answer) {
      console.log('Got remote description: ', data.answer);
      const rtcSessionDescription = new RTCSessionDescription(data.answer);
      await peerConnection.setRemoteDescription(rtcSessionDescription);
    }
  });
  // Listening for remote session description above

  // Listen for remote ICE candidates below
  onChildAdded(calleeCandidatesRef,async (snapshot)=>{
    let data = snapshot.val();
    console.log(`Got new remote ICE candidate: ${JSON.stringify(data)}`);
    await peerConnection.addIceCandidate(new RTCIceCandidate(data));
  });
  // Listen for remote ICE candidates above
}

async function joinRoom(roomId,localStream,remoteStream) {
  const readingRoom = await getReadingRoom(roomId);
  console.log('Create PeerConnection with configuration: ', configuration);
  peerConnection = new RTCPeerConnection(configuration);
  registerPeerConnectionListeners(peerConnection);
  localStream.getTracks().forEach(track => {
    peerConnection.addTrack(track, localStream);
  });

  // Code for collecting ICE candidates below
  peerConnection.addEventListener('icecandidate',async event => {
    if (!event.candidate) {
      console.log('Got final candidate!');
      return;
    }
    console.log('Got candidate: ', event.candidate);
    await push(calleeCandidatesRef,event.candidate.toJSON());
  });
  // Code for collecting ICE candidates above

  peerConnection.addEventListener('track', event => {
    console.log('Got remote track:', event.streams[0]);
    event.streams[0].getTracks().forEach(track => {
      console.log('Add a track to the remoteStream:', track);
      remoteStream.addTrack(track);
    });
  });

  // Code for creating SDP answer below
  const offer = readingRoom.offer;
  console.log('Got offer:', offer);
  await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
  const answer = await peerConnection.createAnswer();
  console.log('Created answer:', answer);
  await peerConnection.setLocalDescription(answer);
  const roomWithAnswer = {
      type: answer.type,
      sdp: answer.sdp,
  };
  await set(ref(realtimeDatabase,'readingRooms/'+roomId+'/answer'),roomWithAnswer);
  // Code for creating SDP answer above

  // Listening for remote ICE candidates below\
  onChildAdded(callerCandidatesRef,async (snapshot)=>{
    let data = snapshot.val();
    console.log(`Got new remote ICE candidate: ${JSON.stringify(data)}`);
    await peerConnection.addIceCandidate(new RTCIceCandidate(data));
  });
  // Listening for remote ICE candidates above

}

export async function hangUp(roomId,localStream,remoteStream){
  console.log('HANG UP');
  localStream?.getTracks()?.forEach( track => { track.stop(); });
  remoteStream?.getTracks()?.forEach( track => { track.stop(); });
  if(peerConnection){
    peerConnection.close();
  }

  if(roomId && (roomRef && calleeCandidatesRef && callerCandidatesRef) ){
    off(calleeCandidatesRef);
    off(callerCandidatesRef);
    off(roomRef);
    remove(roomRef);
  }
}

function registerPeerConnectionListeners(peerConnection) {
  peerConnection.addEventListener('icegatheringstatechange', () => {
    console.log(
        `ICE gathering state changed: ${peerConnection.iceGatheringState}`);
  });

  peerConnection.addEventListener('connectionstatechange', () => {
    console.log(`Connection state change: ${peerConnection.connectionState}`);
    if(peerConnection.connectionState === 'failed'){
      failureCallback();
    }
    //Connection state change: connected - when get this state, set status to full
    //Set bookRoom.readingRooms.readingRoom.participants to 2
    //Changes to disconnected when someone hangs up
  });

  peerConnection.addEventListener('signalingstatechange', () => {
    console.log(`Signaling state change: ${peerConnection.signalingState}`);
  });

  peerConnection.addEventListener('iceconnectionstatechange ', () => {
    console.log(
        `ICE connection state change: ${peerConnection.iceConnectionState}`);
  });
}