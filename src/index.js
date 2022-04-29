import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import './test/server/devServer';
import {DiscoverRooms} from './screens/DiscoverRooms'
import {ReadingRoom} from './screens/ReadingRoom'
//Browser Router connects our app to the browsers URL
//Wrap entire app in Router as both unauth and auth users need router support
import {BrowserRouter,Routes,Route} from 'react-router-dom'

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App/>}>
          <Route path="discover" element={<DiscoverRooms/>}/>
          <Route path="room/:roomName" element={<ReadingRoom/>}/>
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
