import {useState, useEffect, useRef} from 'react'
import { createSearchParams } from "react-router-dom";
import Axios from 'axios';
import { configuration, SideMainLayoutHeader,SideMainLayoutMenu, breadCrumbs } from './Configs';
import { createLabelFunction, customFormatNumberLong, customFormatNumber, customFormatNumberInteger } from '../components/Functions';

import CustomHeader from "../components/HeaderApp";
import AppLayout from "@cloudscape-design/components/app-layout";
import SideNavigation from '@cloudscape-design/components/side-navigation';
import Container from "@cloudscape-design/components/container";

import { StatusIndicator, Link, CopyToClipboard } from '@cloudscape-design/components';
import SpaceBetween from "@cloudscape-design/components/space-between";
import Button from "@cloudscape-design/components/button";
import Header from "@cloudscape-design/components/header";
import Box from "@cloudscape-design/components/box";
import ColumnLayout from "@cloudscape-design/components/column-layout";
import { SplitPanel } from '@cloudscape-design/components';
import KeyValuePairs from '@cloudscape-design/components/key-value-pairs';
import BreadcrumbGroup from "@cloudscape-design/components/breadcrumb-group";

import Table01  from '../components/Table01';
import ChartBar01  from '../components/ChartBar01';


import '@aws-amplify/ui-react/styles.css';

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




//-- Encryption
var CryptoJS = require("crypto-js");

