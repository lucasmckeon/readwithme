/**
 * Created by lucasmckeon on 4/25/22.
 */
import * as React from 'react'
import {Link} from 'react-router-dom'
import {getBookRooms,getReadingRooms} from '../utils/dbHandler'

export function DiscoverRooms() {
  const [bookRooms,setBookRooms] = React.useState([]);
  const [readingRooms,setReadingRooms] = React.useState([]);
  const [query,setQuery] = React.useState('');
  const [status,setStatus]  = React.useState('bookRoomsChecked');
  //Preload all of the books in memory
  React.useEffect(()=>{
    const fetchRooms = async ()=> {
      if(status === 'bookRoomsChecked'){
        const bookRooms = await getBookRooms(query);
        setBookRooms(bookRooms);
        setReadingRooms(null);
      }
      else if(status === 'readingRoomsChecked'){
        const readingRooms = await getReadingRooms(query);
        setReadingRooms(readingRooms);
        setBookRooms(null);
      }
    };
    fetchRooms().catch(console.error);
  },[query,status]);

  function onInputChange(e) {
    e.preventDefault();
    setQuery(e.target.value);
  }

  return (
      <div>
        <input onChange={onInputChange} type="text"/>
        <div>
          <input type = 'radio' name ='rooms' id ='bookrooms' defaultChecked={true} onClick={(e)=>setStatus('bookRoomsChecked')}/>
          <label htmlFor="bookrooms" >Book Quote Rooms</label>
          <input type = 'radio' name ='rooms' id ='readingrooms' onClick={()=>setStatus('readingRoomsChecked')}/>
          <label htmlFor="readingrooms">Read Together Rooms</label>
        </div>
        <ul>
          {status === 'bookRoomsChecked' ? bookRooms?.map(room => <Link style={{display:'block'}} key={room.name} to={`/bookRoom/${room.name}`}>{room.name}</Link>): null}
          {status === 'readingRoomsChecked' ? readingRooms?.map(room => <Link style={{display:'block'}} key={room.name} to={`/readingRoom/${room.name}`}>{room.name}</Link>): null }
        </ul>
      </div>
  )
}