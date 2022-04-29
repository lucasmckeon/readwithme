/**
 * Created by lucasmckeon on 4/22/22.
 */
const rooms = [
  {
    name:'Vampire', book:'Vampire Academy', characters:['Adrian','Sydney']
  },
  { name:'Bloodlines', book:'Bloodlines', characters:['Adrian','Sydney']},
  { name:'Golden Lily', book:'The Golden Lily', characters:['Adrian','Sydney']}
];

function create({name, book, characters}) {
  window.localStorage.setItem(name,JSON.stringify({name,book,characters}));
  return JSON.parse(window.localStorage.getItem(name));
}

function getRoom(name) {
  //return JSON.parse(window.localStorage.getItem(name));
  return rooms.find(room => room.name === name );
}

function getRooms(nameStartsWith) {
  return rooms.filter(room => room.name.startsWith(nameStartsWith));
}

export {create,getRoom,getRooms}