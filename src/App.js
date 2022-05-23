import './App.css';
import '@reach/dialog/styles.css'
import {register,login} from './authProvider'
import * as React from 'react'
import {Dialog} from '@reach/dialog'
import {Link,Outlet,useNavigate} from 'react-router-dom'
import {DiscoverRooms} from './screens/DiscoverRooms'
import {createReadingRoom} from './utils/dbHandler'

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

const IS_OPEN = {NONE:'none',LOGIN:'login',REGISTER:'register',CREATE_ROOM:'create_room'};

function App() {
  const [characters,setCharacters] = React.useState([]);
  const [isOpen,setIsOpen] = React.useState(IS_OPEN.NONE);
  const navigate = useNavigate();
  const open = (whichIsOpen) => setIsOpen(whichIsOpen);
  const close = () => {
    setIsOpen(IS_OPEN.NONE);
    setCharacters([]);
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
  async function handleCreateReadingRoom(e) {
    e.preventDefault();
    const {roomName:name,book} = e.target.elements;
    const roomName = name.value;
    const bookName = book.value;
    function roomExistsCb() {
      alert(`Room with name ${roomName} already exists. Please choose another name for your room.`);
    }
    function roomDoesntExistCb() {
      alert('There was an error creating your room. Please try again.');
    }
    const room = await
        createReadingRoom(roomName,bookName,characters,{roomExistsCb,roomDoesntExistCb});
    if( room !== null ) {
      //Add spinner to after clicking create??
      close();
      navigate(`room/${roomName}`);
    }
  }

  return (
    <div className="App">
      <div>
        <button onClick={()=>setIsOpen(IS_OPEN.REGISTER)}>Register</button>
        <button onClick={()=>setIsOpen(IS_OPEN.LOGIN)}>Login</button>
        <button onClick={()=>setIsOpen(IS_OPEN.CREATE_ROOM)}>Create Room</button>
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
      <Dialog aria-label={"Create Room"} isOpen={isOpen === IS_OPEN.CREATE_ROOM} onDismiss={()=>{close();  setCharacters([]);}}>
        <h3>Create Room</h3>
        <form onSubmit={handleCreateReadingRoom}>
          <div>
            <label htmlFor="roomName">Room Name</label>
            <input id="roomName"/>
          </div>
          <div>
            <label htmlFor="book">Book</label>
            <input id="book"/>
          </div>
          <Characters characters={characters} setCharacters={setCharacters}/>
          <button type="submit">Create Room</button>
        </form>
      </Dialog>
    </div>
  );
}

export default App;