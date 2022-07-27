import './App.css';
import '@reach/dialog/styles.css'
import {register,login} from './authProvider'
import * as React from 'react'
import {Dialog} from '@reach/dialog'
import {Link,Outlet,useNavigate} from 'react-router-dom'
import {DiscoverRooms} from './screens/DiscoverRooms'
import {createBookRoom,doesReadingRoomExist} from './utils/dbHandler'

function Characters({characters,setCharacters}) {
  const nameRef = React.useRef(null);
  function handleAddCharacter(e) {
    e.preventDefault();
    setCharacters([...characters,nameRef.current.value]);
  }
  return (
      <div>
        <label htmlFor="characterName">Character Name:</label>
        <input ref={nameRef} id="characterName" type="text"/>
        <button onClick={handleAddCharacter} type="submit">Add Character</button>
        <ul>
          {characters?.map(character => <li key={character}>{character}</li>)}
        </ul>
      </div>
  )
}

function LoginForm({onSubmit, buttonText,title}) {
  function handleSubmit(e) {
    e.preventDefault();
    const {username,password} = e.target.elements;
    onSubmit({
      username:username.value,
      password:password.value
    })
  }
  return (
    <div>
      <h3>{title}</h3>
      <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="username">Username</label>
        <input id="username"/>
      </div>
      <div>
        <label htmlFor="password">Password</label>
        <input id="password"/>
      </div>
      <button type="submit">{buttonText}</button>
      </form>
    </div>
  )
}

const IS_OPEN = {NONE:'none',LOGIN:'login',REGISTER:'register',CREATE_ROOM:'create_room',
  CREATE_READING_ROOM:'create_reading_room'};

function App() {
  //const [characters,setCharacters] = React.useState([]);
  const [isOpen,setIsOpen] = React.useState(IS_OPEN.NONE);
  const navigate = useNavigate();
  const open = (whichIsOpen) => setIsOpen(whichIsOpen);
  const close = () => {
    setIsOpen(IS_OPEN.NONE);
    //setCharacters([]);//Doing this twice -- look at dialogue onDismiss
  };
  async function handleRegister({username,password}) {
    const user = await register({
      username,
      password});
  }
  async function handleLogin({username,password}){
    const user = await login({
      username,
      password});
    if( user === null ){
      //No user with that user name
    }
    else{

    }
  }

  // async function handleCreateReadingRoom(e) {
  //   e.preventDefault();
  //   const {roomName:name,book} = e.target.elements;
  //   const roomName = name.value;
  //   const bookName = book.value;
  //   function roomExistsCb() {
  //     alert(`Room with name ${roomName} already exists. Please choose another name for your room.`);
  //   }
  //   function roomDoesntExistCb() {
  //     alert('There was an error creating your room. Please try again.');
  //   }
  //   const room = await
  //       createReadingRoom(roomName,bookName,characters,{roomExistsCb,roomDoesntExistCb});
  //   if( room !== null ) {
  //     //Add spinner to after clicking create??
  //     close();
  //     navigate(`room/${roomName}`);
  //   }
  // }

  async function handleCreateBookRoom(e) {
    e.preventDefault();
    let {roomName,bookName} = e.target.elements;
    roomName = roomName.value;
    bookName = bookName.value;
    try {
      await createBookRoom(roomName,bookName);
      close();
      navigate(`bookRoom/${roomName}`);
    }
    catch(e){
      alert(e.message);
    }
  }
  //Create ReadingRoomScreen only. ReadingRoom is created on backend when user activates WebRTC
  async function handleCreateReadingRoomScreen(e) {
    e.preventDefault();
    const {readingRoomName: readingRoomElement} = e.target.elements;
    const readingRoomName = readingRoomElement.value;
    //Check to see if the reading room already exists
    if(!(await doesReadingRoomExist(readingRoomName))){
      close();
      navigate(`readingRoom/${readingRoomName}`,{state:{create:true,}});
    }
    else{
      alert('Reading room with name ' + readingRoomName + ' already exists. Please try a different name.');
    }
  }

  return (
    <div className="App">
      <div>
        <button onClick={()=>setIsOpen(IS_OPEN.REGISTER)}>Register</button>
        <button onClick={()=>setIsOpen(IS_OPEN.LOGIN)}>Login</button>
        <button onClick={()=>setIsOpen(IS_OPEN.CREATE_ROOM)}>Create Book Room</button>
        <button onClick={()=>setIsOpen(IS_OPEN.CREATE_READING_ROOM)}>Create Reading Room</button>
      </div>
      <div>
        <nav style={{margin:'1rem'}}>
          <Link to="/discover">Discover</Link>
        </nav>
      </div>
      <div>
        <Outlet/>
      </div>
      <Dialog aria-label={"Register"} isOpen={isOpen === IS_OPEN.REGISTER} onDismiss={close}>
        <LoginForm onSubmit={handleRegister} buttonText="Register" title="Register"/>
      </Dialog>
      <Dialog aria-label={"Login"} isOpen={isOpen === IS_OPEN.LOGIN} onDismiss={close}>
        <LoginForm onSubmit={handleLogin} buttonText="Login" title="Login"/>
      </Dialog>
      <Dialog aria-label={"Create Room"} isOpen={isOpen === IS_OPEN.CREATE_ROOM} onDismiss={close}>
        <h3>Create Room</h3>
        <form onSubmit={handleCreateBookRoom}>
          <div>
            <label htmlFor="roomName">Room Name</label>
            <input id="roomName"/>
          </div>
          <div>
            <label htmlFor="bookName">Book</label>
            <input id="bookName"/>
          </div>
          <button type="submit">Create Room</button>
        </form>
      </Dialog>
      <Dialog aria-label={"Create Reading Room"} isOpen={isOpen === IS_OPEN.CREATE_READING_ROOM} onDismiss={close}>
        <h3>Create Reading Room</h3>
        <form onSubmit={handleCreateReadingRoomScreen}>
          <div>
            <label htmlFor="readingRoomName">Reading Room Name</label>
            <input id="readingRoomName"/>
          </div>
          <button type="submit">Create Reading Room</button>
        </form>
      </Dialog>
    </div>
  );
}

export default App;