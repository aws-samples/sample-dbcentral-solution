//-- React Events
import { useState,useEffect } from 'react';
import Axios from 'axios'
import { useSearchParams } from 'react-router-dom';

//-- AWS UI Objects
import AppLayout from "@cloudscape-design/components/app-layout";
import Spinner from "@cloudscape-design/components/spinner";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import Container from "@cloudscape-design/components/container";
import Header from "@cloudscape-design/components/header";
import Box from "@cloudscape-design/components/box";
import SpaceBetween from "@cloudscape-design/components/space-between";


//-- Custom Objects
import CustomHeader from "../components/Header";
import Metric01  from '../components/Metric01';
import ChartLine01  from '../components/ChartLine01';
import ChartBar01  from '../components/ChartBar01';
import ChartPie01  from '../components/ChartPie01';


//-- Custom Libraries
import { configuration } from './Configs';


var CryptoJS = require("crypto-js");

export default function App() {
    

    //--######## Global Settings
    
    //-- Gather Parameters
    const [params]=useSearchParams();
    const parameter_id=params.get("session_id");  
    var parameter_object_bytes = CryptoJS.AES.decrypt(parameter_id, sessionStorage.getItem("x-token-cognito"));
    var parameter_object_values = JSON.parse(parameter_object_bytes.toString(CryptoJS.enc.Utf8));
    
  

    
    //-- Add token header
    Axios.defaults.headers.common['x-token-cognito'] = sessionStorage.getItem("x-token-cognito");
    
    //-- Set Page Title
    document.title = configuration["apps-settings"]["application-title"] + ' - ' + parameter_object_values['identifier'];


      
    //--######## RealTime Metric
    
    //-- Variable for Split Panels
    const [splitPanelShow,setsplitPanelShow] = useState(false);
  
   
    
    //-- clusterStats
    const [clusterStats,setClusterStats] = useState({
                                                    lastTimestamp : "",
                                                    metrics : [
                                                        {
                                                            BytesRead : { lastValue : 0, lastTimestamp : "" , history : []},
                                                            BytesWritten : { lastValue : 0, lastTimestamp : "" , history : []},
                                                            ClusterStorageSize : { lastValue : 0, lastTimestamp : "" , history : []},
                                                            CommitLatency : { lastValue : 0, lastTimestamp : "" , history : []},
                                                            ComputeDPU : { lastValue : 0, lastTimestamp : "" , history : []},
                                                            ComputeTime : { lastValue : 0, lastTimestamp : "" , history : []},
                                                            MultiRegionWriteDPU : { lastValue : 0, lastTimestamp : "" , history : []},
                                                            OccConflicts : { lastValue : 0, lastTimestamp : "" , history : []},
                                                            ReadDPU : { lastValue : 0, lastTimestamp : "" , history : []},
                                                            ReadOnlyTransactions : { lastValue : 0, lastTimestamp : "" , history : []},
                                                            TotalDPU : { lastValue : 0, lastTimestamp : "" , history : []},
                                                            TotalTransactions : { lastValue : 0, lastTimestamp : "" , history : []},
                                                            WriteDPU : { lastValue : 0, lastTimestamp : "" , history : []}
                                                        }                                                                    
                                                    ]});    

   
    

    
    //-- Gather cluster list
   async function gatherClusterStats (){
          
            var params = { 
                clusters : [
                                {
                                    account : parameter_object_values['account'],
                                    region : parameter_object_values['clusterRegion'],   
                                    clusterId : parameter_object_values['identifier'],                                    
                                }
                            ],
                period : 45
            };

            Axios.get(`${configuration["apps-settings"]["api_url"]}/api/aurora/cluster/dsql/gather/stats/`,{
                params: params
                }).then((data)=>{             
                                
                    setClusterStats(data.data);
                    
                })
                .catch((err) => {
                    console.log('Timeout API Call : /api/aurora/cluster/dsql/gather/stats/' );
                    console.log(err);                
                });          

    }


     //--######## Function Close Database Connection
    const closeDatabaseConnection = () => {
       
        closeTabWindow();
      
    }


    
   //--######## Function Handle Logout
   const handleClickMenu = ({detail}) => {

            switch (detail.id) {
              case 'signout':
                  closeDatabaseConnection();
                break;
                
              case 'other':
                break;
            
              default:
                break
                
              
            }

    };
   
   
   
    
   //--######## Function Handle Logout
   const handleClickDisconnect = () => {
          closeDatabaseConnection();
    };
    
    
   
   
       
    //--######## Function Close TabWindow
    const closeTabWindow = () => {
              window.opener = null;
              window.open("", "_self");
              window.close();
      
    }
    
    
    
    
    useEffect(() => {
        gatherClusterStats();        
        const id = setInterval(gatherClusterStats, configuration["apps-settings"]["refresh-interval"]);
        return () => clearInterval(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    
  
  return (
    <>
      
      
      <CustomHeader
        onClickMenu={handleClickMenu}
        onClickDisconnect={handleClickDisconnect}
        sessionInformation={parameter_object_values}
      />

    <AppLayout
       contentType="table"
        disableContentPaddings={true}
        toolsHide={true}
        navigationHide={true}
        splitPanelOpen={splitPanelShow}
        onSplitPanelToggle={() => setsplitPanelShow(false)}
        splitPanelSize={250}
        content={
            <>
                  <table style={{"width":"100%"}}>
                      <tr>  
                          <td style={{"width":"50%","paddingLeft": "1em", "border-left": "10px solid " + configuration.colors.lines.separator100,}}>  
                              <SpaceBetween direction="horizontal" size="xs">
                                  { parameter_object_values['status'] !== 'active' &&
                                    <Spinner size="big" />
                                  }
                                  <Box variant="h3" color="text-status-inactive" >{parameter_object_values['name']} ({parameter_object_values['identifier']})</Box>
                              </SpaceBetween>
                          </td>
                          <td style={{"width":"10%","paddingLeft": "1em", "border-left": "4px solid " + configuration.colors.lines.separator100,}}>  
                              <StatusIndicator type={parameter_object_values['status'] === 'active' ? 'success' : 'pending'}> {parameter_object_values['status']} </StatusIndicator>
                              <Box variant="awsui-key-label">Status</Box>
                          </td>
                          <td style={{"width":"10%","paddingLeft": "1em", "border-left": "4px solid " + configuration.colors.lines.separator100,}}>  
                              <div>{parameter_object_values['account'] || "-"}</div>
                              <Box variant="awsui-key-label">Account</Box>
                          </td>                         
                          <td style={{"width":"10%","paddingLeft": "1em", "border-left": "4px solid " + configuration.colors.lines.separator100,}}>  
                              <div>{parameter_object_values['clusterRegion']}</div>
                              <Box variant="awsui-key-label">Region</Box>
                          </td>                         
                          <td style={{"width":"10%","paddingLeft": "1em", "border-left": "4px solid " + configuration.colors.lines.separator100,}}>  
                              <div>{clusterStats['lastTimestamp']}</div>
                              <Box variant="awsui-key-label">LastUpdate</Box>
                          </td>
                      </tr>
                  </table>
                  <br/>
                  <table style={{"width":"100%"}}>
                      <tr>  
                          
                          <td valign="top" style={{"width":"45%","paddingLeft": "1em", "paddingRight": "1em" }}>  
                                <Container
                                    header={
                                        <Header
                                        variant="h1"                                                                                      
                                        >
                                        {parameter_object_values['clusterRegion']} | ({parameter_object_values['identifier']})
                                        </Header>
                                    }
                                >
                                    <Container
                                        header={
                                            <Header
                                            variant="h2"                                                                                      
                                            >
                                            Distributed Processing Units
                                            </Header>
                                        }
                                    >
                                            <table style={{"width":"100%"}}>
                                                <tr>                 
                                                    <td valign="top" style={{"width":"40%", "textAlign" : "center" }}>  
                                                        <ChartPie01 
                                                                title={"DPUs"} 
                                                                height="300px" 
                                                                width="100%" 
                                                                series = {[
                                                                            clusterStats['metrics'][0]['ComputeDPU']['lastValue'],
                                                                            clusterStats['metrics'][0]['ReadDPU']['lastValue'],
                                                                            clusterStats['metrics'][0]['WriteDPU']['lastValue']
                                                                ]}
                                                                labels = {["ComputeDPU","ReadDPU", "WriteDPU"]}
                                                                onClickEvent={() => {}}
                                                        />     
                                                        <br/> 
                                                        <Metric01 
                                                            value={clusterStats['metrics'][0]['TotalDPU']['lastValue']  || 0 }
                                                            title={"TotalDPU"}
                                                            precision={1}
                                                            format={4}
                                                            fontColorValue={configuration.colors.fonts.metric100}
                                                            fontSizeValue={"30px"}
                                                        />
                                                    </td>  
                                                    <td valign="top" style={{"width":"80%"}}>  
                                                        <ChartLine01 series={JSON.stringify([
                                                                                { name : "ComputeDPU", data : clusterStats['metrics'][0]['ComputeDPU']['history'] },
                                                                                { name : "ReadDPU", data : clusterStats['metrics'][0]['ReadDPU']['history'] },
                                                                                { name : "WriteDPU", data : clusterStats['metrics'][0]['WriteDPU']['history'] },
                                                                            ])}
                                                                        title={"DPUs"} height="250px" 
                                                                        stacked={true}
                                                        />
                                                        <br/>
                                                        <table style={{"width":"100%"}}>
                                                            <tr>  
                                                                <td valign="center" style={{"width":"10%", "textAlign" : "left",  }}>  
                                                                    
                                                                </td>                                                                        
                                                                <td valign="center" style={{"width":"30%", "textAlign" : "right", "borderRight": "2px solid " + configuration.colors.lines.separator100, "paddingRight": "1em"  }}>  
                                                                    <Metric01 
                                                                        value={clusterStats['metrics'][0]['ComputeDPU']['lastValue']  || 0 }
                                                                        title={"ComputeDPU"}
                                                                        precision={1}
                                                                        format={4}
                                                                        fontColorValue={configuration.colors.fonts.metric100}
                                                                        fontSizeValue={"20px"}
                                                                    />                                                
                                                                </td>                                            
                                                                <td valign="center" style={{"width":"30%", "textAlign" : "right", "borderRight": "2px solid " + configuration.colors.lines.separator100, "paddingRight": "1em"  }}>  
                                                                    <Metric01 
                                                                        value={clusterStats['metrics'][0]['ReadDPU']['lastValue']  || 0 }
                                                                        title={"ReadDPU"}
                                                                        precision={1}
                                                                        format={4}
                                                                        fontColorValue={configuration.colors.fonts.metric100}
                                                                        fontSizeValue={"20px"}
                                                                    />                                                
                                                                </td>  
                                                                <td valign="center" style={{"width":"30%", "textAlign" : "right", "borderRight": "2px solid " + configuration.colors.lines.separator100, "paddingRight": "1em"  }}>  
                                                                    <Metric01 
                                                                        value={clusterStats['metrics'][0]['WriteDPU']['lastValue']  || 0 }
                                                                        title={"WriteDPU"}
                                                                        precision={1}
                                                                        format={4}
                                                                        fontColorValue={configuration.colors.fonts.metric100}
                                                                        fontSizeValue={"20px"}
                                                                    />                                                
                                                                </td>  
                                                                
                                                            </tr>
                                                        </table>
                                                    </td>                                                               
                                                    
                                                </tr>
                                            </table>
                                            
                                    </Container>
                                    <br/>
                                    <Container
                                        header={
                                            <Header
                                            variant="h2"                                                                                      
                                            >
                                            Transactions
                                            </Header>
                                        }
                                    >
                                            <table style={{"width":"100%"}}>
                                                <tr>       
                                                    <td valign="top" style={{"width":"80%"}}>  
                                                            <ChartBar01 series={JSON.stringify([
                                                                                    { name : "Transactions", data : clusterStats['metrics'][0]['TotalTransactions']['history'] }
                                                                                ])}
                                                                            title={"TotalTransactions/Minute"} height="220px" 
                                                            />
                                                    </td>                     
                                                    <td valign="center" style={{"width":"20%", "textAlign" : "center" }}>  
                                                        <Metric01 
                                                            value={clusterStats['metrics'][0]['TotalTransactions']['lastValue']  || 0 }
                                                            title={"TotalTransactions/Minute"}
                                                            precision={1}
                                                            format={3}
                                                            fontColorValue={configuration.colors.fonts.metric100}
                                                            fontSizeValue={"34px"}
                                                        />                                                
                                                    </td>
                                                    
                                                </tr>
                                            </table>
                                            <table style={{"width":"100%"}}>
                                                <tr>                                                                        
                                                    <td valign="center" style={{"width":"25%", "textAlign" : "left", "border-left": "2px solid " + configuration.colors.lines.separator100, "paddingLeft": "1em"  }}>  
                                                        <Metric01 
                                                            value={clusterStats['metrics'][0]['ReadOnlyTransactions']['lastValue']  || 0 }
                                                            title={"ReadOnlyTransactions/Minute"}
                                                            precision={1}
                                                            format={3}
                                                            fontColorValue={configuration.colors.fonts.metric100}
                                                            fontSizeValue={"20px"}
                                                        />                                                
                                                    </td>                                            
                                                    <td valign="center" style={{"width":"25%", "textAlign" : "left", "border-left": "2px solid " + configuration.colors.lines.separator100, "paddingLeft": "1em"  }}>  
                                                        <Metric01 
                                                            value={clusterStats['metrics'][0]['ReadOnlyTransactions']['lastValue'] / 60  || 0 }
                                                            title={"ReadOnlyTransactions/Second"}
                                                            precision={1}
                                                            format={3}
                                                            fontColorValue={configuration.colors.fonts.metric100}
                                                            fontSizeValue={"20px"}
                                                        />                                                
                                                    </td>  
                                                    <td valign="center" style={{"width":"25%", "textAlign" : "left", "border-left": "2px solid " + configuration.colors.lines.separator100, "paddingLeft": "1em"  }}>  
                                                        <Metric01 
                                                            value={clusterStats['metrics'][0]['TotalTransactions']['lastValue']/60  || 0 }
                                                            title={"TotalTransactions/Second"}
                                                            precision={1}
                                                            format={3}
                                                            fontColorValue={configuration.colors.fonts.metric100}
                                                            fontSizeValue={"20px"}
                                                        />                                                
                                                    </td>  
                                                    <td valign="center" style={{"width":"25%", "textAlign" : "left", "border-left": "2px solid " + configuration.colors.lines.separator100, "paddingLeft": "1em"  }}>  
                                                            <Metric01 
                                                                value={clusterStats['metrics'][0]['OccConflicts']['lastValue']  || 0 }
                                                                title={"OccConflicts/Minute"}
                                                                precision={1}
                                                                format={3}
                                                                fontColorValue={configuration.colors.fonts.metric100}
                                                                fontSizeValue={"20px"}
                                                            />   
                                                                       

                                                    </td>  
                                                </tr>
                                            </table>
                                    </Container>
                                    <br/>                                   
                                    <Container
                                        header={
                                            <Header
                                            variant="h2"                                                                                      
                                            >
                                            Latency
                                            </Header>
                                        }
                                    >
                                            <table style={{"width":"100%"}}>
                                                <tr>   
                                                    <td valign="top" style={{"width":"80%"}}>  
                                                            <ChartBar01 series={JSON.stringify([
                                                                                    { name : "CommitLatency", data : clusterStats['metrics'][0]['CommitLatency']['history'] }
                                                                                ])}
                                                                            title={"CommitLatency(ms)"} height="220px" 
                                                            />
                                                    </td>                         
                                                    <td valign="center" style={{"width":"20%", "textAlign" : "center" }}>  
                                                        <Metric01 
                                                            value={ clusterStats['metrics'][0]['CommitLatency']['lastValue']  || 0  }
                                                            title={"CommitLatency(ms)"}
                                                            precision={0}
                                                            format={3}
                                                            fontColorValue={configuration.colors.fonts.metric100}
                                                            fontSizeValue={"34px"}
                                                        />                                                
                                                    </td>
                                                    
                                                </tr>
                                            </table>   
                                    </Container>                                 
                                    <br/>   
                                    <Container
                                        header={
                                            <Header
                                            variant="h2"                                                                                      
                                            >
                                            Storage
                                            </Header>
                                        }
                                    >                                 
                                            <table style={{"width":"100%"}}>
                                                <tr>                            
                                                    <td valign="top" style={{"width":"80%"}}>  
                                                        <ChartLine01 series={JSON.stringify([
                                                                                { name : "BytesRead", data : clusterStats['metrics'][0]['BytesRead']['history'] },
                                                                                { name : "BytesWritten", data : clusterStats['metrics'][0]['BytesWritten']['history'] }
                                                                            ])}
                                                                        title={"StorageTransfer(Bytes/sec)"} height="220px" 
                                                                        stacked={true}
                                                        />
                                                    </td>
                                                    <td valign="center" style={{"width":"20%", "textAlign" : "center" }}>  
                                                        <Metric01 
                                                            value={ (clusterStats['metrics'][0]['BytesRead']['lastValue']  || 0 ) + (clusterStats['metrics'][0]['BytesWritten']['lastValue']  || 0 ) }
                                                            title={"Bytes/sec"}
                                                            precision={1}
                                                            format={2}
                                                            fontColorValue={configuration.colors.fonts.metric100}
                                                            fontSizeValue={"34px"}
                                                        />                                                
                                                    </td>                                                    
                                                </tr>
                                            </table>
                                            <table style={{"width":"100%"}}>
                                                <tr>   
                                                    <td valign="center" style={{"width":"25%", "textAlign" : "left", "border-left": "2px solid " + configuration.colors.lines.separator100, "paddingLeft": "1em"  }}>  
                                                        <Metric01 
                                                            value={clusterStats['metrics'][0]['ClusterStorageSize']['lastValue']  || 0 }
                                                            title={"ClusterStorageSize"}
                                                            precision={1}
                                                            format={2}
                                                            fontColorValue={configuration.colors.fonts.metric100}
                                                            fontSizeValue={"20px"}
                                                        />                                                
                                                    </td>                           
                                                    <td valign="center" style={{"width":"25%", "textAlign" : "left", "border-left": "2px solid " + configuration.colors.lines.separator100, "paddingLeft": "1em"  }}>  
                                                        <Metric01 
                                                            value={clusterStats['metrics'][0]['BytesRead']['lastValue']  || 0 }
                                                            title={"BytesRead"}
                                                            precision={1}
                                                            format={2}
                                                            fontColorValue={configuration.colors.fonts.metric100}
                                                            fontSizeValue={"20px"}
                                                        />                                                
                                                    </td>                                            
                                                    <td valign="center" style={{"width":"25%", "textAlign" : "left", "border-left": "2px solid " + configuration.colors.lines.separator100, "paddingLeft": "1em"  }}>  
                                                        <Metric01 
                                                            value={clusterStats['metrics'][0]['BytesWritten']['lastValue']  || 0 }
                                                            title={"BytesWritten"}
                                                            precision={1}
                                                            format={2}
                                                            fontColorValue={configuration.colors.fonts.metric100}
                                                            fontSizeValue={"20px"}
                                                        />                                                
                                                    </td>                                              
                                                    <td valign="center" style={{"width":"25%", "textAlign" : "left",   }}>  
                                                                                                   
                                                    </td>  
                                                    
                                                </tr>
                                            </table>  
                                    </Container>                                   

                                </Container>

                          </td>               
                      </tr>
                  </table>
            
            </>
            
        }
      />
      
      
      
    </>
    
  );
}
