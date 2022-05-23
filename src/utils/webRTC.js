/**
 * Created by lucasmckeon on 5/2/22.
 */
import {db} from './firebase'
import {doc,getDoc,setDoc,collection,addDoc,onSnapshot,updateDoc,getDocs,deleteDoc} from 'firebase/firestore'
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
let unsubscribeCaller = null, unsubscribeCallee = null, unsubscribeRooms = null;

export async function createOrJoinRoom(roomId,localStream,remoteStream) {
  const roomRef = doc(db,'rtc-rooms',roomId);
  const snapshot = await getDoc(roomRef);
  if(!snapshot.exists()){
    await createRoom(roomId,localStream,remoteStream);
  }
  else{
    await joinRoom(roomId,localStream,remoteStream);
  }
}

export async function createRoom(roomId,localStream,remoteStream) {
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
    await addDoc(collection(db,'rtc-rooms',roomId,'callerCandidates'),event.candidate.toJSON());
  });
  // Code for collecting ICE candidates above

  // Code for creating a room below
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  console.log('Created offer:', offer);

  const roomWithOffer = {
    'offer': {
      type: offer.type,
      sdp: offer.sdp,
    },
  };
  const roomRef = doc(db,'rtc-rooms',roomId);
  await setDoc(roomRef,roomWithOffer);
  console.log(`New room created with SDP offer. Room ID: ${roomRef.id}`);

  peerConnection.addEventListener('track', event => {
    console.log('Got remote track:', event.streams[0]);
    event.streams[0].getTracks().forEach(track => {
      console.log('Add a track to the remoteStream:', track);
      remoteStream.addTrack(track);
    });
  });

  // Listening for remote session description below
  unsubscribeRooms = onSnapshot(roomRef,async (doc)=>{
    const data = doc.data();
    if (!peerConnection.currentRemoteDescription && data && data.answer) {
      console.log('Got remote description: ', data.answer);
      const rtcSessionDescription = new RTCSessionDescription(data.answer);
      await peerConnection.setRemoteDescription(rtcSessionDescription);
    }
  });
  // Listening for remote session description above

  // Listen for remote ICE candidates below
  const calleeRef = collection(db,'rtc-rooms',roomId,'calleeCandidates');
  unsubscribeCallee = onSnapshot(calleeRef,(snapshot)=>{
    snapshot.docChanges().forEach(async (change) => {
      if (change.type === 'added') {
        let data = change.doc.data();
        console.log(`Got new remote ICE candidate: ${JSON.stringify(data)}`);
        await peerConnection.addIceCandidate(new RTCIceCandidate(data));
      }
    });
  });
  // Listen for remote ICE candidates above
}

export async function joinRoom(roomId,localStream,remoteStream) {
  const roomRef = doc(db,'rtc-rooms',roomId);
  const roomSnapshot = await getDoc(roomRef);
  console.log('Got room:', roomSnapshot.exists);

  //Only join a room that already exists
  if (roomSnapshot.exists()) {
    console.log('Create PeerConnection with configuration: ', configuration);
    peerConnection = new RTCPeerConnection(configuration);
    registerPeerConnectionListeners(peerConnection);
    localStream.getTracks().forEach(track => {
      peerConnection.addTrack(track, localStream);
    });

    // Code for collecting ICE candidates below
    const calleeCandidatesCollection = collection(db,'rtc-rooms',roomId,'calleeCandidates');
    peerConnection.addEventListener('icecandidate', event => {
      if (!event.candidate) {
        console.log('Got final candidate!');
        return;
      }
      console.log('Got candidate: ', event.candidate);
      addDoc(calleeCandidatesCollection,event.candidate.toJSON());
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
    const offer = roomSnapshot.data().offer;
    console.log('Got offer:', offer);
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    console.log('Created answer:', answer);
    await peerConnection.setLocalDescription(answer);

    const roomWithAnswer = {
      answer: {
        type: answer.type,
        sdp: answer.sdp,
      },
    };
    await updateDoc(roomRef,roomWithAnswer);
    // Code for creating SDP answer above

    // Listening for remote ICE candidates below
    const callerCandidatesCollection = collection(db,'rtc-rooms',roomId,'callerCandidates');
    unsubscribeCaller = onSnapshot(callerCandidatesCollection,snapshot => {
      snapshot.docChanges().forEach(async change => {
        if (change.type === 'added') {
          let data = change.doc.data();
          console.log(`Got new remote ICE candidate: ${JSON.stringify(data)}`);
          await peerConnection.addIceCandidate(new RTCIceCandidate(data));
        }
      });
    });
    // Listening for remote ICE candidates above
  }
}

export async function hangUp(roomId,localStream,remoteStream){
  console.log('HANG UP')
  if(unsubscribeCallee) {
    unsubscribeCallee();
  }
  if(unsubscribeCaller){
    unsubscribeCaller();
  }
  if(unsubscribeRooms){
    unsubscribeRooms();
  }
  localStream?.getTracks()?.forEach( track => { console.log('Stop'); track.stop(); });
  remoteStream?.getTracks()?.forEach( track => { track.stop(); });
  if(peerConnection){
    peerConnection.close();
  }
  // if(localStream){
  //   localStream=null;
  // }
  // if(remoteStream){
  //   remoteStream = new MediaStream();
  // }

  if(roomId){
    const calleeCollection = collection(db,'rtc-rooms',roomId,'calleeCandidates');
    const calleeSnapshot = await getDocs(calleeCollection);
    calleeSnapshot?.forEach(async (docSnapshot)=>{
      await deleteDoc(docSnapshot.ref);
    });
    const callerCandidatesCollection = collection(db,'rtc-rooms',roomId,'callerCandidates');
    const callerSnapshot = await getDocs(callerCandidatesCollection);
    callerSnapshot?.forEach(async (docSnapshot)=>{
      await deleteDoc(docSnapshot.ref);
    });
    const roomRef = doc(db,'rtc-rooms',roomId);
    const snapshot = await getDoc(roomRef);
    if(snapshot.exists()){
      await deleteDoc(roomRef);
    }
  }
}

function registerPeerConnectionListeners(peerConnection) {
  peerConnection.addEventListener('icegatheringstatechange', () => {
    console.log(
        `ICE gathering state changed: ${peerConnection.iceGatheringState}`);
  });

  peerConnection.addEventListener('connectionstatechange', () => {
    console.log(`Connection state change: ${peerConnection.connectionState}`);
  });

  peerConnection.addEventListener('signalingstatechange', () => {
    console.log(`Signaling state change: ${peerConnection.signalingState}`);
  });

  peerConnection.addEventListener('iceconnectionstatechange ', () => {
    console.log(
        `ICE connection state change: ${peerConnection.iceConnectionState}`);
  });
}