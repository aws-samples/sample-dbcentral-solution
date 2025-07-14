
const { classLogging } = require('./class.logging.js');
const { classAWS } = require('./class.aws.js');
const AWSObject = new classAWS();


const { classManagement } = require('./class.mng.js');
const ManagementObject = new classManagement();




class classDSQLCluster {

        //-- Looging
        #objLog = new classLogging({ name : "classDSQLCluster", instance : "generic" });
        
        //-- Constamts
        #metricNamespace = "AWS/AuroraDSQL";
        #metricList =  [                
                        {stat: "Sum",divideby: "60",name: "BytesRead"},
                        {stat: "Sum",divideby: "60",name: "BytesWritten"},
                        {stat: "Sum",divideby: "1",name: "ClusterStorageSize"},
                        {stat: "Average",divideby: "1",name: "CommitLatency"},
                        {stat: "Sum",divideby: "1",name: "ComputeDPU"},
                        {stat: "Sum",divideby: "1",name: "ComputeTime"},
                        {stat: "Sum",divideby: "1",name: "MultiRegionWriteDPU"},
                        {stat: "Sum",divideby: "1",name: "OccConflicts"},
                        {stat: "Sum",divideby: "1",name: "ReadDPU"},
                        {stat: "Sum",divideby: "1",name: "ReadOnlyTransactions"},
                        {stat: "Sum",divideby: "1",name: "TotalDPU"},
                        {stat: "Sum",divideby: "1",name: "TotalTransactions"},
                        {stat: "Sum",divideby: "1",name: "WriteDPU"},          
        ];
               
           
        //-- Constructor method
        constructor(object) { 
        
            this.jitterCollection = 2;        
        
        }



        //--###-- Gather lits of clusters
        async getDSQLClusters(parameters){
                
            try {      
                
                const result = await AWSObject.getDSQLClusters(parameters);
                return result;
                
            }
            catch(err){
                this.#objLog.write("getDSQLClusters","err",err);
                return [];
            }

        } 



        //--###-- Gather lits of clusters
        async getGlobalDSQLClusters(parameters){
                
            try {      
                
                const endTime = new Date();
                endTime.setMinutes(endTime.getMinutes() - this.jitterCollection ); // Adjust 2 minututes for CloudWatch delayed refresh
                const startTime = new Date(endTime - ( 30 * 60000)); // config.period in minutes


                var config = { "accounts" : ["000000000000"], "regions" : ["us-east-x"]};
                var profiles = { "accounts" : ["000000000000"], "regions" : ["us-east-x"]};
                //-- Gather metadata
                try {      
                    
                    profiles = await ManagementObject.getProfile({ userId : parameters.userId });

                    config = { 
                                    accounts : profiles['accounts'],
                                    regions : profiles['regions'],
                    };
                }
                catch(err){
                    this.#objLog.write("getGlobalDSQLClusters","err",err);                 
                }        
                     
                var resources = await AWSObject.getGlobalDSQLClustersMultiAccount(config);
                                
                //-- Gather metrics
                config = { 
                    accounts : profiles['accounts'],
                    regions : profiles['regions'],
                    IAMRoleName: "IAMRoleDBCentralSolution",
                    period: 60, 
                    interval: 30,
                    startTime : startTime,
                    endTime : endTime,
                    queries: [
                      {
                        id: "TotalTransactions",
                        sql: `SELECT SUM(TotalTransactions) FROM SCHEMA(\"AWS/AuroraDSQL\",ClusterId) GROUP BY ClusterId`
                      },
                      {
                        id: "TotalDPU",
                        sql: `SELECT SUM(TotalDPU) FROM SCHEMA(\"AWS/AuroraDSQL\",ClusterId) GROUP BY ClusterId`
                      },                      
                      {
                        id: "CommitLatency",
                        sql: `SELECT AVG(CommitLatency) FROM SCHEMA(\"AWS/AuroraDSQL\",ClusterId) GROUP BY ClusterId`
                      },
                      {
                        id: "ClusterStorageSize",
                        sql: `SELECT AVG(ClusterStorageSize) FROM SCHEMA(\"AWS/AuroraDSQL\",ClusterId) GROUP BY ClusterId`
                      }
                
                    ]
                };

                
                const metrics = await AWSObject.getCloudwatchMetricsInsight(config);              
                
                const extendedValues = {};
                metrics.detail.forEach(item => {
                    extendedValues[item.identifier] = { 
                                                        transactions :  item['TotalTransactions'] || 0,
                                                        totalDPU :  item['TotalDPU'] || 0,
                                                        commitLatency :  item['CommitLatency'] || 0,
                                                        totalStorage :  item['ClusterStorageSize'] || 0,

                    } ;
                });

                
                resources = resources.map(item => {
                return {
                    ...item,
                    ...extendedValues[item.identifier]
                };
                });

                const sortArrayByIdAsc = array => [...array].sort((a, b) => a.identifier.localeCompare(b.identifier));

                resources = sortArrayByIdAsc(resources);

                return { resources : resources , summary : metrics['summary'], history : metrics['history'], lastTimestamp : (endTime.toLocaleTimeString('en-US', {hour12: false,hour: '2-digit',minute: '2-digit', second: '2-digit' })) };
                
            }
            catch(err){
                this.#objLog.write("getGlobalDSQLClusters","err",err);
                return { resources : [], summary : {}, global : {} };
            }

        } 




        //--###-- Gather stats
        async getDSQLMetrics(parameters){            
            
            try {      
                

                var metrics = [];
                const endTime = new Date();
                endTime.setMinutes(endTime.getMinutes() - this.jitterCollection ); // Adjust 2 minututes for CloudWatch delayed refresh
                const startTime = new Date(endTime - (parseInt(parameters.period) * 60000)); // config.period in minutes

                for (const cluster of parameters['clusters']) {                              
                                        
                        const config = {
                            account: cluster.account,
                            region: cluster.region,                    
                            dimension: [{ Name: "ClusterId", Value: cluster.clusterId }],
                            namespace: this.#metricNamespace,
                            period: cluster.period, 
                            interval: "1", 
                            metrics: this.#metricList,
                            startTime : startTime,
                            endTime : endTime
                        };

                        const dataset = await AWSObject.getCloudWatchGenericMetricsDataset(config);                
                        metrics.push(dataset);

                }
                return { metrics : metrics, lastTimestamp : (endTime.toLocaleTimeString('en-US', {hour12: false,hour: '2-digit',minute: '2-digit', second: '2-digit' }))} ;
                
            }
            catch(err){
                this.#objLog.write("getDSQLClusters","err",err);
                return { metrics : [], lastTimestamp : "-" } ;
            }

        } 
  
    
}


module.exports = { classDSQLCluster  };



