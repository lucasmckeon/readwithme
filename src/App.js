import './App.css';
import '@reach/dialog/styles.css'
import * as React from 'react'
import {Dialog} from '@reach/dialog'
import {Link,Outlet,useNavigate} from 'react-router-dom'
import {DiscoverRooms} from './screens/DiscoverRooms'
import {createBookRoom,doesReadingRoomExist,getUser} from './utils/dbHandler'
import {auth,useAuthUser} from './utils/firebase'
import * as firebaseui from 'firebaseui'
import {EmailAuthProvider,signOut} from "firebase/auth"
import { getFunctions, httpsCallable } from "firebase/functions";

function LoginForm({handleSuccessfulSignIn}) {
  //const firebaseui = React.lazy(() => import('firebaseui'));
  const firebaseAuthUI = firebaseui.auth.AuthUI.getInstance() ||
      new firebaseui.auth.AuthUI(auth);
  const path = window.location.pathname;
  var uiConfig = {
    callbacks: {
      signInSuccessWithAuthResult: function(authResult, redirectUrl) {
        // User successfully signed in.
        // Return type determines whether we continue the redirect automatically
        // or whether we leave that to the developer to handle.
        handleSuccessfulSignIn(authResult.user);
        return false;
      },
      uiShown: function() {
        // The widget is rendered.
        // Hide the loader.
        document.getElementById('loader').style.display = 'none';
      }
    },
    // Will use popup for IDP Providers sign-in flow instead of the default, redirect.
    signInFlow: 'popup',
    //signInSuccessUrl: path,
    // autoUpgradeAnonymousUsers: true,
    signInOptions: [
      // Leave the lines as is for the providers you want to offer your users.
      // auth.GoogleAuthProvider.PROVIDER_ID,
      // auth.FacebookAuthProvider.PROVIDER_ID,
      // auth.TwitterAuthProvider.PROVIDER_ID,
      // auth.GithubAuthProvider.PROVIDER_ID,
      EmailAuthProvider.PROVIDER_ID
    ],
    // Terms of service url.
    tosUrl: '<your-tos-url>',
    // Privacy policy url.
    privacyPolicyUrl: '<your-privacy-policy-url>'
  };
  React.useEffect(()=>{
    firebaseAuthUI.start('#firebaseui-auth-container', uiConfig);
  });

  return (
    <React.Fragment>
      <div id="firebaseui-auth-container"></div>
      <div id="loader">Loading...</div>
    </React.Fragment>
  )
}

const IS_OPEN = {NONE:'none',LOGIN:'login',CREATE_ROOM:'create_room',
  CREATE_READING_ROOM:'create_reading_room',CHOOSE_USERNAME:'choose_username'};

function App() {
  const [isOpen,setIsOpen] = React.useState(IS_OPEN.NONE);
  const [usernameChosen, setUsernameChosen] = React.useState(false);
  const navigate = useNavigate();
  const open = (whichIsOpen) => setIsOpen(whichIsOpen);
  const close = () => {
    setIsOpen(IS_OPEN.NONE);
  };
  const authUser = useAuthUser();
  React.useEffect(()=>{
    if(authUser){
      const shouldWeShowChooseUsername = async ()=>{
        if(await doesUserHaveUsername(authUser) === false ) {
          setIsOpen(IS_OPEN.CHOOSE_USERNAME);
        }
      };
      shouldWeShowChooseUsername();
    }
  },[authUser]);

  async function doesUserHaveUsername(authUser) {
    const u = await getUser(authUser.uid);
    if(u === null || u.username === null){
      return false;
    }
    return true;
  }

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

  function handleChooseUsername(e) {
    e.preventDefault();
    const {chooseUsername} = e.target.elements;
    const username = chooseUsername.value;
    const functions = getFunctions();
    const updateUsername = httpsCallable(functions, 'onUsernameUpdated');
    updateUsername({ text: username })
        .then((result) => {
          // Read result of the Cloud Function.
          /** @type {any} */
          const data = result.data;
          if( data.success ){
            alert(`Username: ${username} successfully chosen!`);
            close();
          } else{
            alert(`Error occurred: ${data.message}`);
          }
        }).catch(e=>{
          console.error(e);
          alert('An error occurred while choosing a username' );
    });
  }

  async function handleSuccessfulSignIn(authUser) {
    close();
    if(await doesUserHaveUsername(authUser) === false){
      setIsOpen(IS_OPEN.CHOOSE_USERNAME);
    }
  }

  function handleSignOut(e) {
    e.preventDefault();
    signOut(auth).then(()=>{
      console.log('Sign out successful');
    }).catch((error)=>{
      console.error(error);
    });
  }

  return (
    <div className="App">
      <div>
        <button onClick={()=>setIsOpen(IS_OPEN.LOGIN)}>Register</button>
        <button onClick={()=>setIsOpen(IS_OPEN.LOGIN)}>Login</button>
        <button onClick={()=>setIsOpen(IS_OPEN.CREATE_ROOM)}>Create Book Room</button>
        <button onClick={()=>setIsOpen(IS_OPEN.CREATE_READING_ROOM)}>Create Reading Room</button>
        <button onClick={handleSignOut}>Sign Out</button>
      </div>
      <div>
        <nav style={{margin:'1rem'}}>
          <Link to="/discover">Discover</Link>
        </nav>
      </div>
      <div>
        <Outlet/>
      </div>
      <Dialog aria-label={"Login"} isOpen={isOpen === IS_OPEN.LOGIN} onDismiss={close}>
        <button className="close-button" onClick={close}>
          <span aria-hidden>×</span>
        </button>
        <LoginForm handleSuccessfulSignIn = {handleSuccessfulSignIn}/>
      </Dialog>
      <Dialog aria-label={"Choose username"} isOpen={isOpen === IS_OPEN.CHOOSE_USERNAME} onDismiss={()=>setIsOpen(IS_OPEN.CHOOSE_USERNAME)}>
        <h3>Choose Username</h3>
        <form onSubmit={handleChooseUsername}>
          <div>
            <label htmlFor="chooseUsername">Choose Username:</label>
            <input id="chooseUsername"/>
          </div>
          <button type="submit">Choose Username</button>
        </form>
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