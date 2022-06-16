var http = require('http');
const url = require('url');
const cors = require('cors');
const express = require('express')
const bodyParser = require('body-parser')
const flatfile = require('./flatfiledb')
const jose = require('jose');

const {OAuth2Client} = require('google-auth-library');
const e = require('cors');

// TODO - change the client ID and pass it in with an environment variable
const CLIENT_ID = "152798730660-61397c89b64orq4a0d0i56p74p0ljks2.apps.googleusercontent.com";
const client = new OAuth2Client(CLIENT_ID);

const NO_TOKEN_IN_HEADER = "No JWT token was specified in the request header";

async function verify( req ) {

  let idTokenString = null;
  let idToken = null;
  if ( req != null && req.headers != null ) {
    idTokenString = req.headers.authorization;
  }
  
  if ( idTokenString != null ) {
    idToken = JSON.parse( idTokenString );
  
    const ticket = await client.verifyIdToken({
          idToken: idToken.id_token,
          audience: CLIENT_ID
      }).catch( error => { throw( error ) } );
    
    /*const payload = ticket.getPayload();
    const userid = payload['sub'];*/
    // If request specified a G Suite domain:
    // const domain = payload['hd'];
  }
  else {
    throw( NO_TOKEN_IN_HEADER );
  }
}

const app = express();
app.use(cors());

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

const port = 8080;

// Use flat file storage - be able to swap this out for something different
const persistence = flatfile;

app.get('/', (req, res) => {
  res.send('jobsearch API')
});

app.get( '/interactions', (req, res) => {
  res.send( persistence.getAllInteractions() );
});

app.get( '/people', (req, res) => {
  res.send( persistence.getAllPeople() );
});

app.get( '/opportunities', (req, res) => {
  res.send( persistence.getAllOpportunities() );
});

app.get( '/companies', (req, res) => {
  res.send( persistence.getAllCompanies() );
});

app.get( '/all', (req, res) => {

  verify( req )
  .then( () =>
    {
      const all = {
        companies : persistence.getAllCompanies(),
        opportunities : persistence.getAllOpportunities(),
        people : persistence.getAllPeople(),
        interactions : persistence.getAllInteractions()
      };
    
      res.send( all );
    }
  )
  .catch(
    error => {
      console.log ("OH ERROR BIG TIME" );
      console.log( error );
      res.ok = false;
      res.status = 401;
      res.statusText = error;
      const all = {};

      res.send( all );
    }
  );
  
});

app.listen(port, () => {
  console.log(`jobsearch-api listening on ${port}`)
});

app.post( '/interactions', (req, res) => {
  persistence.addRecord( persistence.INTERACTIONS, req.body );
  res.send( { status : "Success" } );
});

app.delete( '/interactions', (req, res) => {
  const queryObject = url.parse( req.url, true).query;
  const id = queryObject.id;
  
  if ( id != null ) {
    persistence.deleteRecord( persistence.INTERACTIONS, id );
  }
  res.send( { status : "Success" } );
});
