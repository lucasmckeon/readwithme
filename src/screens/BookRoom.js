/**
 * Created by lucasmckeon on 5/22/22.
 */
import * as React from 'react';
import {useParams} from 'react-router-dom'
import {getBookRoom,getQuotes,addQuote} from '../utils/dbHandler'
import {Dialog} from '@reach/dialog'

export function BookRoom() {
  const {roomName} = useParams();
  const [bookRoom,setBookRoom] = React.useState(null);
  const [quotes,setQuotes] = React.useState([]);
  const [isOpen,setIsOpen] = React.useState('');
  const IS_OPEN = {ADD_QUOTE: 'addQuote', CREATE_READING_ROOM: 'createReadingRoom',
    ACTIVE_READING_ROOMS:'activeReadingRooms',NONE:'none'};
  React.useEffect(()=>{
    async function fetch() {
      try{
        const room = await getBookRoom(roomName);
        if(!room){
          alert("There was an error getting the book room with the name '"+roomName+"'. " +
              "Either the room doesn't exist or there was a network error.");
          return;
        }
        setBookRoom(room);
        if(room.quotes){
          const gottenQuotes = await getQuotes(room.quotes);
          setQuotes(gottenQuotes);
        }
      }
      catch(e){
        console.error(e);
        alert(e.message);
      }
    }
    fetch();
  },[roomName]);

  function close() {
    setIsOpen(IS_OPEN.NONE);
  }
  async function handleAddQuote(e) {
    e.preventDefault();
    let {quoteText,commentText} = e.target.elements;
    quoteText=quoteText.value;
    commentText=commentText.value;
    try{
      const quote = await addQuote('anonymous',roomName,quoteText,commentText);
      setQuotes([...quotes,quote]);
      close();
    } catch(e){
      console.error(e);
      alert(e.message);
    }
  }
  async function handleCreateReadingRoom(e) {
    e.preventDefault();
  }

  function joinReadingRoom(e) {
    e.preventDefault();
  }

  //Cannot read properties of undefined (reading 'map')
  return (
      <div>
        <h1>{roomName}</h1>
        <h3>{bookRoom?.bookName}</h3>
        {bookRoom ?
            <div>
              <button onClick={()=>setIsOpen(IS_OPEN.ADD_QUOTE)}>Add quote</button>
              <button onClick={()=>setIsOpen(IS_OPEN.CREATE_READING_ROOM)}>Create Reading Room</button>
              <button onClick={()=>setIsOpen(IS_OPEN.ACTIVE_READING_ROOMS)}>View Reading Rooms</button>
            </div>
            : null }
        { quotes ?
            <ul>{
            quotes.map(quote=>{
              return (
              <li key={quote.timestamp}>
              <div>{quote.text}</div>
              <div>{quote.comment}</div>
              </li>)})
            }
            </ul> : null }
        <Dialog aria-label={"Add quote"} isOpen={isOpen === IS_OPEN.ADD_QUOTE} onDismiss={close}>
          <h3>Add quote</h3>
          <form onSubmit={handleAddQuote}>
            <div>
              <label htmlFor="quoteText">Quote text</label>
              <textarea id="quoteText" rows="4" cols="50"/>
            </div>
            <div>
              <label htmlFor="commentText">Comment</label>
              <textarea id="commentText" rows="4" cols="50"/>
            </div>
            <button type="submit">Add quote</button>
          </form>
        </Dialog>
        <Dialog aria-label={"Create Reading Room"} isOpen={isOpen === IS_OPEN.CREATE_READING_ROOM} onDismiss={close}>
          <h3>Create Reading Room</h3>
          <form onSubmit={handleCreateReadingRoom}>
            <div>
              <label htmlFor="roomName">Room Name</label>
              <input id="roomName"/>
            </div>
            <button type="submit">Create Room</button>
          </form>
        </Dialog>
        <Dialog aria-label={"Join Reading Room"} isOpen={isOpen === IS_OPEN.ACTIVE_READING_ROOMS} onDismiss={close}>
          <h3>Active Reading Room</h3>
          <div>
            <ul>
              {bookRoom?.readingRooms?.map(room=>(
                  <li key={room.name} onClick={joinReadingRoom}>{room.name}</li>
                ))}
            </ul>
          </div>
        </Dialog>
      </div>
  )
}