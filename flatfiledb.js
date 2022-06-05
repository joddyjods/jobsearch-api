
const { json } = require('body-parser');
const fs = require('fs');

const dataFolder = './data/';
const companiesFile = 'companies.json';
const peopleFile = 'people.json';
const opportunitiesFile = 'opportunities.json';
const interactionsFile = 'interactions.json';

let nextId = [ Date.now() ];

function nextUniqueId() {
  return nextId[0]++;
}

async function writeFile( fileName, jsonObject ) {
    try {
        if (!fs.existsSync( dataFolder )) {
            fs.mkdirSync( dataFolder );
        }

        fs.writeFile( dataFolder + fileName, JSON.stringify( jsonObject), err => {
            if (err) {
              console.error(err);
            } } );
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

module.exports = {
    COMPANIES : companiesFile,
    PEOPLE : peopleFile,
    OPPORTUNITIES : opportunitiesFile,
    INTERACTIONS : interactionsFile,


    getAllInteractions: function() {
        return readFile( interactionsFile );
    },

    getAllPeople : function() {
        return readFile( peopleFile );
    },

    getAllOpportunities : function() {
        return readFile( opportunitiesFile );
    }, 

    getAllCompanies : function() {
        return readFile( companiesFile );
    },

    /**
     * Add a record to one of the data tables.  Give it a new ID, read in the type of data, add it to the table and persist it.
     * @param {*} objectType The name of the file that contains all of the data
     * @param {*} jsonObject The new object you're going to add
     */
    addRecord : function( objectType, jsonObject ) {

        jsonObject.id = nextUniqueId();

        if ( objectType === this.OPPORTUNITIES ) {
            console.log( "TODO - gotta handle prepping opportunities" );
        }
        else if ( objectType === this.INTERACTIONS ) {
            console.log( jsonObject );
            if ( jsonObject.companyId == -1 ) {
                const companyInfo = {
                    name : jsonObject.companyName
                };
                jsonObject.companyId = this.addRecord( this.COMPANIES, companyInfo );
            }

            if ( jsonObject.personId == -1 ) {
                const personInfo = {
                    first : jsonObject.toFirst, 
                    last : jsonObject.toLast
                };
                jsonObject.personId = this.addRecord( this.PEOPLE, personInfo );
            }

            if ( jsonObject.opptyId == -1 ) {
                const opportunityInfo = {
                    company : jsonObject.companyId,
                    jobtitle : jsonObject.opptyName
                };
                jsonObject.opptyId = this.addRecord( this.OPPORTUNITIES, opportunityInfo );
            }
        }
        else if ( objectType === this.PEOPLE ) {
            console.log( "TODO - gotta handle prepping people" );
        }
    
        const dataTable = readFile( objectType );
    
        dataTable.push( jsonObject );
    
        writeFile( objectType, dataTable );

        return jsonObject.id;
    },
  
    /**
     * Delete a record with the specified ID from the data table, and persist it.
     * @param {*} objectType 
     * @param {*} id 
     */
    deleteRecord : function deleteRecord( objectType, id ) {
            const dataTable = readFile( objectType );
        
            for ( var i = dataTable.length - 1; i >= 0; --i ) {
            if ( dataTable[i].id == id ) {
                dataTable.splice( i, 1 );
            }
        }
    
        writeFile( objectType, dataTable );
    }

 }