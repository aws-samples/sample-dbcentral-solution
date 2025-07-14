//-- Import Class Objects
const { classDSQLCluster } = require('./class.engine.js');
const { classManagement } = require('./class.mng.js');

const objectDSQLCluster = new classDSQLCluster();
const objectManagement = new classManagement();


// AWS API Variables
const fs = require('fs');
var configData = JSON.parse(fs.readFileSync('./aws-exports.json'));


// API Application Variables
const express = require('express');
const cors = require('cors')


const app = express();
const port = configData.aws_api_port;
app.use(cors());
app.use(express.json())

// API Protection
var cookieParser = require('cookie-parser')
var csrf = require('csurf')
var bodyParser = require('body-parser')
const csrfProtection = csrf({
  cookie: true,
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(csrfProtection);


// Security Variables
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
var jwkToPem = require('jwk-to-pem');
var request = require('request');
var secretKey =  crypto.randomBytes(32).toString('hex')
var pems;
var issCognitoIdp = "https://cognito-idp." + configData.aws_region + ".amazonaws.com/" + configData.aws_cognito_user_pool_id;
        


// Startup - Download PEMs Keys
gatherPemKeys(issCognitoIdp);



//--#################################################################################################### 
//   ---------------------------------------- SECURITY
//--#################################################################################################### 




//-- Verify standard token
const verifyToken = (token) => {

    try {
        const decoded = jwt.verify(token, secretKey);
        return {isValid : true, session_id: decoded.session_id};
    }
    catch (ex) { 
        return {isValid : false, session_id: ""};
    }

};


//-- Gather PEMs keys from Cognito
function gatherPemKeys(iss)
{

    if (!pems) {
        //Download the JWKs and save it as PEM
        return new Promise((resolve, reject) => {
                    request({
                       url: iss + '/.well-known/jwks.json',
                       json: true
                     }, function (error, response, body) {
                         
                        if (!error && response.statusCode === 200) {
                            pems = {};
                            var keys = body['keys'];
                            for(var i = 0; i < keys.length; i++) {
                                //Convert each key to PEM
                                var key_id = keys[i].kid;
                                var modulus = keys[i].n;
                                var exponent = keys[i].e;
                                var key_type = keys[i].kty;
                                var jwk = { kty: key_type, n: modulus, e: exponent};
                                var pem = jwkToPem(jwk);
                                pems[key_id] = pem;
                            }
                        } else {
                            //Unable to download JWKs, fail the call
                            console.log("error");
                        }
                        
                        resolve(body);
                        
                    });
        });
        
        } 
    
    
}


//-- Validate Cognito Token
function verifyTokenCognito(token) {

   try {
        //Fail if the token is not jwt
        var decodedJwt = jwt.decode(token, {complete: true});
        if (!decodedJwt) {
            console.log("Not a valid JWT token");
            return {isValid : false, session_id: ""};
        }
        
        
        if (decodedJwt.payload.iss != issCognitoIdp) {
            console.log("invalid issuer");
            return {isValid : false, session_id: ""};
        }
        
        //Reject the jwt if it's not an 'Access Token'
        if (decodedJwt.payload.token_use != 'access') {
            console.log("Not an access token");
            return {isValid : false, session_id: ""};
        }
    
        //Get the kid from the token and retrieve corresponding PEM
        var kid = decodedJwt.header.kid;
        var pem = pems[kid];
        if (!pem) {
            console.log('Invalid access token');
            return {isValid : false, session_id: ""};
        }

        const decoded = jwt.verify(token, pem, { issuer: issCognitoIdp });
        return {isValid : true, session_id: ""};
    }
    catch (ex) { 
        console.log("Unauthorized Token");
        return {isValid : false, session_id: ""};
    }
    
};







//--#################################################################################################### 
//   ---------------------------------------- AURORA - DSQL
//--#################################################################################################### 




//--++ AURORA - DSQL : Gather stats
app.get("/api/aurora/cluster/dsql/gather/stats/", gatherStatsAuroraDSQLCluster);
async function gatherStatsAuroraDSQLCluster(req, res) {
        
        // Token Validation
        var cognitoToken = verifyTokenCognito(req.headers['x-token-cognito']);
    
        if (cognitoToken.isValid === false)
            return res.status(511).send({ result : [], message : "Token is invalid"});
 
        try
            {
                var params = req.query;                          
                var dataset = await objectDSQLCluster.getDSQLMetrics(params);
                res.status(200).send({ csrfToken: req.csrfToken(), metrics : dataset.metrics, lastTimestamp : dataset.lastTimestamp });                      
                
        }
        catch(err){
                console.log(err);
        }
}



//--## AWS : List Aurora DSQL Clusters
app.get("/api/aws/aurora/dsql/clusters/list/", async (req,res)=>{
   
    // Token Validation
    var cognitoToken = verifyTokenCognito(req.headers['x-token-cognito']);
    
    if (cognitoToken.isValid === false)
        return res.status(511).send({ result : [], message : "Token is invalid"});

    // API Call
    var params = req.query

    try {
        var results = await objectDSQLCluster.getGlobalDSQLClusters(params);
        res.status(200).send({ csrfToken: req.csrfToken(), results : results });
        
    } catch(error) {
        console.log(error)
                
    }

});




//--#################################################################################################### 
//   ---------------------------------------- AWS
//--#################################################################################################### 


//--## AWS : Get user profile
app.get("/api/aws/user/profile/get/", async (req,res)=>{
   
    // Token Validation
    var cognitoToken = verifyTokenCognito(req.headers['x-token-cognito']);
    
    if (cognitoToken.isValid === false)
        return res.status(511).send({ result : [], message : "Token is invalid"});

    // API Call
    var params = req.query;   

    try {
        var result = await objectManagement.getProfile(params);
        res.status(200).send({ csrfToken: req.csrfToken(), result : result });
        
    } catch(error) {
        console.log(error)
                
    }

});



//--## AWS : Get user profile
app.get("/api/aws/user/profile/update/", async (req,res)=>{
   
    // Token Validation
    var cognitoToken = verifyTokenCognito(req.headers['x-token-cognito']);
    
    if (cognitoToken.isValid === false)
        return res.status(511).send({ result : [], message : "Token is invalid"});

    // API Call
    var params = req.query;
    
    try {
        var result = await objectManagement.updateProfile(params);
        res.status(200).send({ csrfToken: req.csrfToken(), result : result });
        
    } catch(error) {
        console.log(error)
                
    }

});




//--#################################################################################################### 
//   ---------------------------------------- MAIN API CORE
//--#################################################################################################### 


app.listen(port, ()=>{
    console.log(`Server is running on ${port}`)
})