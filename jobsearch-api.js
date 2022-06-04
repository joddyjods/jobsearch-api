var http = require('http');
const fs = require('fs');
const express = require('express')

const app = express()
const port = 8080

const dataFolder = './data/';
const companiesFile = 'companies.json';
const peopleFile = 'people.json';
const opportunitiesFile = 'opportunities.json';
const interactionsFile = 'interactions.json';

app.get('/', (req, res) => {
  res.send('jobsearch API')
});

app.get( '/interactions', (req, res) => {
  res.send( readFile( interactionsFile ) );
});

app.get( '/people', (req, res) => {
  res.send( readFile( peopleFile ) );
});

app.get( '/opportunities', (req, res) => {
  res.send( readFile( opportunitiesFile ) );
});

app.get( '/companies', (req, res) => {
  res.send( readFile( companiesFile ) );
});

app.listen(port, () => {
  console.log(`jobsearch-api listening on ${port}`)
});



const nextId = [ Date.now() ];

async function writeFile( fileName, jsonObject ) {
  try {
    if (!fs.existsSync( dataFolder )) {
      fs.mkdirSync( dataFolder );
    }

    await fs.writeFile( dataFolder + fileName, jsonObject);
  } catch (err) {
    console.log(err);
  }
}

function readFile( fileName ) {
  try {
    const data = fs.readFileSync( dataFolder + fileName, 'utf8');
    return JSON.parse( data );
  } catch (err) {
    console.error(err);
  }
}

function nextUniqueId() {
  nextId[0]++;
}

/**
 * Add a record to one of the data tables.  Give it a new ID, read in the type of data, add it to the table and persist it.
 * @param {*} fileName The name of the file that contains all of the data
 * @param {*} jsonObject The new object you're going to add
 */
function addRecord( fileName, jsonObject ) {

  jsonObject.id = nextUniqueId();

  const dataTable = readFile( fileName );

  dataTable.push( jsonObject );

  writeFile( fileName, dataTable );
}

/**
 * Delete a record with the specified ID from the data table, and persist it.
 * @param {*} fileName 
 * @param {*} id 
 */
function deleteRecord( fileName, id ) {
  const dataTable = readFile( fileName );

  for ( var i = dataTable.length - 1; i >= 0; --i ) {
    if ( dataTable[i].id == id ) {
      dataTable.splice( i, 1 );
    }
  }

  writeFile( fileName, dataTable );
}