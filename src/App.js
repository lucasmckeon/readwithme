import './App.css';
import {register,login,createRoom} from './authProvider'
import * as React from 'react'

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
          {characters.map(character => <li key={character}>{character}</li>)}
        </ul>
      </div>
  )
}

function App() {
  const [characters,setCharacters] = React.useState([]);
  async function handleRegister(e) {
    e.preventDefault();
    const {username,password} = e.target.elements;
    const {username:user} = await register({
      username:username.value,
      password:password.value});
  }
  async function handleLogin(e){
    e.preventDefault();
    const {username,password} = e.target.elements;
    const user = await login({
      username:username.value,
      password:password.value});
  }
  async function handleCreateReadingRoom(e) {
    e.preventDefault();
    const {roomName:name,book} = e.target.elements;
    const room = await createRoom({name:name.value,book:book.value,characters});
    console.log(room);
  }
  return (
    <div className="App">
      <div>
        <h3>Register</h3>
        <form onSubmit={handleRegister}>
          <label htmlFor="username">Username</label>
          <input id="username"/>
          <label htmlFor="password">Password</label>
          <input id="password"/>
          <button type="submit">Submit</button>
        </form>
      </div>
      <div>
        <h3>Login</h3>
        <form onSubmit={handleLogin}>
          <label htmlFor="username">Username</label>
          <input id="username"/>
          <label htmlFor="password">Password</label>
          <input id="password"/>
          <button type="submit">Submit</button>
        </form>
      </div>
      <div>
        <h3>Reading Room</h3>
        <form onSubmit={handleCreateReadingRoom}>
          <label htmlFor="roomName">Room Name</label>
          <input id="roomName"/>
          <label htmlFor="book">Book</label>
          <input id="book"/>
          <Characters characters={characters} setCharacters={setCharacters}/>
          <button type="submit">Create Room</button>
        </form>
      </div>
    </div>
  );
}

export default App;
