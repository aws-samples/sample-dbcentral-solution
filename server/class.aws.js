
// AWS Config Variables
const { classLogging } = require('./class.logging.js');


//--## AWS Libraries
const { DSQLClient, ListClustersCommand, GetClusterCommand } = require("@aws-sdk/client-dsql");
const { CloudWatchClient, GetMetricDataCommand } = require("@aws-sdk/client-cloudwatch");
const { STSClient, AssumeRoleCommand } = require("@aws-sdk/client-sts");



//--#################################################################################################### 
//--#################################################################################################### 
//   ---------------   CLASS  :  classAWS
//--#################################################################################################### 
//--#################################################################################################### 

        

class classAWS {


    #objLog = new classLogging({ name : "classAWS", instance : "generic" });

    //--## Contrutor
    constructor(logger = console, maxConcurrency = 10) {
            this.maxConcurrency = maxConcurrency;
            this.logger = logger;
            this.IAMRoleName  = "IAMRoleDBCentralSolution";
            this.jitterCollection = 2;
    }

    
    //--########################################
    //--############### - SECURITY
    //--########################################

    //--## Get credentials
    async #getTemporaryCredentials(roleArn, region) {

          try {
            const stsClient = new STSClient({ region });
            const command = new AssumeRoleCommand({
              RoleArn: roleArn,
              RoleSessionName: 'CloudWatchMetricsQuerySession',
              DurationSeconds: 900, // 15 minutes
            });

            const response = await stsClient.send(command);
            return {
              accessKeyId: response.Credentials.AccessKeyId,
              secretAccessKey: response.Credentials.SecretAccessKey,
              sessionToken: response.Credentials.SessionToken,
            };
          } catch (error) {
            this.logger.error('Error assuming role:', error);
            throw error;
          }
    }

    //--## Format date
    #formatDate(date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    }

    
    
    
    //--########################################
    //--############### - CLOUDWATCH API
    //--########################################



    //--## Get generic metrics by api   
    async getCloudWatchGenericMetricsDataset(config) {
            try {
                    // Set up CloudWatch client with assumed role if provided
                    config.arnRole  = "arn:aws:iam::" + config.account  + ":role/" +  this.IAMRoleName;
                    let cloudwatchClientConfig = { region: config.region };
                    
                    if (config.arnRole) {
                      try {
                            const credentials = await this.#getTemporaryCredentials(config.arnRole, config.region);
                            cloudwatchClientConfig.credentials = credentials;
                      } catch (roleError) {
                            this.logger.warn("Failed to assume role, proceeding with default credentials", roleError);
                      }
                    }
                    
                    const cloudwatchClient = new CloudWatchClient(cloudwatchClientConfig);
                    
                    // Calculate time range
                    
                    /*
                    const endTime = new Date();
                    endTime.setMinutes(endTime.getMinutes() - 2); // Adjust 2 minututes for CloudWatch delayed refresh
                    const startTime = new Date(endTime - (parseInt(config.period) * 60000)); // config.period in minutes
                    */                   
                    
                    const endTime = config.endTime;                    
                    const startTime = config.startTime;
                    const intervalMinutes = parseInt(config.interval);


                    // Generate all possible timestamps upfront
                    const timePoints = [];
                    let currentTime = new Date(startTime);
                    
                    
                    while (currentTime < endTime) {
                      timePoints.push(new Date(currentTime));
                      currentTime = new Date(currentTime.getTime() + (intervalMinutes * 60000));
                    }

                    const formattedTimePoints = timePoints.map(date => this.#formatDate(date));
                    
                    
                    
                    // Initialize the result object with zero values for all metrics
                    const result = {};
                    for (const metric of config.metrics) {
                          const zeroHistory = formattedTimePoints.map(timestamp => [timestamp, 0]);
                          result[metric.name] = {
                            lastValue: 0,
                            lastTimestamp: zeroHistory.length > 0 ? zeroHistory[zeroHistory.length - 1][0] : "",
                            history: zeroHistory
                          };
                    }



                    // Build metric data queries
                    const dataQueries = [];
                    config.metrics.forEach((metric, index) => {
                              
                              dataQueries.push({
                                          Id: `m${index.toString().padStart(2, '0')}`,
                                          MetricStat: {
                                            Metric: {
                                              Namespace: config.namespace,
                                              MetricName: metric.name,
                                              Dimensions: config.dimension
                                            },
                                            Period: intervalMinutes * 60, // interval in minutes converted to seconds
                                            Stat: metric.stat
                                          },
                                          Label: metric.name
                              });
                    });

                    // Execute CloudWatch query
                    const queryParams = {
                            MetricDataQueries: dataQueries,
                            StartTime: startTime,
                            EndTime: endTime
                    };

                                          
                    const command = new GetMetricDataCommand(queryParams);
                    const data = await cloudwatchClient.send(command);
                    
                    // Process the returned data
                    if (data.MetricDataResults && data.MetricDataResults.length > 0) {                          
                          for (const metricData of data.MetricDataResults) {
                                  
                                  const metricName = metricData.Label;
                                  
                                  if (!result[metricName]) {
                                      this.logger.warn(`Received data for unknown metric: ${metricName}`);
                                      continue;
                                  }
                                  
                                  const metricConfig = config.metrics.find(m => m.name === metricName);
                                  
                                  // Skip if no timestamps or values
                                  if (!metricData.Timestamps || metricData.Timestamps.length === 0) {
                                        //this.logger.debug(`No data points for metric: ${metricName}`);
                                        continue;
                                  }
                                  
                                  
                                  // Create a map of timestamp to value for this metric
                                  const valueMap = new Map();
                                  
                                  for (let i = 0; i < metricData.Timestamps.length; i++) {
                                        const timestamp = this.#formatDate(new Date(metricData.Timestamps[i]));
                                        
                                        // Apply divideby factor if specified
                                        let value = metricData.Values[i];
                                        if (metricConfig.divideby && metricConfig.divideby !== "1") {
                                          value = value / parseFloat(metricConfig.divideby);
                                        }
                                        
                                        valueMap.set(timestamp, value);
                                  }
                                  
                                  // Update the history with actual values
                                  const updatedHistory = result[metricName].history.map(([timestamp, _]) => {
                                        const value = valueMap.has(timestamp) ? valueMap.get(timestamp) : 0;
                                        return [timestamp, value];
                                  });
                                  
                                  // Find the last non-zero value and timestamp                                  
                                  let lastValue = 0;
                                  let lastTimestamp = "";
                                  
                                  if ( updatedHistory.length > 0) {                                        
                                      lastValue = updatedHistory[updatedHistory.length - 1][1];
                                      lastTimestamp = updatedHistory[updatedHistory.length - 1][0];
                                  }                                  

                                  /*                                  
                                  for (let i = updatedHistory.length - 1; i >= 0; i--) {
                                        if (updatedHistory[i][1] !== 0) {
                                          lastValue = updatedHistory[i][1];
                                          lastTimestamp = updatedHistory[i][0];
                                          break;
                                        }
                                  }
                                  */

                                  
                                  // If all values are zero, use the last timestamp anyway
                                  if (lastTimestamp === "" && updatedHistory.length > 0) {                                        
                                        lastTimestamp = updatedHistory[updatedHistory.length - 1][0];
                                  }
                                  
                                  //updatedHistory.splice(-1);                                  

                                  // Update the result
                                  result[metricName] = {
                                                        lastValue: lastValue,
                                                        lastTimestamp: lastTimestamp,
                                                        history: updatedHistory
                                  };
                          }
                    }
                    
                    return result;
            } catch (error) {
              this.logger.error("Error in getCloudWatchGenericMetricsDataset:", error);
              return {};
            }
    }

   

    //--########################################
    //--############### - CLOUDWATCH - INSIGHT
    //--########################################




    //--## Format ISO timestamp to readable format
    #formatTimestamp(timestamp) {
          const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
          
          // Format: YYYY-MM-DD HH:MM
          const year = date.getUTCFullYear();
          const month = String(date.getUTCMonth() + 1).padStart(2, '0');
          const day = String(date.getUTCDate()).padStart(2, '0');
          const hours = String(date.getUTCHours()).padStart(2, '0');
          const minutes = String(date.getUTCMinutes()).padStart(2, '0');
          
          return `${year}-${month}-${day} ${hours}:${minutes}`;
    }



      //--## Get Metrics
      async getMetricData(params) {
            try {
                const dataQueries = [
                    {
                        "Expression": params.sql,
                        "Id": "q1",
                        "Period": params.period
                    }
                ];
                
                
                const endTime = new Date();
                endTime.setMinutes(endTime.getMinutes() - this.jitterCollection);
                const startTime = new Date(endTime - (params.interval * 60000));                
                

                
                const queryClw = {
                    MetricDataQueries: dataQueries,
                    "StartTime": startTime,
                    "EndTime": endTime
                };

                const arnRole = `arn:aws:iam::${params.account}:role/${params.IAMRoleName}`;
                  
                // Set up CloudWatch client with assumed role
                let clientConfig = { region: params.region };
                      
                if (arnRole) {
                    try {
                        const credentials = await this.#getTemporaryCredentials(arnRole, params.region);
                        clientConfig.credentials = credentials;
                    } catch (roleError) {
                        this.logger.warn(`Failed to assume role ${arnRole}, proceeding with default credentials:`, roleError);
                        return {
                            results: [],
                            account: params.account,
                            region: params.region,
                            metricId: params.metricId,
                            error: roleError.message
                        };
                    }
                }
                  
                const cloudwatch = new CloudWatchClient(clientConfig);
                const command = new GetMetricDataCommand(queryClw);
                const data = await cloudwatch.send(command);
                
                // Fill in missing timestamps with 0 values
                const completeResults = data.MetricDataResults.map(result => {
                    // Create a normalized start and end time at the minute boundaries
                    const normalizedStartTime = new Date(startTime);
                    normalizedStartTime.setSeconds(0, 0);
                    
                    const normalizedEndTime = new Date(endTime);
                    normalizedEndTime.setSeconds(0, 0);
                    
                    // Create a map of existing timestamps to their values using minute-precise keys
                    const timestampValueMap = {};
                    if (result.Timestamps && result.Timestamps.length > 0) {
                        for (let i = 0; i < result.Timestamps.length; i++) {
                            const timestamp = new Date(result.Timestamps[i]);
                            // Create a key with format YYYY-MM-DDTHH:MM as a unique identifier
                            const mapKey = timestamp.toISOString().substring(0, 16);
                            timestampValueMap[mapKey] = result.Values[i];
                        }
                    }
                    
                    // Create arrays for the complete set of timestamps and values
                    const completeTimestamps = [];
                    const completeValues = [];
                    
                    // Start from the end time and work backwards to match the example output order
                    // Important: make a copy of normalizedEndTime to avoid modifying it
                    const currentTime = endTime;
                                
                    // Ensure we're including exactly the minutes that fall within our range
                    // We subtract 1 millisecond to avoid including an extra minute
                    while (currentTime >= normalizedStartTime) {
                        // Format the timestamp in ISO format
                        const isoTime = currentTime.toISOString();
                        completeTimestamps.push(isoTime);
                        
                        // Create the map key for this time
                        const mapKey = isoTime.substring(0, 16);
                        
                        // If we have a value for this timestamp, use it; otherwise use 0
                        completeValues.push(timestampValueMap[mapKey] !== undefined ? 
                            timestampValueMap[mapKey] : 0);
                        
                        // Move to the previous minute
                        currentTime.setMinutes(currentTime.getMinutes() - 1);
                    }
                    
                    // Debug info
                    /*
                    console.log("Original timestamps:", result.Timestamps);
                    console.log("Original values:", result.Values);
                    console.log("Timestamp map:", timestampValueMap);
                    console.log("Complete timestamps:", completeTimestamps);
                    console.log("Complete values:", completeValues);
                    */

                    // Return the complete result
                    return {
                        ...result,
                        Timestamps: completeTimestamps,
                        Values: completeValues
                    };
                });
                
                return {
                    results: completeResults,
                    account: params.account,
                    region: params.region,
                    metricId: params.metricId
                };
            } catch (err) {
                this.logger.error(`Error in getMetricData for account ${params.account}, region ${params.region}:`, err);
                return {
                    results: [],
                    account: params.account,
                    region: params.region,
                    metricId: params.metricId,
                    error: err.message
                };
            }
        }




        //--##  Execute tasks in parallel with concurrency control   
        async #executeWithConcurrency(tasks, concurrency) {
              const results = [];
              const running = new Set();
              
              // Create an async function to process tasks with concurrency control
              async function runTasks() {
                for (let i = 0; i < tasks.length; i++) {
                  const task = tasks[i];
                  
                  // Create a promise for this task
                  const promise = task();
                  
                  // Add to running set
                  running.add(promise);
                  
                  // Process the result
                  promise.then(result => {
                    results.push(result);
                    running.delete(promise);
                  }).catch(error => {
                    results.push({ error });
                    running.delete(promise);
                  });
                  
                  // If we've reached max concurrency, wait for one to finish
                  if (running.size >= concurrency) {
                    await Promise.race(running);
                  }
                }
                
                // Wait for all remaining tasks to finish
                await Promise.all(running);
          }
          
            await runTasks();
            return results;
        }



        //--## Process metrics for multiple accounts, regions and queries with parallelism
        async getCloudwatchMetricsInsight(params) {
              try {
                    // Initialize result structure
                    const result = {
                                    detail: [],
                                    summary: {
                                      regions: 0,
                                      accounts: 0,
                                      resources: 0
                                    },
                                    history: {}
                    };

                    // Initialize global metrics data for each query
                    for (const query of params.queries) {
                          result.history[query.id] = [];
                          result.summary[`${query.id}`] = 0;
                    }

                    // Build all query tasks
                    const queryTasks = [];
                    
                    for (const account of params.accounts) {
                          for (const region of params.regions) {
                                for (const query of params.queries) {
                                      // Create a task for each account/region/query combination
                                      queryTasks.push(() => this.getMetricData({
                                        account,
                                        region,
                                        IAMRoleName: params.IAMRoleName,
                                        period: params.period,
                                        interval: params.interval,
                                        startTime: params.startTime,
                                        endTime: params.endTime,
                                        sql: query.sql,
                                        metricId: query.id
                                      }));
                                }
                          }
                    }
                    
                    // Execute all query tasks with concurrency control
                    //const startTime = Date.now();
                    //this.logger.info(`Starting parallel execution of ${queryTasks.length} tasks with concurrency ${this.maxConcurrency}`);
                    
                    const queryResults = await this.#executeWithConcurrency(queryTasks, this.maxConcurrency);
                    
                    //const endTime = Date.now();
                    //this.logger.info(`Completed all queries in ${(endTime - startTime) / 1000} seconds`);

                    // Store cluster data with unique keys
                    const clusters = new Map(); // key: `${clusterId}:${account}:${region}`, value: cluster object
                    const allTimestamps = new Set(); // To track all unique timestamps
                    const globalMetrics = {}; // To store global metrics per query and timestamp

                    // Initialize globalMetrics object
                    for (const query of params.queries) {
                          globalMetrics[query.id] = {};
                    }

                    // Process all query results
                    for (const queryResult of queryResults) {
                          // Skip if no results or error
                          if (queryResult.error || !queryResult.results || queryResult.results.length === 0) {
                            continue;
                          }

                          const account = queryResult.account;
                          const region = queryResult.region;
                          const metricId = queryResult.metricId;

                          // Process each result - each result represents a cluster
                          for (const metricResult of queryResult.results) {
                                // Use the Label as cluster ID
                                const identifier = metricResult.Label;
                                
                                // Skip results with no values
                                if (!metricResult.Values || metricResult.Values.length === 0) {
                                  continue;
                                }

                                // Create unique cluster key
                                const clusterKey = `${identifier}:${account}:${region}`;
                                
                                // Get or create cluster object
                                if (!clusters.has(clusterKey)) {
                                      clusters.set(clusterKey, {
                                        identifier: identifier,
                                        account,
                                        region
                                      });
                                }
                                
                                const clusterObj = clusters.get(clusterKey);
                                
                                // Set the metric value (use most recent value - first in the array)
                                if ( metricResult.Values[0] !== 0)
                                  clusterObj[metricId] = metricResult.Values[0]  || 0;
                                else 
                                  clusterObj[metricId] = metricResult.Values[1]  || 0;
                                
                                // Process timestamps and values for global metrics
                                metricResult.Timestamps.forEach((timestamp, index) => {
                                      const value = metricResult.Values[index] || 0;
                                      const formattedTimestamp = this.#formatTimestamp(timestamp);
                                      
                                      // Add timestamp to set of all timestamps
                                      //allTimestamps.add(timestamp.toISOString());
                                      allTimestamps.add(timestamp);
                                      
                                      // Update global metrics
                                      if (!globalMetrics[metricId][formattedTimestamp]) {
                                        globalMetrics[metricId][formattedTimestamp] = 0;
                                      }
                                      globalMetrics[metricId][formattedTimestamp] += value;
                                });
                          }
                    }

                    // Convert clusters map to array for detail section
                    result.detail = Array.from(clusters.values());

                    // Calculate summary values
                    result.summary.regions = new Set(result.detail.map(item => item.region)).size;
                    result.summary.accounts = new Set(result.detail.map(item => item.account)).size;
                    result.summary.resources = result.detail.length;
                    
                    // Calculate sums for each metric
                    for (const query of params.queries) {
                          result.summary[`${query.id}`] = result.detail.reduce((sum, item) => {
                            return sum + (Number(item[query.id]) || 0);
                          }, 0);
                    }

                    // Sort all timestamps
                    const sortedTimestamps = Array.from(allTimestamps).sort();
                    
                    // Create global metrics time series with all timestamps
                    for (const query of params.queries) {
                          result.history[query.id] = sortedTimestamps.map(timestamp => {
                            const formattedTimestamp = this.#formatTimestamp(timestamp);
                            return [
                              formattedTimestamp,
                              globalMetrics[query.id][formattedTimestamp] || 0
                            ];
                          });
                    }

                    // Log performance statistics
                    //this.logger.info(`Processed metrics for ${result.summary.resources} clusters across ${result.summary.accounts} accounts and ${result.summary.regions} regions`);

                return result;
              } catch (error) {
                    this.logger.error("Error processing metrics:", error);
                    throw error;
              }
        }


          //--########################################
          //--############### - METADATA
          //--########################################


          //--## Get Global DSQL Clusters for many accounts and regions
          async getGlobalDSQLClustersMultiAccount(config) {
              try {
                if (!config.accounts || !config.regions || !Array.isArray(config.accounts) || !Array.isArray(config.regions)) {
                  throw new Error("Invalid configuration: accounts and regions must be provided as arrays");
                }
            
                // Create tasks for all account/region combinations
                const tasks = [];
                for (const account of config.accounts) {
                  for (const region of config.regions) {
                    tasks.push(this.#fetchDSQLClustersForAccountRegion({ account, region }));
                  }
                }
            
                // Execute all tasks in parallel and flatten the results
                const results = await Promise.all(tasks);
                const combinedResults = results.flat();
                
                return combinedResults;
              } catch (err) {
                this.#objLog.write("getGlobalDSQLClustersMultiAccount", "err", err);
                return [];
              }
            }


            
            //--## Get DSQL Clusters for specific account and region
            async #fetchDSQLClustersForAccountRegion(config) {
              try {
                const arnRole = "arn:aws:iam::" + config.account + ":role/" + this.IAMRoleName;
                
                // Set up CloudWatch client with assumed role if provided
                let clientConfig = { region: config.region };
                    
                try {
                  const credentials = await this.#getTemporaryCredentials(arnRole, config.region);
                  clientConfig.credentials = credentials;
                } catch (roleError) {
                  this.logger.warn(`Failed to assume role for account ${config.account}, region ${config.region}, proceeding with default credentials`, roleError);
                  return [];
                }
                
                const dataset = [];
                const dsqlClient = new DSQLClient(clientConfig);
                
                // List all clusters
                const command = new ListClustersCommand({});
                const clusterList = await dsqlClient.send(command);
                
                // Process each cluster
                const clusterPromises = clusterList['clusters'].map(async (item) => {
                  const command = new GetClusterCommand({ identifier: item.identifier });
                  const clusterInfo = await dsqlClient.send(command);
                  
                  var multiRegionProperties = {};
                  
                  if (clusterInfo.hasOwnProperty('multiRegionProperties')) {
                    var peerRegion = "";
                    var peerCluster = "";
                    
                    for (const clusterRegion of clusterInfo.multiRegionProperties['clusters']) {
                      var clusterFields = clusterRegion.split(":");
                      if (!clusterRegion.includes(item.identifier)) {
                        peerRegion = clusterFields[3];
                        peerCluster = clusterFields[5].split("/")[1];
                      }
                    }
                    
                    multiRegionProperties = {
                      witnessRegion: clusterInfo.multiRegionProperties['witnessRegion'],
                      peerRegion: peerRegion,
                      peerCluster: peerCluster
                    };
                  }
            
                  var clusterRegion = clusterInfo.arn.split(":")[3];
            
                  return {
                    account: config.account,
                    arn: clusterInfo.arn,
                    creationTime: clusterInfo.creationTime,
                    deletionProtectionEnabled: clusterInfo.deletionProtectionEnabled,
                    identifier: item.identifier,
                    status: String(clusterInfo.status).toLowerCase(),
                    name: clusterInfo['tags']?.['Name'],
                    clusterRegion: clusterRegion,
                    endPoint: item.identifier + ".dsql." + clusterRegion + ".on.aws",
                    ...multiRegionProperties
                  };
                });
                
                // Wait for all cluster details to be processed
                const processedClusters = await Promise.all(clusterPromises);
                return processedClusters;
              } catch (err) {
                this.logger.error(`Error fetching DSQL clusters for account ${config.account}, region ${config.region}:`, err);
                return []; // Return empty array for this account/region instead of failing everything
              }
            }


}



module.exports = { classAWS  };



                