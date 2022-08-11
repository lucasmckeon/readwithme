/**
 * Created by lucasmckeon on 5/22/22.
 */
import * as React from 'react';
import {useParams,useNavigate} from 'react-router-dom'
import {getBookRoom,getQuotes,addQuote,updateQuoteComments} from '../utils/dbHandler'
import {Dialog} from '@reach/dialog'
import {
    Disclosure,
    DisclosureButton,
    DisclosurePanel,
} from "@reach/disclosure";
import {useUser} from '../utils/firebase';

function Quotes({quotes,handleUpdateQuoteComments,user}) {
  return (
    <React.Fragment>
      <ul style={{listStyleType:"none"}}>{
        quotes.map(quote=>{
          return (
              <li key={quote.text}>
                <Disclosure>
                  <DisclosureButton>{quote.text}</DisclosureButton>
                  {quote.comments.map(comment => <DisclosurePanel key={comment.timestamp}>{comment.comment}</DisclosurePanel>)}
                  <DisclosurePanel>
                    <form onSubmit={(e)=>{
                      e.preventDefault();
                      const commentText = e.target.elements.commentText.value.trim();
                      if(commentText){
                        handleUpdateQuoteComments(quote,commentText);
                      }
                    }}>
                      <div>
                        <textarea id="commentText" rows="4" cols="50"/>
                        <button disabled={user === null} style={{display:'block',margin:'auto'}} type="submit"> {user === null ? 'Sign in to comment' : 'Add Comment'}</button>
                      </div>
                    </form>
                  </DisclosurePanel>
                </Disclosure>
              </li>)})
        }
      </ul>
    </React.Fragment>)
}

export function BookRoom() {
  const {roomName} = useParams();
  const [bookRoom,setBookRoom] = React.useState(null);
  const [quotes,setQuotes] = React.useState([]);
  const [isOpen,setIsOpen] = React.useState('');
  const navigate = useNavigate();
  const user = useUser();
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

  async function handleUpdateQuoteComments(quote,comment) {
    try {
      const updatedQuote = await updateQuoteComments(quote, comment);
      let quotesDuplicate = [...quotes];
      quotesDuplicate = quotesDuplicate.map(o => o.timestamp === updatedQuote.timestamp ? updatedQuote : o);
      setQuotes(quotesDuplicate);
    }
    catch(e){
      console.error(e);
      alert(e.message);
    }
  }

  return (
      <div>
        <h1>{roomName}</h1>
        <h3>{bookRoom?.bookName}</h3>
        {bookRoom ?
            <div>
              <button disabled={user === null} onClick={()=>setIsOpen(IS_OPEN.ADD_QUOTE)}>{user === null ? 'Sign in to add quote' : 'Add Quote'}</button>
            </div>
            : null }
        { quotes ?
            <Quotes user={user} quotes={quotes} handleUpdateQuoteComments={handleUpdateQuoteComments}/> : null }
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
      </div>
  )
}