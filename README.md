# jobsearch-api
API service supporting the jobsearch webapp (https://github.com/joddyjods/jobsearch)

# How to set it up
- npm install express (dependency)
- npm i --save cors (dependency)
- npm install googleapis 
      - https://github.com/googleapis/google-api-nodejs-client
      - https://developers.google.com/identity/sign-in/web/sign-in
- npm install @googleapis/docs
- npm install google-auth-library --save
- npm install jose (JWT library)
- npm install google-oauth-jwt
- npm install dotenv
- node jobsearch-api.js


# TODO
- Use the google drive API as the persistence for the files instead of the file system
- Change the way unique IDs are handed out so that the API service can be stateless
- Revoke and replace the client ID from google cloud