function Dashboard() {
    
    
    //-- Variable for Split Panels
    const [splitPanelShow,setsplitPanelShow] = useState(false);
    const [selectedItems,setSelectedItems] = useState([{ identifier: "" }]);

    
    var accountId = useRef("");
    var regionId = useRef("");
    var currentSelectedItem = useRef(null);
   
    //-- Variables Table
    const columnsTable = [
                  {id: 'name',header: 'Tag: Name',cell: item => item.name,ariaLabel: createLabelFunction('name'),sortingField: 'name',},
                  {id: 'identifier',header: 'Cluster ID',cell: item => item.identifier,ariaLabel: createLabelFunction('identifier'),sortingField: 'identifier',},
                  {id: 'status',header: 'Status',cell: item => ( <> <StatusIndicator type={item.status === 'active' ? 'success' : 'pending'}> {item.status} </StatusIndicator> </> ),ariaLabel: createLabelFunction('Status'),sortingField: 'status',},
                  {id: 'account',header: 'Account',cell: item => /*"12345567890"*/ item.account,ariaLabel: createLabelFunction('account'),sortingField: 'account',},
                  {id: 'clusterRegion',header: 'Region',cell: item => item.clusterRegion,ariaLabel: createLabelFunction('clusterRegion'),sortingField: 'clusterRegion',},                  
                  {id: 'peerRegion',header: 'Peer Region',cell: item => item.peerRegion,ariaLabel: createLabelFunction('peerRegion'),sortingField: 'peerRegion',},
                  {id: 'totalDPU',header: 'TotalDPUs',cell: item => customFormatNumberInteger(item.totalDPU || 0, 0),ariaLabel: createLabelFunction('totalDPU'),sortingField: 'totalDPU',},                  
                  {id: 'transactions',header: 'Transactions',cell: item => customFormatNumberInteger(item.transactions || 0, 0),ariaLabel: createLabelFunction('transactions'),sortingField: 'transactions',},                  
                  {id: 'commitLatency',header: 'CommitLatency(ms)',cell: item => customFormatNumberInteger(item.commitLatency || 0, 0),ariaLabel: createLabelFunction('commitLatency'),sortingField: 'commitLatency',},                                    
                  {id: 'witnessRegion',header: 'Witness Region',cell: item => item.witnessRegion,ariaLabel: createLabelFunction('witnessRegion'),sortingField: 'witnessRegion',},
                  {id: 'endPoint',header: 'Endpoint',cell: item => <CopyToClipboard copyButtonAriaLabel="Copy Endpoint" copyErrorText="Endpoint failed to copy"  copySuccessText="Endpoint copied" textToCopy={item.endPoint}  variant="inline"  />,ariaLabel: createLabelFunction('endPoint'),sortingField: 'endPoint',},
                  {id: 'creationTime',header: 'CreationTime',cell: item => item.creationTime,ariaLabel: createLabelFunction('creationTime'),sortingField: 'creationTime',}
    ];          
    const columnsTableVisible = [ 'name', 'account', 'identifier', 'status', 'clusterRegion', 'totalDPU', 'transactions', 'commitLatency', 'peerRegion' ];
    
    const [globalStats,setGlobalStats] = useState({
                                                  resources : [],
                                                  summary : {
                                                    TotalTransactions : 0,
                                                    TotalCommitLatency : 0,
                                                    TotalDPU : 0
                                                  },
                                                  history : {
                                                    TotalTransactions : [],
                                                    TotalCommitLatency : [],
                                                    TotalDPU : []
                                                  },
                                                  lastTimestamp : "-"

    });

  
    
    //-- Add Header Cognito Token
    Axios.defaults.headers.common['x-token-cognito'] = sessionStorage.getItem("x-token-cognito");
    Axios.defaults.withCredentials = true;
    
    //-- Handle Click Events
    const handleClickLogin = () => {
            
      
            var session_id = CryptoJS.AES.encrypt(JSON.stringify({
                                                                  globalIdentifier : selectedItems[0]['identifier'],
                                                                  globalUserId : "IAM",
                                                                  globalEngine : "DSQL",
                                                                  ...selectedItems[0]
                                                                  }),
                                                  sessionStorage.getItem("x-token-cognito")                                              
                                                  ).toString();
                                                  
            var path_name = "";
            
            if (  !(selectedItems[0].hasOwnProperty('peerRegion')))
                path_name = "/dsql/single/";
            else
                path_name = "/dsql/cluster/";

            window.open(path_name + '?' + createSearchParams({
              session_id: session_id
              }).toString() ,'_blank');

            
            
  };
    

   

    //-- Gather cluster list
    async function gatherClusters (){
          
      var params = {
              userId : sessionStorage.getItem("x-user-cognito")
      };
  
      try {
            Axios.get(`${configuration["apps-settings"]["api_url"]}/api/aws/aurora/dsql/clusters/list/`,{
                params: params
                }).then((data)=>{             
                                
                    console.log(data);
                      var resources = data['data']?.['results']?.['resources'];                
                      setGlobalStats(data['data']?.['results']);                
                      if (resources.length > 0 ) {
                        accountId.current = resources[0]?.['account'];
                        regionId.current = resources[0]?.['clusterRegion'];                        
                        if ( currentSelectedItem.current == null ){                                                    
                          currentSelectedItem.current = [resources[0]];
                          setSelectedItems([resources[0]]);
                        }                        
                        setsplitPanelShow(true);
                      }  
                    
                })
                .catch((err) => {
                      console.log('Timeout API Call : /api/aws/aurora/dsql/clusters/list/' );
                      console.log(err);                
                });          
        } catch (err) {

          console.log('Timeout API Call : /api/aws/aurora/dsql/clusters/list/');
          console.log(err);

        } finally {

          // Set loading state to false after API call completes (success or error)

        }
    }

    
   
    //--## Page Loader        
    useEffect(() => {
      gatherClusters();
      const id = setInterval(gatherClusters, configuration["apps-settings"]["refresh-interval-dsql-dashboard"]);
      return () => clearInterval(id);
    }, []);
   
  
     
  
    
  return (
    <div style={{"background-color": "#f2f3f3"}}>
        <CustomHeader/>
        <AppLayout     
            disableContentPaddings={true}
            breadCrumbs={breadCrumbs}
            navigation={<SideNavigation items={SideMainLayoutMenu} header={SideMainLayoutHeader} activeHref={"/clusters/dsql/"} />}
            splitPanelOpen={splitPanelShow}
            onSplitPanelToggle={() => setsplitPanelShow(false)}
            splitPanelSize={250}
            toolsHide={true}
            splitPanel={
                      <SplitPanel  
                          header={
                          
                              <Header
                                      variant="h3"
                                      actions={
                                              <SpaceBetween
                                                direction="horizontal"
                                                size="xs"
                                              >
                                                <Button variant="primary" disabled={selectedItems[0].identifier === "" ? true : false} onClick={() => { handleClickLogin(); }}>Connect</Button>
                                              </SpaceBetween>
                                      }
                                      
                                    >
                                     {"Cluster : " + selectedItems[0].identifier}
                                    </Header>
                            
                          } 
                          i18nStrings={splitPanelI18nStrings} closeBehavior="hide"
                          onSplitPanelToggle={({ detail }) => {
                                         //console.log(detail);
                                        }
                                      }
                      >
                          
                        <ColumnLayout columns="4" variant="text-grid">
                             <div>
                                  <Box variant="awsui-key-label">Cluster ID</Box>
                                  {selectedItems[0]['identifier']}
                              </div>
                              <div>
                                  <Box variant="awsui-key-label">Name</Box>
                                  {selectedItems[0]['name']}
                              </div>
                              <div>
                                  <Box variant="awsui-key-label">Region</Box>
                                  {selectedItems[0]['clusterRegion']}
                              </div>
                              <div>
                                  <Box variant="awsui-key-label">Status</Box>
                                  {selectedItems[0]['status']}
                              </div>                              
                            </ColumnLayout>
                            <br /> 
                            <br />
                            <ColumnLayout columns="4" variant="text-grid">
                              <div>
                                  <Box variant="awsui-key-label">Peer Cluster</Box>
                                  {selectedItems[0]['peerRegion']}
                              </div>
                              <div>
                                  <Box variant="awsui-key-label">Peer witness</Box>
                                  {selectedItems[0]['witnessRegion']}
                              </div>
                              <div>
                                  <Box variant="awsui-key-label">Endpoint</Box>
                                  {selectedItems[0]['endPoint']}
                              </div>
                              <div>
                                  <Box variant="awsui-key-label">Creation Time</Box>
                                  {selectedItems[0]['creationTime']}
                             </div>                                                        
                            </ColumnLayout>                            
                            
                      </SplitPanel>
            }
            contentType="table"
            content={
                
                    <div style={{"padding" : "1em"}}>      
                        <table style={{"width":"100%"}}>
                            <tr>                
                                <td style={{"width":"50%", "textAlign" : "left",   }}>                   
                                    <div style={{"paddingLeft" : "1em", "paddingBottom" : ".3em" }}>
                                        <BreadcrumbGroup
                                              items={[
                                                { text: "Aurora DSQL", href: "#" },                                
                                                {
                                                  text: "Clusters",
                                                  href: "#"
                                                }
                                              ]}
                                              ariaLabel="Breadcrumbs"
                                        />
                                     </div>                         
                                  </td>                
                                  <td style={{"width":"50%", "textAlign" : "right",   }}>                                                                
                                        <Button iconName="refresh" onClick={() => {gatherClusters();}}>{globalStats['lastTimestamp']}</Button>                                                                                                                                   
                                  </td>  
                              </tr>                
                          </table>                
                        <table style={{"width":"100%"}}>
                                  <tr>                
                                      <td valign="top" style={{"width":"40%", "textAlign" : "center",  "paddingRight" : ".5em" }}>  
                                          <Container
                                                      header={
                                                        <Header variant="h2" description={`Viewing data aggregated from multiple AWS accounts and regions.`}
                                                        actions={   
                                                          <SpaceBetween
                                                            direction="horizontal"
                                                            size="xs"
                                                          >                                                                
                                                          </SpaceBetween>                                                      
                                                        }
                                                    >
                                                        
                                                        Service overview - <em>new</em>
                                                        </Header>
                                                      }
                                                      
                                          >

                                              <KeyValuePairs
                                                    columns={3}
                                                    items={[
                                                      {
                                                        label: 'Accounts',
                                                        value: (
                                                          <Link fontSize="heading-xl" variant="secondary" >
                                                            {globalStats['summary']?.['accounts']  || 0}
                                                          </Link>
                                                        ),
                                                      },
                                                      {
                                                        label: 'Regions',
                                                        value: (
                                                          <Link fontSize="heading-xl" variant="secondary" >
                                                            {globalStats['summary']?.['regions']  || 0}
                                                          </Link>
                                                        ),
                                                      },
                                                      
                                                      {
                                                        label: 'Clusters',
                                                        value: (
                                                          <Link fontSize="heading-xl" variant="secondary" >
                                                            {globalStats['summary']?.['resources']  || 0}
                                                          </Link>
                                                        ),
                                                      },                                    
                                                    ]}
                                              />
                                                                            
                                          </Container>
                                      </td>  
                                      <td valign="top" style={{"width":"60%", "textAlign" : "center", "paddingLeft" : ".5em" }}>  
                                          <Container
                                                      header={
                                                        <Header variant="h2" description={`Viewing service usage aggregated from multiple AWS accounts and regions.`}
                                                        actions={   
                                                              <SpaceBetween
                                                                direction="horizontal"
                                                                size="xs"
                                                              >                                                               
                                                              </SpaceBetween>
                                                          
                                                        }
                                                        >
                                                        Service usage 
                                                        </Header>
                                                      }
                                          >

                                              <KeyValuePairs
                                                    columns={3}
                                                    items={[
                                                      {
                                                        label: 'Transactions',
                                                        value: (
                                                          <Link fontSize="heading-xl" variant="secondary" >
                                                            { customFormatNumberInteger(globalStats['summary']?.['TotalTransactions']  || 0, 0) }
                                                          </Link>
                                                        ),
                                                      },
                                                      {
                                                        label: 'DPUs',
                                                        value: (
                                                          <Link fontSize="heading-xl" variant="secondary" >
                                                            { customFormatNumberInteger(globalStats['summary']?.['TotalDPU']  || 0,0) }
                                                          </Link>
                                                        ),
                                                      },
                                                      
                                                      {
                                                        label: 'Storage',
                                                        value: (
                                                          <Link fontSize="heading-xl" variant="secondary" >
                                                            { customFormatNumber(globalStats['summary']?.['ClusterStorageSize']  || 0,0) }
                                                          </Link>
                                                        ),
                                                      },                                    
                                                    ]}
                                              />
                                                                            
                                          </Container>
                                      </td>
                                  </tr>
                          </table>    

                        
                          <br/>                        
                         
                          <table style={{"width":"100%"}}>
                                  <tr>                 
                                      <td valign="top" style={{"width":"50%", "textAlign" : "center", "paddingRight" : ".5em" }}>  
                                            <Container
                                                header={
                                                  <Header variant="h2" description={`DPU usage from last 30 minutes across accounts and regions.`}>
                                                  Total DPUs
                                                  </Header>
                                                                  }
                                              >
                                                    <ChartBar01 series={JSON.stringify([
                                                                                { name : "TotalDPU", data : globalStats['history']?.['TotalDPU'] }
                                                                            ])}
                                                                        title={""} height="220px" 
                                                    />
                                              </Container>
                                      </td>                                          
                                      <td valign="top" style={{"width":"50%", "textAlign" : "center", "paddingLeft" : ".5em" }}> 
                                            <Container
                                                header={
                                                  <Header variant="h2" description={`Transactions from last 30 minutes across accounts and regions.`}>
                                                  Total transactions
                                                  </Header>
                                                                  }
                                              > 
                                                    <ChartBar01 series={JSON.stringify([
                                                                                { name : "TotalTransactions", data : globalStats['history']?.['TotalTransactions'] }
                                                                            ])}
                                                                        title={""} height="220px" 
                                                    />
                                              </Container>
                                      </td> 
                                  </tr>
                            </table>
                              
                        
                        <br/>
                        <Table01
                              columnsTable={columnsTable}
                              visibleContent={columnsTableVisible}
                              dataset={globalStats['resources']}
                              title={"Aurora DSQL Clusters"}     
                              onSelectionItem={( item ) => {                                                                                               
                                          accountId.current = item[0]?.['account'];
                                          regionId.current = item[0]?.['clusterRegion'];
                                          currentSelectedItem.current = item;
                                          setSelectedItems(item);
                                          setsplitPanelShow(true);
                                  }
                              }
                              tableActions={   
                                <SpaceBetween
                                  direction="horizontal"
                                  size="xs"
                                >                                 
                                  <Button iconName="refresh" onClick={() => {gatherClusters();}}></Button>                                                                                    
                                </SpaceBetween>
                                
                              }
                              selectedListItems={selectedItems}

                        />                          
                    
                          
                        
                  </div>
                
            }
          />
        
    </div>
  );
}

export default Dashboard;
