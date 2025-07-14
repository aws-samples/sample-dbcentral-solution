
import {useState,useEffect} from 'react'

import BreadcrumbGroup from '@cloudscape-design/components/breadcrumb-group';
import ContentLayout from '@cloudscape-design/components/content-layout';
import Button from "@cloudscape-design/components/button";
import Container from "@cloudscape-design/components/container";
import Header from "@cloudscape-design/components/header";
import Box from "@cloudscape-design/components/box";
import ColumnLayout from "@cloudscape-design/components/column-layout";
import SegmentedControl from "@cloudscape-design/components/segmented-control";
import architecturePublic from '../img/architecture-public.png'; 
import architecturePrivate from '../img/architecture-private.png'; 
import Grid from '@cloudscape-design/components/grid';
import Link from '@cloudscape-design/components/link';
import SpaceBetween from '@cloudscape-design/components/space-between';

import { configuration } from './Configs';
import { applicationVersionUpdate } from '../components/Functions';
import CustomHeader from "../components/HeaderApp";


function Home() {
  
    //-- Application Version
    const [versionMessage, setVersionMessage] = useState([]);
    const [selectedId, setSelectedId] = useState("public");



    //--## Call API to App Version
    async function gatherVersion (){

        //-- Application Update
        var appVersionObject = await applicationVersionUpdate({ codeId : "dbcentral", moduleId: "global"} );
        
        if (appVersionObject.release > configuration["apps-settings"]["release"] ){
          setVersionMessage([
                              {
                                type: "info",
                                content: "New Application version is available, new features and modules will improve monitoring capabilities and user experience.",
                                dismissible: true,
                                dismissLabel: "Dismiss message",
                                onDismiss: () => setVersionMessage([]),
                                id: "message_1"
                              }
          ]);
      
        }
        
    }
   
   
    //--## Page loader
    useEffect(() => {
        gatherVersion();
    }, []);
    
    
  return (
      

      <div>
      <CustomHeader/>
      <ContentLayout        
        breadcrumbs={
          <BreadcrumbGroup
            items={[
              { href: '/', text: 'Solutions' },
              { href: '#/product', text: configuration["apps-settings"]["application-title"] },
            ]}
            expandAriaLabel="Show path"
            ariaLabel="Breadcrumbs"
          />
        }
        headerVariant={"high-contrast"}
        header={
                  <Box data-testid="hero-header" padding={{ top: 'xs', bottom: 'l' }}>
                    <Grid gridDefinition={[{ colspan: { default: 12, xs: 8, s: 9 } }, { colspan: { default: 12, xs: 4, s: 3 } }]}>
                      <div>
                        <Box variant="h1">{configuration["apps-settings"]["application-title"]} Solution</Box>
                        <Box variant="p" color="text-body-secondary" margin={{ top: 'xxs', bottom: 's' }}>
                        Transform AWS database monitoring with one powerful view. {configuration["apps-settings"]["application-title"]} Solution delivers unprecedented visibility across all your AWS database services, 
                        regions, and accounts through a single, comprehensive monitoring hub. By intelligently combining Cloudwatch metrics with AWS metadata, 
                        we empower your teams to instantly identify issues, optimize performance, and enhance database observability—all while eliminating console-switching complexity. 
                        See everything. Miss nothing.
                        </Box>
                        <SpaceBetween size="xs">
                          <div>Supoort: <Link variant="primary" href="#">Amazon Aurora DSQL</Link></div>
                        </SpaceBetween>
                      </div>

                      <Box margin={{ top: 'l' }}>
                        <SpaceBetween size="s">
                          <Button variant="primary" fullWidth={true} href="/clusters/dsql/">
                            Get Started
                          </Button>                          
                        </SpaceBetween>
                      </Box>
                    </Grid>
              </Box>
        }
        defaultPadding={true}
        maxContentWidth={1040}
        disableOverlap={true}
      >


                  <div>
                    <br/>
                    <ColumnLayout columns={1} >
                      
                            <div>
                                <Container
                                      header = {
                                        <Header variant="h2">
                                          Key features
                                        </Header>
                                        
                                      }
                                  >

                                <ul>
                                      <li><b>Complete Database Visibility</b> - See all your database instances and clusters at once with simple dashboards that combine metrics
                                         and performance data in clear, meaningful displays.                                      
                                      </li>
                                  <br/>
                                      <li><b>Cross-Region Monitoring</b> - Track databases across AWS regions from one screen with visual maps showing replication status 
                                      and performance at a glance.
                                      </li>
                                  <br/>
                                      <li>
                                      <b>Multi-Account Management</b> - Monitor instances and clusters from any AWS account without switching consoles, 
                                      bringing your entire database fleet into a single, unified view.
                                      </li>
                                  <br/>
                                      <li>
                                      <b>Smart Performance Visualization</b> - Evaluate database health at a glance with our thoughtfully designed UI that presents key 
                                      performance metrics in a clear, intuitive format for faster analysis and decision-making.
                                    </li>
                                  <br/>
                                </ul>                                                                       
                              </Container>
                              
                          </div>                          
                          </ColumnLayout>
                          <br/>
                          <Container
                                      header = {
                                        <Header variant="h2">
                                          Architecture
                                        </Header>
                                        
                                      }
                                  >
                                    <br/>
                                    <SegmentedControl
                                        selectedId={selectedId}
                                        onChange={({ detail }) =>
                                          setSelectedId(detail.selectedId)
                                        }                                        
                                        options={[
                                          { text: "Public", id: "public" },
                                          { text: "Private", id: "private" }                                          
                                        ]}
                                    />
                                    <br/>                                    
                                    <img style={{ "max-width" :"100%" }} src={ selectedId == "public" ? architecturePublic : architecturePrivate} alt="Architecture" />
                                    

                          </Container>
                          <br/>
                          <Container
                                      header = {
                                        <Header variant="h2">
                                          Use cases
                                        </Header>
                                        
                                      }
                                  >
                                         <ColumnLayout columns={1} variant="text-grid">
                                              <div>
                                                <Header variant="h3">
                                                Rapid Incident Response
                                                </Header>
                                                <Box variant="p">
                                                When performance degrades, quickly pinpoint whether the issue lies in your database, network, or application layer. {configuration["apps-settings"]["application-title"]} consolidates critical metrics on one screen, reducing troubleshooting time.
                                                </Box>
                                              </div>
                                              
                                              <div>
                                                <Header variant="h3">
                                                Hands-On Database Learning
                                                </Header>
                                                <Box variant="p">
                                                Demystify how databases actually work. See performance metrics in context, understand what each number really means for your workloads, and gain practical knowledge about database engine behavior through clear, real-time visualizations.
                                                </Box>
                                              </div>
                                              <div>
                                                <Header variant="h3">
                                                Unified Cross-Region Visibility
                                                </Header>
                                                <Box variant="p">
                                                Break down monitoring silos with our single-pane view of databases spanning multiple regions. Track replication status, compare performance across geographies, and ensure consistent operation of your global database footprint—all without switching between regional consoles.
                                                </Box>
                                              </div>
                                              <div>
                                                <Header variant="h3">
                                                Cross-Account Observability 
                                                </Header>
                                                <Box variant="p">
                                                Monitor your entire database fleet regardless of AWS account boundaries. Gain comprehensive visibility across development, testing, and production environments 
                                                in one unified interface, eliminating blind spots and providing complete organizational database awareness.
                                                </Box>
                                              </div>                                             

                                        </ColumnLayout>
                              </Container>
                              <br/>
                              
                          </div>

          </ContentLayout>
      
      </div>
    
  );
}

export default Home;
