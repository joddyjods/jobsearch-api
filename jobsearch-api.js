var http = require('http');
require('dotenv').config({path: __dirname + '/.env'})
const url = require('url');
const cors = require('cors');
const express = require('express')
const bodyParser = require('body-parser')
const flatfile = require('./flatfiledb')
const googledrive = require('./googledrivedb')
const jose = require('jose');

const {OAuth2Client} = require('google-auth-library');
const e = require('cors');

// TODO - change the client ID and pass it in with an environment variable
const CLIENT_ID = process.env['gapi_client_id'];
const CLIENT_SECRET = process.env['gapi_client_secret'];
const PERSISTENCE = process.env['persistence_type'];

const NO_TOKEN_IN_HEADER = "No JWT token was specified in the request header";

async function verify( req ) {

  const client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET);

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

    return ticket;
    
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

// Use flat file storage by default
let persistence = flatfile;
if ( PERSISTENCE === 'googledrive' ) { persistence = googledrive };
if ( PERSISTENCE === 'flatfile' ) { persistence = flatfile };

app.get('/', (req, res) => {
  res.send('jobsearch API')
});

app.get( '/interactions', (req, res) => {
  res.send( persistence.getAllInteractions( req, res ) );
});

app.get( '/people', (req, res) => {
  res.send( persistence.getAllPeople( req, res ) );
});

app.get( '/opportunities', (req, res) => {
  res.send( persistence.getAllOpportunities( req, res ) );
});

app.get( '/companies', (req, res) => {
  res.send( persistence.getAllCompanies( req, res ) );
});

app.get( '/all', (req, res) => {

  verify( req )
  .then( ( ticket ) =>
    {
      const all = {
        /*companies : persistence.getAllCompanies( req, res ),
        opportunities : persistence.getAllOpportunities( req, res ),
        people : persistence.getAllPeople( req, res ),
        interactions : persistence.getAllInteractions( req, res )*/
      };

      Promise.all(
        [persistence.getAllCompanies( req, res ).then( (company) => { all.companies = company }),
        persistence.getAllOpportunities( req, res ).then( (opportunity) => { all.opportunities = opportunity }),
        persistence.getAllPeople( req, res ).then( (person) => { all.people = person }),
        persistence.getAllInteractions( req, res ).then( (interaction) => { all.interactions = interaction })]
      ).then( () => res.send( all ) );

      /*persistence.getAllCompanies( req, res ).then( (company) => { all.companies = company })
      .then( () => {
        persistence.getAllOpportunities( req, res ).then( (opportunity) => { all.opportunities = opportunity })
        .then( () => {
          persistence.getAllPeople( req, res ).then( (person) => { all.people = person })
          .then( () => {
            persistence.getAllInteractions( req, res ).then( (interaction) => { all.interactions = interaction })
            .then( () => {
              res.send( all );
            } )
          } )
        })
      });*/
      
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
  persistence.addRecord( persistence.INTERACTIONS, req.body, req, res );
  res.send( { status : "Success" } );
});

app.delete( '/interactions', (req, res) => {
  const queryObject = url.parse( req.url, true).query;
  const id = queryObject.id;
  
  if ( id != null ) {
    persistence.deleteRecord( persistence.INTERACTIONS, id, req, res );
  }
  res.send( { status : "Success" } );
});
