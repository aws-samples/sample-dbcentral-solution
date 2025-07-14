
const { DynamoDBClient, GetItemCommand, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');


// AWS Config Variables
const fs = require('fs');
var configData = JSON.parse(fs.readFileSync('./aws-exports.json'));

// AWS Config Variables
const { classLogging } = require('./class.logging.js');


//--#################################################################################################### 
//--#################################################################################################### 
//   ---------------   CLASS  :  classManagement
//--#################################################################################################### 
//--#################################################################################################### 



class classManagement {


    #objLog = new classLogging({ name : "classManagement", instance : "generic" });

    //--## Contrutor
    constructor(logger = console) {
        this.client = new DynamoDBClient({ region : configData.aws_region });
        this.tableName = "tblDBCentralProfiles";
    }


    //--## Get profile
    async getProfile(config) {
        try {
          const params = {
            TableName: this.tableName,
            Key: marshall({ userId : config.userId })
          };
    
          const command = new GetItemCommand(params);
          const response = await this.client.send(command);
    
          if (!response.Item) {
            return {
                accounts: [],
                regions: []     
              };
          }
    
          const item = unmarshall(response.Item);          
          return item.profile;          

        } catch (err) {
            this.#objLog.write("getProfile","err",err);
          return {
            accounts: [],
            regions: []     
          };
        }
      }




      //--## Update profile
      async updateProfile(config) {
        try {
           // Using PutItem for upsert operation (will create if not exists or replace if exists)
          const params = {
            TableName: this.tableName,
            Item: marshall({
              userId: config.userId,
              profile: config.profile
            }),
            ReturnValues: 'ALL_OLD'
          };
    
          const command = new PutItemCommand(params);
          await this.client.send(command);
          
          return config.profile;

          
        } catch (err) {
            this.#objLog.write("updateProfile","err",err);
          return {
            accounts: [],
            regions: []     
          };
        }
      }

  }



module.exports = { classManagement  };


