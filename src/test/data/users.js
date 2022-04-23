/**
 * Created by lucasmckeon on 4/21/22.
 */

function create({username,password}) {
  //Add a user to local storage with just username and password,
  //and see if we can get that user back
  window.localStorage.setItem(JSON.stringify({username,password}),JSON.stringify({username,password}));
  return JSON.parse(window.localStorage.getItem(JSON.stringify({username,password})));
}

function login({username, password}) {
  return JSON.parse(window.localStorage.getItem(JSON.stringify({username,password})));
}

export {create,login}