require('dotenv').config({path: __dirname + '/.env'})
var http = require('http');
const url = require('url');
const { json } = require('body-parser');
const fs = require('fs');

const jose = require('jose');
const {OAuth2Client} = require('google-auth-library');
const { google } = require('googleapis');
const { file } = require('googleapis/build/src/apis/file');

const CLIENT_ID = process.env['gapi_client_id'];
const CLIENT_SECRET = process.env['gapi_client_secret'];

const dataFolder = './data/'; // 'jobsearchtracker_app_data/';
const companiesFile = 'companies.json';
const peopleFile = 'people.json';
const opportunitiesFile = 'opportunities.json';
const interactionsFile = 'interactions.json';

const NO_TOKEN_IN_HEADER = "No Token Found in Request Header";

// TODO - MAKE THIS BETTER
let nextId = [ Date.now() ];

// TODO - MAKE THIS BETTER
function nextUniqueId() {
  return nextId[0]++;
}

// TODO - I think we have some kind of race condition with the adding of opportunities 
// TODO (if a new interaction adds a new opportunity + a company then it is trying to write the oppties twice)

// TODO - add a config file that will help generate new IDs (or just make them unique)
// TODO - make the writes more transactional to avoid blowing things up
async function deleteFile( fileName, fileId, drive ) {
    console.log( fileName );
    console.log( "==>" + fileId );
    await drive.files.delete( {fileId : fileId } );
    return fileId;
}

async function writeFile( fileName, jsonObject, req ) {
    try {

        console.log( jsonObject );
        const fileInfo = { fileId : [] };
        const drive = getDriveClient( req );
        if ( drive != null ) {
            drive.files.list({spaces: 'appDataFolder'})
            .then( (res) => {
                
                const files = res.data.files;
                if (files.length) {
                    // Store whether we found the file or not, and what was in it

                    files.map((file) => {
                        // console.log(file);
                        
                        if ( file.name === fileName ) {
                            fileInfo.fileId.push( file.id );
                        }
                    });
                }   

                return fileInfo;
            })
            .then( 
                () => {
                    if ( fileInfo.fileId != null ) {
                        fileInfo.fileId.map( (fileId) => {
                            deleteFile( fileName, fileId, drive );
                        } )
                    }
                    return fileInfo;
                })
            .then( 
                () => {
                    drive.files.create(
                        {
                            requestBody: {
                            // a requestBody element is required if you want to use multipart
                            name : fileName,
                            parents: ['appDataFolder']
                            },
                            media: {
                            body: JSON.stringify( jsonObject ),
                            },
                        }, (res) => {
                            
                        } );
                }
            )
            .catch( 
                (err) => {
                    console.log( err );
                }
            );
            
        }
    }
    catch(err) {
        console.log( err );
    }


    try {
        if (!fs.existsSync( dataFolder )) {
            fs.mkdirSync( dataFolder );
        }

        fs.writeFile( dataFolder + fileName, JSON.stringify( jsonObject, null, 2), err => {
            if (err) {
              console.error(err);
            } } );
    } catch (err) {
        console.log(err);
    }
}

function getDriveClient( req ) {
    let idTokenString = null;
    let idToken = null;
    if ( req != null && req.headers != null ) {
        idTokenString = req.headers.authorization;
    }
    
    if ( idTokenString != null ) {
        idToken = JSON.parse( idTokenString );

        const client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET); // new google.auth.GoogleAuth(); // 
        client.setCredentials(idToken);

        const drive = google.drive({
            version: 'v3',
            auth: client
        });

        return drive;
    }

    return null;
}

    async function readFileContents( fileId, req ) {
        try {
            const drive = getDriveClient( req );

            if ( drive != null ) {
                const fileContent = drive.files.get({
                    fileId: fileId,
                    alt: 'media',
                })
                .then(fileDownload => {
                    return fileDownload.data;
                });

                return fileContent;
            }
        }
        catch ( err ) {
            console.log( err );
        }
    }

    async function getFileId( fileName, req, fileInfo ) {
        try {
            const drive = getDriveClient( req );

            if ( drive != null ) {
                res = await drive.files.list({spaces: 'appDataFolder'});
                
                //console.log( res );
                //if (err) throw err;

                const files = res.data.files;
                if (files.length) {
                    // Store whether we found the file or not, and what was in it

                    files.map((file) => {
                        //drive.files.delete( {fileId :file.id } );
                        // console.log(file);
                        
                        if ( file.name === fileName ) {
                            //console.log( "FOUND THE FILE: " + file.id );
                            fileInfo.foundIt = true;
                            fileInfo.fileId = file.id;                                
                        }
                    });
                }

                /*
                console.log( fileInfo.foundIt );
                console.log( fileInfo.fileId );
                if ( fileInfo.foundIt && fileInfo.fileId != null ) {
                    console.log( fileInfo.fileId );
                    return fileInfo.fileId;
                }
                return null;*/
        }
        else {
            throw( NO_TOKEN_IN_HEADER );
        }

    } catch (err) {
        console.error(err);
    }
}

