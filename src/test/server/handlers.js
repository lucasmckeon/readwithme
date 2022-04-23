/**
 * Created by lucasmckeon on 4/21/22.
 */
import {rest} from 'msw'
import * as usersDB from '../data/users'
import * as readingRoomsDB from '../data/readingRooms'
const authURL = process.env.REACT_APP_AUTH_URL
//For now just use authURL for everything, later I can use api
const apiURL = process.env.REACT_APP_API_URL

export const handlers = [
  rest.post(`${authURL}/register`, (req,res,ctx) => {
    const {username,password} = req.body;
    //create a user in the local storage
    const user = usersDB.create({username,password});
    //ctx.json sets a JSON response body
    return res(ctx.status(200), ctx.json(user));
  }),
  rest.post(`${authURL}/login`,(req,res,ctx) => {
    const {username,password} = req.body;
    const user = usersDB.login({username,password});
    return res(ctx.status(200),ctx.json(user));
  }),
  rest.post(`${authURL}/createRoom`,(req,res,ctx) => {
    const roomToCreate = req.body;
    const room = readingRoomsDB.create(roomToCreate);
    console.log(room);
    return res(ctx.status(200),ctx.json(room));
  }),
]