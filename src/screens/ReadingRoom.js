/**
 * Created by lucasmckeon on 4/26/22.
 */
import * as React from 'react'
import {useParams} from 'react-router-dom'
import {clientGet} from '../utils/apiClient'

function Character({name}) {
  function handleClick(e) {
    e.preventDefault();
  }
  return (
      <li onClick={handleClick}>Become {name}</li>
  )
}

export function ReadingRoom() {
  const {roomName} = useParams();
  const [room,setRoom] = React.useState(null);
  React.useEffect(()=>{
    const fetch = async ()=>{
      const room = await clientGet(`room/?name=${roomName}`);
      setRoom(room);
    };
    fetch();
  },[roomName]);
  /*
  Display all characters in a row of boxes, allow users to become character,
  which will trigger asking to enable WebRTC, once permission is granted, show users face in box
   */
  return (
      <div>
        <h3>{room.name}</h3>
        <h4>{room.book}</h4>
        <ul>
          {room.characters.map(character => <Character name={character}/>)}
        </ul>
      </div>
  )
}