var http = require('http');
const url = require('url');
const cors = require('cors');
const express = require('express')
const bodyParser = require('body-parser')
const flatfile = require('./flatfiledb')

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
  const all = {
    companies : persistence.getAllCompanies(),
    opportunities : persistence.getAllOpportunities(),
    people : persistence.getAllPeople(),
    interactions : persistence.getAllInteractions()
  };

  res.send( all );
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