module.exports = {
    COMPANIES : companiesFile,
    PEOPLE : peopleFile,
    OPPORTUNITIES : opportunitiesFile,
    INTERACTIONS : interactionsFile,


    getAllInteractions: async function( req, res ) {
        try {
            const fileInfo = { foundIt : false, content : [], fileId : null };
            await getFileId( interactionsFile, req, fileInfo );

            if ( fileInfo.fileId != null ) {
                return await readFileContents( fileInfo.fileId, req );
            }
            //readFile( interactionsFile, req ).then( obj  => { console.log( "!!!!!" );  console.log( obj ); return obj; } );
            return [];
        }
        catch ( err ) {
            console.log( err );
            return [];
        }
    },

    getAllPeople : async function( req, res ) {
        try {
            const fileInfo = { foundIt : false, content : [], fileId : null };
            await getFileId( peopleFile, req, fileInfo );
            if ( fileInfo.fileId != null ) {
                return await readFileContents( fileInfo.fileId, req );
            }
            //readFile( interactionsFile, req ).then( obj  => { console.log( "!!!!!" );  console.log( obj ); return obj; } );
            return [];
        }
        catch ( err ) {
            console.log( err );
            return [];
        }
    },

    getAllOpportunities : async function( req, res ) {
        try {
            const fileInfo = { foundIt : false, content : [], fileId : null };
            await getFileId( opportunitiesFile, req, fileInfo );
            if ( fileInfo.fileId != null ) {
                return await readFileContents( fileInfo.fileId, req );
            }
            //readFile( interactionsFile, req ).then( obj  => { console.log( "!!!!!" );  console.log( obj ); return obj; } );
            return [];
        }
        catch ( err ) {
            console.log( err );
            return [];
        }
    }, 

    getAllCompanies : async function( req, res ) {
        try {
            const fileInfo = { foundIt : false, content : [], fileId : null };
            await getFileId( companiesFile, req, fileInfo );
            if ( fileInfo.fileId != null ) {
                return await readFileContents( fileInfo.fileId, req );
            }
            //readFile( interactionsFile, req ).then( obj  => { console.log( "!!!!!" );  console.log( obj ); return obj; } );
            return [];
        }
        catch ( err ) {
            console.log( err );
            return [];
        }
    },

    deleteRecord : async function( objectType, idToDelete, req, res ) {

        const dataTable = readFile( objectType );
        for ( var i = dataTable.length-1; i >=0; --i ) {
            if ( dataTable[i].id == idToDelete ) {
                dataTable.splice( i, 1 );
            }
        }

        writeFile( objectType, dataTable );
    },

    /**
     * Add a record to one of the data tables.  Give it a new ID, read in the type of data, add it to the table and persist it.
     * @param {*} objectType The name of the file that contains all of the data
     * @param {*} jsonObject The new object you're going to add
     */
    addRecord : async function( objectType, jsonObject, req, res ) {

        jsonObject.id = nextUniqueId();

        if ( objectType === this.OPPORTUNITIES ) {
            if ( jsonObject.company == -1 ) {
                const companyInfo = {
                    name : jsonObject.companyName
                };
                jsonObject.company = await this.addRecord( this.COMPANIES, companyInfo, req, res );
            }
        }
        else if ( objectType === this.INTERACTIONS ) {
            if ( jsonObject.companyId == -1 ) {
                const companyInfo = {
                    name : jsonObject.companyName
                };
                jsonObject.companyId = await this.addRecord( this.COMPANIES, companyInfo, req, res );
                console.log( "NEW COMPANY ID: " + jsonObject.companyId );
            }

            if ( jsonObject.personId == -1 ) {
                const personInfo = {
                    first : jsonObject.toFirst, 
                    last : jsonObject.toLast
                };
                jsonObject.personId = await this.addRecord( this.PEOPLE, personInfo, req, res );
                console.log( "NEW PERSON ID: " + jsonObject.personId );
            }

            if ( jsonObject.opptyId == -1 ) {
                const opportunityInfo = {
                    company : jsonObject.companyId,
                    jobtitle : jsonObject.opptyName
                };
                jsonObject.opptyId = await this.addRecord( this.OPPORTUNITIES, opportunityInfo, req, res );
                console.log( "NEW OPPORTUNITY ID: " + jsonObject.opptyId );
            }
        }
        else if ( objectType === this.PEOPLE ) {
            // Don't need to do anything
        }

        let dataTable = [];

        const fileInfo = { foundIt : false, content : [], fileId : null };
        await getFileId( objectType, req, fileInfo );
        if ( fileInfo.fileId != null ) {
            dataTable = await readFileContents( fileInfo.fileId, req );
        }

        // const dataTable = readFile( objectType, req );
    
        dataTable.push( jsonObject );
    
        await writeFile( objectType, dataTable, req );

        return jsonObject.id;
    },
  
    /**
     * Delete a record with the specified ID from the data table, and persist it.
     * @param {*} objectType 
     * @param {*} id 
     */
    deleteRecord : function deleteRecord( objectType, id, req, res ) {
            const dataTable = readFile( objectType, req );
        
            for ( var i = dataTable.length - 1; i >= 0; --i ) {
            if ( dataTable[i].id == id ) {
                dataTable.splice( i, 1 );
            }
        }
    
        writeFile( objectType, dataTable, req );
    }

 }