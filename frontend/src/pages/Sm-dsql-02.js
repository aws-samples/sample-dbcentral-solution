//-- React Events
import { useState,useEffect, useRef } from 'react';
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
import Icon from "@cloudscape-design/components/icon";
import { SplitPanel } from '@cloudscape-design/components';


//-- Custom Objects
import CustomHeader from "../components/Header";
import Animation01 from '../components/Animation01';
import Metric01  from '../components/Metric01';
import ChartLine01  from '../components/ChartLine01';
import ChartBar01  from '../components/ChartBar01';


//-- Custom Libraries
import { configuration } from './Configs';


var CryptoJS = require("crypto-js");

export const splitPanelI18nStrings: SplitPanelProps.I18nStrings = {
    preferencesTitle: 'Split panel preferences',
    preferencesPositionLabel: 'Split panel position',
    preferencesPositionDescription: 'Choose the default split panel position for the service.',
    preferencesPositionSide: 'Side',
    preferencesPositionBottom: 'Bottom',
    preferencesConfirm: 'Confirm',
    preferencesCancel: 'Cancel',
    closeButtonAriaLabel: 'Close panel',
    openButtonAriaLabel: 'Open panel',
    resizeHandleAriaLabel: 'Resize split panel',
  };

  

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
    const [splitPanelSize, setSplitPanelSize] = useState(350);
  
    //--## Metric comparation
    var currentMetricId = useRef("TotalDPU");

    const [metricDetailRefresh,setMetricDetailRefresh] = useState("");


    
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
                                                        },
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
                                },
                                {
                                    account : parameter_object_values['account'],
                                    region : parameter_object_values['peerRegion'],   
                                    clusterId : parameter_object_values['peerCluster'],                                    
                                },
                            ],
                period : 30
            };

            Axios.get(`${configuration["apps-settings"]["api_url"]}/api/aurora/cluster/dsql/gather/stats/`,{
                params: params
                }).then((data)=>{             
                                
                    setClusterStats(data.data);
                    console.log(data.data);
                    
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
    

    //--######## Show metric details
    function onClickMetric(metricId) {
        currentMetricId.current = metricId;
        setMetricDetailRefresh(new Date().getSeconds());
        setsplitPanelShow(true);       
                   
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
        onSplitPanelResize={
                    ({ detail: { size } }) => {
                    setSplitPanelSize(size);
                }
        }
        splitPanelSize={splitPanelSize}
        splitPanel={
            <SplitPanel  
                header={
                
                    <Header
                            variant="h3"
                            
                            
                          >
                           {"Metric : " + currentMetricId.current }
                          </Header>
                  
                } 
                i18nStrings={splitPanelI18nStrings} closeBehavior="hide"
                onSplitPanelToggle={({ detail }) => {
                               //console.log(detail);
                              }
                            }
            >
                
                { splitPanelShow === true &&
                    
                    <table style={{"width":"100%", "padding": "1em"}}>
                        <tr>
                            <td valign="top" style={{"width":"15%", "textAlign": "center"}}>  
                                    <div>
                                        <Box color="text-status-inactive" variant="h3">{parameter_object_values['clusterRegion']}</Box>
                                    </div>
                                    <Box variant="awsui-key-label">Region</Box>
                                    <br/>
                                    <br/>
                                    <Metric01 
                                        value={clusterStats['metrics'][0][currentMetricId.current]['lastValue']  || 0 }
                                        title={currentMetricId.current}
                                        precision={1}
                                        format={4}
                                        fontColorValue={configuration.colors.fonts.metric100}
                                        fontSizeValue={"30px"}
                                    />     
                            </td>

                            <td valign="top" style={{"width":"70%", "padding-left": "1em"}}>  
                                    <ChartLine01 series={JSON.stringify([
                                                            { name : parameter_object_values['clusterRegion'], data : clusterStats['metrics'][0][currentMetricId.current]['history'] || [] },
                                                            { name : parameter_object_values['peerRegion'], data : clusterStats['metrics'][0][currentMetricId.current]['history'] || [] },
                                                        ])}
                                                    title={""} height="220px"
                                                    stacked={true}
                                    />
                            </td>
                            <td valign="top" style={{"width":"15%", "textAlign": "center"}}>  
                                
                                    <div>
                                        <Box color="text-status-inactive" variant="h3">{parameter_object_values['peerRegion']}</Box>
                                    </div>
                                    <Box variant="awsui-key-label">Region</Box>
                                    <br/>
                                    <br/>
                                    <Metric01 
                                        value={clusterStats['metrics'][1][currentMetricId.current]['lastValue']  || 0 }
                                        title={currentMetricId.current}
                                        precision={1}
                                        format={4}
                                        fontColorValue={configuration.colors.fonts.metric100}
                                        fontSizeValue={"30px"}
                                    />     
                            </td>
                            
                        </tr>
                    </table>
                     
                    }

                
                                            
                  
            </SplitPanel>
        }
        content={
            <>
                  <table style={{"width":"100%"}}>
                      <tr>  
                          <td style={{"width":"40%","padding-left": "1em", "border-left": "10px solid " + configuration.colors.lines.separator100,}}>  
                              <SpaceBetween direction="horizontal" size="xs">
                                  { parameter_object_values['status'] !== 'active' &&
                                    <Spinner size="big" />
                                  }
                                  <Box variant="h3" color="text-status-inactive" >{parameter_object_values['name']} ({parameter_object_values['identifier']})</Box>
                              </SpaceBetween>
                          </td>
                          <td style={{"width":"10%","padding-left": "1em", "border-left": "4px solid " + configuration.colors.lines.separator100,}}>  
                              <StatusIndicator type={parameter_object_values['status'] === 'active' ? 'success' : 'pending'}> {parameter_object_values['status']} </StatusIndicator>
                              <Box variant="awsui-key-label">Status</Box>
                          </td>
                          <td style={{"width":"10%","padding-left": "1em", "border-left": "4px solid " + configuration.colors.lines.separator100,}}>  
                              <div>{parameter_object_values['account'] || "-"}</div>
                              <Box variant="awsui-key-label">Account</Box>
                          </td>                         
                          <td style={{"width":"10%","padding-left": "1em", "border-left": "4px solid " + configuration.colors.lines.separator100,}}>  
                              <div>{parameter_object_values['clusterRegion']}</div>
                              <Box variant="awsui-key-label">Region</Box>
                          </td>                          
                          <td style={{"width":"10%","padding-left": "1em", "border-left": "4px solid " + configuration.colors.lines.separator100,}}>  
                              <div>{parameter_object_values['peerRegion'] || "-"}</div>
                              <Box variant="awsui-key-label">Peer Region</Box>
                          </td>
                          <td style={{"width":"10%","padding-left": "1em", "border-left": "4px solid " + configuration.colors.lines.separator100,}}>  
                              <div>{parameter_object_values['witnessRegion'] || "-"}</div>
                              <Box variant="awsui-key-label">Peer Witness</Box>
                          </td>
                       
                          <td style={{"width":"10%","padding-left": "1em", "border-left": "4px solid " + configuration.colors.lines.separator100,}}>  
                              <div>{clusterStats['lastTimestamp']}</div>
                              <Box variant="awsui-key-label">LastUpdate</Box>
                          </td>
                      </tr>
                  </table>
                  <br/>
                  <table style={{"width":"100%", "padding-left": "1em", "padding-right": "1em"}}>
                      <tr>  
                          <td valign="top" style={{"width":"45%","padding": "1em", "border-radius" : "20px", "border": "15px solid " + configuration.colors.lines.separator102 }}>  
                                <table style={{"width":"100%"}}>
                                            <tr>                                                  
                                                <td style={{"width":"10%","padding-left": "1em", "border-left": "4px solid " + configuration.colors.lines.separator100,}}>  
                                                    <div>
                                                        <Box color="text-status-inactive" variant="h2">{parameter_object_values['clusterRegion']}</Box>
                                                    </div>
                                                    <Box variant="awsui-key-label">Region</Box>
                                                </td>                         
                                                <td style={{"width":"10%","padding-left": "1em", "border-left": "4px solid " + configuration.colors.lines.separator100,}}>  
                                                    <div>
                                                        <Box color="text-status-inactive" variant="h2">{parameter_object_values['identifier']}</Box>
                                                    </div>                                                   
                                                    <Box variant="awsui-key-label">ClusterId</Box>
                                                </td>                                                                         
                                            </tr>
                                </table>
                                    <br/>
                                    <Container
                                        header={
                                            <Header
                                            variant="h2"                                                                                      
                                            >
                                            Distributed Processing Units
                                            </Header>
                                        }
                                        footer={
                                            <table style={{"width":"100%"}}>
                                            <tr>                                                                        
                                                <td valign="center" style={{"width":"25%", "text-align" : "left", "border-left": "2px solid " + configuration.colors.lines.separator100, "padding-left": "1em"  }}>  
                                                    <a href='#;' style={{ "text-decoration" : "none", "color": "inherit" }}  onClick={() => onClickMetric('ComputeDPU')}>                                                                                
                                                        <Metric01 
                                                            value={clusterStats['metrics'][0]['ComputeDPU']['lastValue']  || 0 }
                                                            title={"ComputeDPU"}
                                                            precision={1}
                                                            format={3}
                                                            fontColorValue={configuration.colors.fonts.metric100}
                                                            fontSizeValue={"20px"}
                                                        />                                                
                                                    </a>
                                                </td>                                            
                                                <td valign="center" style={{"width":"25%", "text-align" : "left", "border-left": "2px solid " + configuration.colors.lines.separator100, "padding-left": "1em"  }}>  
                                                    <a href='#;' style={{ "text-decoration" : "none", "color": "inherit" }}  onClick={() => onClickMetric('ReadDPU')}>                                                                                
                                                        <Metric01 
                                                            value={clusterStats['metrics'][0]['ReadDPU']['lastValue']  || 0 }
                                                            title={"ReadDPU"}
                                                            precision={1}
                                                            format={3}
                                                            fontColorValue={configuration.colors.fonts.metric100}
                                                            fontSizeValue={"20px"}
                                                        />    
                                                    </a>                                            
                                                    
                                                </td>  
                                                <td valign="center" style={{"width":"25%", "text-align" : "left", "border-left": "2px solid " + configuration.colors.lines.separator100, "padding-left": "1em"  }}>  
                                                    <a href='#;' style={{ "text-decoration" : "none", "color": "inherit" }}  onClick={() => onClickMetric('WriteDPU')}>                                                                                
                                                        <Metric01 
                                                            value={clusterStats['metrics'][0]['WriteDPU']['lastValue']  || 0 }
                                                            title={"WriteDPU"}
                                                            precision={1}
                                                            format={3}
                                                            fontColorValue={configuration.colors.fonts.metric100}
                                                            fontSizeValue={"20px"}
                                                        />    
                                                    </a>                                            
                                                </td>  
                                                <td valign="center" style={{"width":"25%", "text-align" : "left", "border-left": "2px solid " + configuration.colors.lines.separator100, "padding-left": "1em"  }}>  
                                                    <a href='#;' style={{ "text-decoration" : "none", "color": "inherit" }}  onClick={() => onClickMetric('MultiRegionWriteDPU')}>                                                                                
                                                        <Metric01 
                                                            value={clusterStats['metrics'][0]['MultiRegionWriteDPU']['lastValue']  || 0 }
                                                            title={"MultiRegionWriteDPU"}
                                                            precision={1}
                                                            format={3}
                                                            fontColorValue={configuration.colors.fonts.metric100}
                                                            fontSizeValue={"20px"}
                                                        />  
                                                    </a>                                              
                                                </td>  
                                            </tr>
                                        </table>
                                          }
                                    >
                                            <table style={{"width":"100%"}}>
                                                <tr>                 
                                                    <td valign="top" style={{"width":"80%"}}>  
                                                        <ChartLine01 series={JSON.stringify([
                                                                                { name : "ComputeDPU", data : clusterStats['metrics'][0]['ComputeDPU']['history'] },
                                                                                { name : "ReadDPU", data : clusterStats['metrics'][0]['ReadDPU']['history'] },
                                                                                { name : "WriteDPU", data : clusterStats['metrics'][0]['WriteDPU']['history'] },
                                                                                { name : "MultiRegionWriteDPU", data : clusterStats['metrics'][0]['MultiRegionWriteDPU']['history'] },
                                                                            ])}
                                                                        title={"DPUs"} height="220px"
                                                                        stacked={true}
                                                        />
                                                    </td>           
                                                    <td valign="center" style={{"width":"20%", "text-align" : "center" }}>  
                                                        <a href='#;' style={{ "text-decoration" : "none", "color": "inherit" }}  onClick={() => onClickMetric('TotalDPU')}>                                                                                
                                                            <Metric01 
                                                                value={clusterStats['metrics'][0]['TotalDPU']['lastValue']  || 0 }
                                                                title={"TotalDPU"}
                                                                precision={1}
                                                                format={3}
                                                                fontColorValue={configuration.colors.fonts.metric100}
                                                                fontSizeValue={"30px"}
                                                            />                                                              
                                                                                          
                                                        </a>                                      
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
                                        footer={
                                            <table style={{"width":"100%"}}>
                                                <tr>                                                                        
                                                    <td valign="center" style={{"width":"25%", "text-align" : "left", "border-left": "2px solid " + configuration.colors.lines.separator100, "padding-left": "1em"  }}>  
                                                        <a href='#;' style={{ "text-decoration" : "none", "color": "inherit" }}  onClick={() => onClickMetric('ReadOnlyTransactions')}>
                                                            <Metric01 
                                                                value={clusterStats['metrics'][0]['ReadOnlyTransactions']['lastValue']  || 0 }
                                                                title={"ReadOnlyTransactions/Minute"}
                                                                precision={1}
                                                                format={3}
                                                                fontColorValue={configuration.colors.fonts.metric100}
                                                                fontSizeValue={"20px"}
                                                            />     
                                                        </a>                                           
                                                    </td>                                            
                                                    <td valign="center" style={{"width":"25%", "text-align" : "left", "border-left": "2px solid " + configuration.colors.lines.separator100, "padding-left": "1em"  }}>                                                          
                                                            <Metric01 
                                                                value={clusterStats['metrics'][0]['ReadOnlyTransactions']['lastValue'] / 60  || 0 }
                                                                title={"ReadOnlyTransactions/Second"}
                                                                precision={1}
                                                                format={3}
                                                                fontColorValue={configuration.colors.fonts.metric100}
                                                                fontSizeValue={"20px"}
                                                            />                                                
                                                    </td>  
                                                    <td valign="center" style={{"width":"25%", "text-align" : "left", "border-left": "2px solid " + configuration.colors.lines.separator100, "padding-left": "1em"  }}>                                                          
                                                        <Metric01 
                                                            value={clusterStats['metrics'][0]['TotalTransactions']['lastValue'] /60  || 0 }
                                                            title={"TotalTransactions/Second"}
                                                            precision={1}
                                                            format={3}
                                                            fontColorValue={configuration.colors.fonts.metric100}
                                                            fontSizeValue={"20px"}
                                                        />                                                
                                                    </td>  
                                                    <td valign="center" style={{"width":"25%", "text-align" : "left", "border-left": "2px solid " + configuration.colors.lines.separator100, "padding-left": "1em"  }}>                                                          
                                                        <a href='#;' style={{ "text-decoration" : "none", "color": "inherit" }}  onClick={() => onClickMetric('OccConflicts')}>
                                                            <Metric01 
                                                                value={clusterStats['metrics'][0]['OccConflicts']['lastValue']  || 0 }
                                                                title={"OccConflicts/Minute"}
                                                                precision={1}
                                                                format={3}
                                                                fontColorValue={configuration.colors.fonts.metric100}
                                                                fontSizeValue={"20px"}
                                                            />     
                                                        </a>                                                                     
                                                    </td>  
                                                </tr>
                                            </table>
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
                                                    <td valign="center" style={{"width":"20%", "text-align" : "center" }}>  
                                                        <a href='#;' style={{ "text-decoration" : "none", "color": "inherit" }}  onClick={() => onClickMetric('TotalTransactions')}>
                                                            <Metric01 
                                                                value={clusterStats['metrics'][0]['TotalTransactions']['lastValue']  || 0 }
                                                                title={"TotalTransactions/Minute"}
                                                                precision={1}
                                                                format={3}
                                                                fontColorValue={configuration.colors.fonts.metric100}
                                                                fontSizeValue={"30px"}
                                                            />                                                
                                                        </a> 
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
                                                    <td valign="center" style={{"width":"20%", "text-align" : "center" }}>
                                                        <a href='#;' style={{ "text-decoration" : "none", "color": "inherit" }}  onClick={() => onClickMetric('CommitLatency')}>  
                                                            <Metric01 
                                                                value={ clusterStats['metrics'][0]['CommitLatency']['lastValue']  || 0  }
                                                                title={"CommitLatency(ms)"}
                                                                precision={0}
                                                                format={3}
                                                                fontColorValue={configuration.colors.fonts.metric100}
                                                                fontSizeValue={"30px"}
                                                            />                                                
                                                        </a>
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
                                        footer={
                                            <table style={{"width":"100%"}}>
                                                <tr>   
                                                    <td valign="center" style={{"width":"25%", "text-align" : "left", "border-left": "2px solid " + configuration.colors.lines.separator100, "padding-left": "1em"  }}>  
                                                        <a href='#;' style={{ "text-decoration" : "none", "color": "inherit" }}  onClick={() => onClickMetric('ClusterStorageSize')}>  
                                                            <Metric01 
                                                                value={clusterStats['metrics'][0]['ClusterStorageSize']['lastValue']  || 0 }
                                                                title={"ClusterStorageSize"}
                                                                precision={1}
                                                                format={2}
                                                                fontColorValue={configuration.colors.fonts.metric100}
                                                                fontSizeValue={"20px"}
                                                            />              
                                                        </a>                                  
                                                    </td>                           
                                                    <td valign="center" style={{"width":"25%", "text-align" : "left", "border-left": "2px solid " + configuration.colors.lines.separator100, "padding-left": "1em"  }}>  
                                                        <a href='#;' style={{ "text-decoration" : "none", "color": "inherit" }}  onClick={() => onClickMetric('BytesRead')}>  
                                                            <Metric01 
                                                                value={clusterStats['metrics'][0]['BytesRead']['lastValue']  || 0 }
                                                                title={"BytesRead"}
                                                                precision={1}
                                                                format={2}
                                                                fontColorValue={configuration.colors.fonts.metric100}
                                                                fontSizeValue={"20px"}
                                                            />           
                                                        </a>                                     
                                                    </td>                                            
                                                    <td valign="center" style={{"width":"25%", "text-align" : "left", "border-left": "2px solid " + configuration.colors.lines.separator100, "padding-left": "1em"  }}>  
                                                        <a href='#;' style={{ "text-decoration" : "none", "color": "inherit" }}  onClick={() => onClickMetric('BytesWritten')}>    
                                                            <Metric01 
                                                                value={clusterStats['metrics'][0]['BytesWritten']['lastValue']  || 0 }
                                                                title={"BytesWritten"}
                                                                precision={1}
                                                                format={2}
                                                                fontColorValue={configuration.colors.fonts.metric100}
                                                                fontSizeValue={"20px"}
                                                            />     
                                                        </a>                                           
                                                    </td>                                              
                                                    <td valign="center" style={{"width":"25%", "text-align" : "left",   }}>  
                                                                                                   
                                                    </td>  
                                                    
                                                </tr>
                                            </table>  
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
                                                    <td valign="center" style={{"width":"20%", "text-align" : "center" }}>                                                          
                                                            <Metric01 
                                                                value={ (clusterStats['metrics'][0]['BytesRead']['lastValue']  || 0 ) + (clusterStats['metrics'][0]['BytesWritten']['lastValue']  || 0 ) }
                                                                title={"Bytes/sec"}
                                                                precision={1}
                                                                format={2}
                                                                fontColorValue={configuration.colors.fonts.metric100}
                                                                fontSizeValue={"30px"}
                                                            />                                                                                                        
                                                    </td>                                                    
                                                </tr>
                                            </table>                                            
                                    </Container>                                   

                          </td>
                          <td valign="middle" style={{"width":"10%", "text-align" : "center", "padding-left": "1em", "padding-right": "1em"}}>  
                                <a href='#;' style={{ "text-decoration" : "none", "color": "inherit" }}  onClick={() => onClickMetric('MultiRegionWriteDPU')}>    
                                    <Metric01 
                                        value={clusterStats['metrics'][0]['MultiRegionWriteDPU']['lastValue']  || 0 }
                                        title={"MultiRegionWriteDPU"}
                                        precision={0}
                                        format={3}
                                        fontColorValue={configuration.colors.fonts.metric100}
                                        fontSizeValue={"30px"}
                                    />  
                                </a>
                                <Icon name="arrow-right" />                                                              
                                <Animation01 speed="3s" height = "30px" width = "150px" />
                                <br/>
                                <br/>
                                <br/>     
                                <br/>     
                                <br/>         
                                <a href='#;' style={{ "text-decoration" : "none", "color": "inherit" }}  onClick={() => onClickMetric('MultiRegionWriteDPU')}>                                
                                    <Metric01 
                                        value={clusterStats['metrics'][1]['MultiRegionWriteDPU']['lastValue']  || 0 }
                                        title={"MultiRegionWriteDPU"}
                                        precision={0}
                                        format={3}
                                        fontColorValue={configuration.colors.fonts.metric100}
                                        fontSizeValue={"30px"}
                                    />        
                                </a>
                                <Icon name="arrow-left" />                                                   
                                <Animation01 speed="3s" rotate="180deg" height = "30px" width = "150px" />
                                <br/>
                                <br/>
                                <br/>     
                                <br/>     
                                <br/>                                     
                               
                                
                          </td>

                            <td valign="top" style={{"width":"45%","padding": "1em", "border-radius" : "20px", "border": "15px solid " + configuration.colors.lines.separator102 }}>                                  
                                   <table style={{"width":"100%"}}>
                                            <tr>                                                  
                                                <td style={{"width":"10%", textAlign: "right", "padding-right": "1em", "border-right": "4px solid " + configuration.colors.lines.separator100,}}>  
                                                    <div>
                                                        <Box color="text-status-inactive" variant="h2">{parameter_object_values['peerCluster']}</Box>
                                                    </div>
                                                    <Box variant="awsui-key-label">ClusterId</Box>
                                                </td>                         
                                                <td style={{"width":"10%", textAlign: "right", "padding-right": "1em", "border-right": "4px solid " + configuration.colors.lines.separator100,}}>  
                                                    <div>
                                                        <Box color="text-status-inactive" variant="h2">{parameter_object_values['peerRegion']}</Box>
                                                    </div>                                                   
                                                    <Box variant="awsui-key-label">Region</Box>
                                                </td>                                                                         
                                            </tr>
                                    </table>
                                   <br/>
                                   <Container
                                        header={
                                 
                                            <Box variant="h2" textAlign="right">Distributed Processing Units</Box>
                                        }
                                        footer={
                                            <table style={{"width":"100%"}}>
                                                <tr>    
                                                    <td valign="center" style={{"width":"25%", "text-align" : "right", "border-right": "2px solid " + configuration.colors.lines.separator100, "padding-right": "1em"  }}>  
                                                        <a href='#;' style={{ "text-decoration" : "none", "color": "inherit" }}  onClick={() => onClickMetric('MultiRegionWriteDPU')}>                                
                                                            <Metric01 
                                                                value={clusterStats['metrics'][1]['MultiRegionWriteDPU']['lastValue']  || 0 }
                                                                title={"MultiRegionWriteDPU"}
                                                                precision={1}
                                                                format={3}
                                                                fontColorValue={configuration.colors.fonts.metric100}
                                                                fontSizeValue={"20px"}
                                                            />   
                                                        </a>                                             
                                                    </td> 
                                                    <td valign="center" style={{"width":"25%", "text-align" : "right", "border-right": "2px solid " + configuration.colors.lines.separator100, "padding-right": "1em"  }}>  
                                                        <a href='#;' style={{ "text-decoration" : "none", "color": "inherit" }}  onClick={() => onClickMetric('WriteDPU')}>                                
                                                            <Metric01 
                                                                value={clusterStats['metrics'][1]['WriteDPU']['lastValue']  || 0 }
                                                                title={"WriteDPU"}
                                                                precision={1}
                                                                format={3}
                                                                fontColorValue={configuration.colors.fonts.metric100}
                                                                fontSizeValue={"20px"}
                                                            />                                                
                                                        </a>
                                                    </td>                                                                                                                                                                    
                                                    <td valign="center" style={{"width":"25%", "text-align" : "right", "border-right": "2px solid " + configuration.colors.lines.separator100, "padding-right": "1em"  }}>  
                                                        <a href='#;' style={{ "text-decoration" : "none", "color": "inherit" }}  onClick={() => onClickMetric('ReadDPU')}>                                
                                                            <Metric01 
                                                                value={clusterStats['metrics'][1]['ReadDPU']['lastValue']  || 0 }
                                                                title={"ReadDPU"}
                                                                precision={1}
                                                                format={3}
                                                                fontColorValue={configuration.colors.fonts.metric100}
                                                                fontSizeValue={"20px"}
                                                            />                                                
                                                        </a>
                                                    </td>  
                                                    <td valign="center" style={{"width":"25%", "text-align" : "right", "border-right": "2px solid " + configuration.colors.lines.separator100, "padding-right": "1em"  }}>  
                                                        <a href='#;' style={{ "text-decoration" : "none", "color": "inherit" }}  onClick={() => onClickMetric('ComputeDPU')}>                                
                                                            <Metric01 
                                                                value={clusterStats['metrics'][1]['ComputeDPU']['lastValue']  || 0 }
                                                                title={"ComputeDPU"}
                                                                precision={1}
                                                                format={3}
                                                                fontColorValue={configuration.colors.fonts.metric100}
                                                                fontSizeValue={"20px"}
                                                            />                                                
                                                        </a>
                                                    </td>   
                                                    
                                                    
                                                    
                                                </tr>
                                            </table>
                                        }
                                    >
                                            <table style={{"width":"100%"}}>
                                                <tr>                 
                                                             
                                                    <td valign="center" style={{"width":"20%", "text-align" : "center" }}>  
                                                        <a href='#;' style={{ "text-decoration" : "none", "color": "inherit" }}  onClick={() => onClickMetric('TotalDPU')}>                                
                                                            <Metric01 
                                                                value={clusterStats['metrics'][1]['TotalDPU']['lastValue']  || 0 }
                                                                title={"TotalDPU"}
                                                                precision={1}
                                                                format={3}
                                                                fontColorValue={configuration.colors.fonts.metric100}
                                                                fontSizeValue={"30px"}
                                                            />                                                                                   
                                                        </a>
                                                    </td>
                                                    <td valign="top" style={{"width":"80%"}}>  
                                                        <ChartLine01 series={JSON.stringify([
                                                                                { name : "ComputeDPU", data : clusterStats['metrics'][1]['ComputeDPU']['history'] },
                                                                                { name : "ReadDPU", data : clusterStats['metrics'][1]['ReadDPU']['history'] },
                                                                                { name : "WriteDPU", data : clusterStats['metrics'][1]['WriteDPU']['history'] },
                                                                                { name : "MultiRegionWriteDPU", data : clusterStats['metrics'][1]['MultiRegionWriteDPU']['history'] },
                                                                            ])}
                                                                        title={"DPUs"} height="220px" 
                                                                        stacked={true}
                                                        />
                                                    </td>  
                                                    
                                                </tr>
                                            </table>                                            
                                    </Container>
                                    <br/>                                    
                                    <Container
                                        header={
                                            <Box variant="h2" textAlign="right">Transactions</Box>
                                        }
                                        footer={
                                            <table style={{"width":"100%"}}>
                                                <tr>  
                                                    <td valign="center" style={{"width":"25%", "text-align" : "right", "border-right": "2px solid " + configuration.colors.lines.separator100, "padding-right": "1em"  }}>  
                                                        <a href='#;' style={{ "text-decoration" : "none", "color": "inherit" }}  onClick={() => onClickMetric('OccConflicts')}>                                
                                                            <Metric01 
                                                                value={clusterStats['metrics'][1]['OccConflicts']['lastValue']  || 0 }
                                                                title={"OccConflicts/Minute"}
                                                                precision={1}
                                                                format={3}
                                                                fontColorValue={configuration.colors.fonts.metric100}
                                                                fontSizeValue={"20px"}
                                                            />   
                                                        </a>    
                                                    </td>                                                                      
                                                    <td valign="center" style={{"width":"25%", "text-align" : "right", "border-right": "2px solid " + configuration.colors.lines.separator100, "padding-right": "1em"  }}>  
                                                            <Metric01 
                                                                value={clusterStats['metrics'][1]['TotalTransactions']['lastValue'] / 60  || 0 }
                                                                title={"TotalTransactions/Second"}
                                                                precision={1}
                                                                format={3}
                                                                fontColorValue={configuration.colors.fonts.metric100}
                                                                fontSizeValue={"20px"}
                                                            />                                                               
                                                    </td>                                                                                             
                                                    <td valign="center" style={{"width":"25%", "text-align" : "right", "border-right": "2px solid " + configuration.colors.lines.separator100, "padding-right": "1em"  }}>  
                                                            <Metric01 
                                                                value={clusterStats['metrics'][1]['ReadOnlyTransactions']['lastValue'] / 60  || 0 }
                                                                title={"ReadOnlyTransactions/Second"}
                                                                precision={1}
                                                                format={3}
                                                                fontColorValue={configuration.colors.fonts.metric100}
                                                                fontSizeValue={"20px"}
                                                            />                                                          
                                                    </td>                                                                                                            
                                                    <td valign="center" style={{"width":"25%", "text-align" : "right", "border-right": "2px solid " + configuration.colors.lines.separator100, "padding-right": "1em"  }}>  
                                                        <a href='#;' style={{ "text-decoration" : "none", "color": "inherit" }}  onClick={() => onClickMetric('ReadOnlyTransactions')}>                                
                                                            <Metric01 
                                                                value={clusterStats['metrics'][1]['ReadOnlyTransactions']['lastValue']  || 0 }
                                                                title={"ReadOnlyTransactions/Minute"}
                                                                precision={1}
                                                                format={3}
                                                                fontColorValue={configuration.colors.fonts.metric100}
                                                                fontSizeValue={"20px"}
                                                            />  
                                                        </a>                                                  
                                                </td>     
                                                </tr>
                                                
                                            </table>
                                        }
                                    >
                                            <table style={{"width":"100%"}}>
                                                <tr>       
                                                    <td valign="center" style={{"width":"20%", "text-align" : "center" }}>  
                                                        <a href='#;' style={{ "text-decoration" : "none", "color": "inherit" }}  onClick={() => onClickMetric('TotalTransactions')}>                                
                                                            <Metric01 
                                                                value={clusterStats['metrics'][1]['TotalTransactions']['lastValue']  || 0 }
                                                                title={"TotalTransactions/Minute"}
                                                                precision={1}
                                                                format={3}
                                                                fontColorValue={configuration.colors.fonts.metric100}
                                                                fontSizeValue={"30px"}
                                                            />                                                
                                                        </a>    
                                                    </td>
                                                    <td valign="top" style={{"width":"80%"}}>  
                                                            <ChartBar01 series={JSON.stringify([
                                                                                    { name : "Transactions", data : clusterStats['metrics'][1]['TotalTransactions']['history'] }
                                                                                ])}
                                                                            title={"TotalTransactions/Minute"} height="220px" 
                                                            />
                                                    </td>                                                                        
                                                </tr>
                                            </table>                                            
                                    </Container>
                                    <br/>                                   
                                    <Container
                                        header={

                                            <Box variant="h2" textAlign="right">Latency</Box>
                                        }
                                    >
                                            <table style={{"width":"100%"}}>
                                                <tr>   
                                                    <td valign="center" style={{"width":"20%", "text-align" : "center" }}>  
                                                        <a href='#;' style={{ "text-decoration" : "none", "color": "inherit" }}  onClick={() => onClickMetric('CommitLatency')}>                                
                                                            <Metric01 
                                                                value={ clusterStats['metrics'][1]['CommitLatency']['lastValue']  || 0  }
                                                                title={"CommitLatency(ms)"}
                                                                precision={0}
                                                                format={3}
                                                                fontColorValue={configuration.colors.fonts.metric100}
                                                                fontSizeValue={"30px"}
                                                            />    
                                                        </a>                                            
                                                    </td>
                                                    <td valign="top" style={{"width":"80%"}}>  
                                                            <ChartBar01 series={JSON.stringify([
                                                                                    { name : "CommitLatency", data : clusterStats['metrics'][1]['CommitLatency']['history'] }
                                                                                ])}
                                                                            title={"CommitLatency(ms)"} height="220px" 
                                                            />
                                                    </td>                                                     
                                                </tr>
                                            </table>   
                                    </Container>                                 
                                    <br/>   
                                    <Container
                                        header={
                                            <Box variant="h2" textAlign="right">Storage</Box>
                                        }
                                        footer={
                                            <table style={{"width":"100%"}}>
                                                <tr>   
                                                    <td valign="center" style={{"width":"25%", "text-align" : "left",   }}>  
                                                                                                   
                                                    </td>  
                                                    <td valign="center" style={{"width":"25%", "text-align" : "right", "border-right": "2px solid " + configuration.colors.lines.separator100, "padding-right": "1em"  }}>  
                                                        <a href='#;' style={{ "text-decoration" : "none", "color": "inherit" }}  onClick={() => onClickMetric('ClusterStorageSize')}>                                
                                                            <Metric01 
                                                                value={clusterStats['metrics'][1]['ClusterStorageSize']['lastValue']  || 0 }
                                                                title={"ClusterStorageSize"}
                                                                precision={1}
                                                                format={2}
                                                                fontColorValue={configuration.colors.fonts.metric100}
                                                                fontSizeValue={"20px"}
                                                            />                                                
                                                        </a>
                                                    </td>                           
                                                    <td valign="center" style={{"width":"25%", "text-align" : "right", "border-right": "2px solid " + configuration.colors.lines.separator100, "padding-right": "1em"  }}>  
                                                        <a href='#;' style={{ "text-decoration" : "none", "color": "inherit" }}  onClick={() => onClickMetric('BytesRead')}>                                
                                                            <Metric01 
                                                                value={clusterStats['metrics'][1]['BytesRead']['lastValue']  || 0 }
                                                                title={"BytesRead"}
                                                                precision={1}
                                                                format={2}
                                                                fontColorValue={configuration.colors.fonts.metric100}
                                                                fontSizeValue={"20px"}
                                                            />                                                
                                                        </a>
                                                    </td>                                            
                                                    <td valign="center" style={{"width":"25%", "text-align" : "right", "border-right": "2px solid " + configuration.colors.lines.separator100, "padding-right": "1em"  }}>  
                                                        <a href='#;' style={{ "text-decoration" : "none", "color": "inherit" }}  onClick={() => onClickMetric('BytesWritten')}>                                
                                                            <Metric01 
                                                                value={clusterStats['metrics'][1]['BytesWritten']['lastValue']  || 0 }
                                                                title={"BytesWritten"}
                                                                precision={1}
                                                                format={2}
                                                                fontColorValue={configuration.colors.fonts.metric100}
                                                                fontSizeValue={"20px"}
                                                            />                                                
                                                        </a>
                                                    </td>                                                                                                  
                                                    
                                                </tr>
                                            </table> 
                                        }
                                    >                                 
                                            <table style={{"width":"100%"}}>
                                                <tr>    
                                                    <td valign="center" style={{"width":"20%", "text-align" : "center" }}>  
                                                        <Metric01 
                                                            value={ (clusterStats['metrics'][1]['BytesRead']['lastValue']  || 0 ) + (clusterStats['metrics'][0]['BytesWritten']['lastValue']  || 0 ) }
                                                            title={"Bytes/sec"}
                                                            precision={1}
                                                            format={2}
                                                            fontColorValue={configuration.colors.fonts.metric100}
                                                            fontSizeValue={"30px"}
                                                        />                                                
                                                    </td>                           
                                                    <td valign="top" style={{"width":"80%"}}>  
                                                        <ChartLine01 series={JSON.stringify([
                                                                                { name : "BytesRead", data : clusterStats['metrics'][1]['BytesRead']['history'] },
                                                                                { name : "BytesWritten", data : clusterStats['metrics'][1]['BytesWritten']['history'] }
                                                                            ])}
                                                                        title={"StorageTransfer(Bytes/sec)"} height="220px" 
                                                                        stacked={true}
                                                        />
                                                    </td>
                                                </tr>
                                            </table>                                             
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
