/**
 * Created by lucasmckeon on 4/22/22.
 */
function create({name, book, characters}) {
  window.localStorage.setItem(name,JSON.stringify({name,book,characters}));
  return JSON.parse(window.localStorage.getItem(name));
}

function getRoom(name) {
  return JSON.parse(window.localStorage.getItem(name));
}

export {create,getRoom}