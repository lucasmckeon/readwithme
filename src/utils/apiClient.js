/**
 * Created by lucasmckeon on 4/21/22.
 */
const authURL = process.env.REACT_APP_AUTH_URL
const apiURL = process.env.REACT_APP_API_URL

export async function clientPost(endpoint,data) {
  const response = await window.fetch(`${authURL}/${endpoint}`,{
    method: 'POST',
    headers: {
      'Content-type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  if(response.ok){
    //MSW sets response body to JSON object, so call
    //.json to convert to object
    let result = await response.json();
    console.log(`Client ${result}`);
    return result;
  }
  else{
    return Promise.reject(new Error('Error in clientPost'))
  }
}
