/**
 * Created by lucasmckeon on 4/25/22.
 */
import * as React from 'react'
import {Link} from 'react-router-dom'
import {getBookRooms} from '../utils/dbHandler'

export function DiscoverRooms() {
  const [rooms,setRooms] = React.useState([]);
  const [query,setQuery] = React.useState('');
  //Preload all of the books in memory
  React.useEffect( ()=>{
    const fetchRooms = async ()=> {
      const rooms = await getBookRooms(query);
      setRooms(rooms);
    };
    fetchRooms().catch(console.error);
  },[query]);

  async function onInputChange(e) {
    e.preventDefault();
    setQuery(e.target.value);
  }

  return (
      <div>
        <input onChange={onInputChange} type="text"/>
        <ul>
          {rooms?.map(room => <Link style={{display:'block'}} key={room.name} to={`/room/${room.name}`}>{room.name}</Link>)}
        </ul>
      </div>
  )
}