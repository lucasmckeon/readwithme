/**
 * Created by lucasmckeon on 4/22/22.
 */
import {clientPost} from './utils/apiClient'

async function register({username, password}) {
  return await clientPost('register',{username,password});
}

async function login({username, password}) {
  return await clientPost('login',{username,password});
}

async function createRoom({name, book, characters}) {
  return await clientPost('createRoom',{name,book,characters});
}

export {register,login,createRoom}