import { useState, useEffect, useRef } from 'react'
import Axios from 'axios';
import TopNavigation from '@cloudscape-design/components/top-navigation';
import { Authenticator } from "@aws-amplify/ui-react";
import { configuration } from '../pages/Configs';
import { applyMode,  Mode } from '@cloudscape-design/global-styles';
import Button from "@cloudscape-design/components/button";
import Modal from "@cloudscape-design/components/modal";
import Box from "@cloudscape-design/components/box";
import SpaceBetween from "@cloudscape-design/components/space-between";
import FormField from "@cloudscape-design/components/form-field";
import TokenInput01  from '../components/TokenInput01';




export default function App() {

    const [visibleModal, setVisibleModal] = useState(false);
    
    const [templateJson,setTemplateJson] = useState({
                        accounts: [],
                        regions: []     
    });
    var  templateJsonCurrent = useRef({
                        accounts: [],
                        regions: []     
    });


    const i18nStrings = {
      searchIconAriaLabel: 'Search',
      searchDismissIconAriaLabel: 'Close search',
      overflowMenuTriggerText: 'More',
      overflowMenuTitleText: 'All',
      overflowMenuBackIconAriaLabel: 'Back',
      overflowMenuDismissIconAriaLabel: 'Close menu',
    };

    const profileActions = [            
      {
        type: 'menu-dropdown',
        id: 'preferences',
        text: 'Preferences',
        items: [
          { type: 'button', id: 'profile', text: 'Profile' },
          { type: 'button', id: 'themeDark', text: 'Theme Dark' },
          { type: 'button', id: 'themeLight', text: 'Theme Light'},          
        ]
      },
      {
        type: 'menu-dropdown',
        id: 'support-group',
        text: 'Support',
        items: [
          {id: 'documentation',text: 'Documentation'},
          { id: 'feedback', text: 'Feedback' },          
          { type: 'button', id: 'profile', text: 'Version : ' + configuration["apps-settings"]["release"]},
        ],
      }
    ];
    
    

    //-- Add Header Cognito Token
    Axios.defaults.headers.common['x-token-cognito'] = sessionStorage.getItem("x-token-cognito");
    Axios.defaults.withCredentials = true;
    


    //--## Handle click menu
    const handleClickMenu = ({detail}) => {
        
      switch (detail.id) {
        
        case 'themeDark':
            applyMode(Mode.Dark);
            localStorage.setItem("themeMode", "dark");
            break;
          
        case 'themeLight':
              applyMode(Mode.Light);
              localStorage.setItem("themeMode", "light");
              break;
        
        case 'profile':
              setVisibleModal(true);
              break;
          
        
      }

    };


    //--## Handle save profile
    const handleClickSave= () => {            
      updateProfileInfo();
    };


    //--## Handle show profile
    const handleClickShowModal= () => {            
      setVisibleModal(true);
    };


    //-- Get profile information
    async function getProfileInfo (){
          
      var params = {
              userId : sessionStorage.getItem("x-user-cognito")
      };
  
      await Axios.get(`${configuration["apps-settings"]["api_url"]}/api/aws/user/profile/get/`,{
          params: params
          }).then((data)=>{                   
              
              templateJsonCurrent.current = data.data.result;
              console.log(data.data.result);
              setTemplateJson(data.data.result);     

              
          })
          .catch((err) => {
                console.log('Timeout API Call : /api/aws/user/profile/get/' );
                console.log(err);    
                templateJsonCurrent.current = {
                  accounts: [],
                  regions: []     
                };  
                setTemplateJson({
                  accounts: [],
                  regions: []     
                });
          });          
  
    }



    //-- Update profile information
    async function updateProfileInfo (){
      
      var params = {
              userId : sessionStorage.getItem("x-user-cognito"),
              profile : templateJsonCurrent.current
      };
  
      await Axios.get(`${configuration["apps-settings"]["api_url"]}/api/aws/user/profile/update/`,{
          params: params
          }).then((data)=>{                                 
              
              setTemplateJson(data.data.result); 
              setVisibleModal(false);           
              
          })
          .catch((err) => {
                console.log('Timeout API Call : /api/aws/user/profile/update/' );
                console.log(err);                
          });          
  
    }





     //--##  Page loader
     useEffect(() => {
          getProfileInfo();
      }, []);



  return (
    
    <Authenticator >
          {({ signOut, user }) => (
            <div id="h" style={{ position: 'sticky', top: 0, zIndex: 1002 }}>
                <TopNavigation
                  i18nStrings={i18nStrings}
                  identity={{
                    href: '/',
                    title:  configuration['apps-settings']['application-title'] + " Solution"
                  }}
                  
                  utilities={[                    
                    { type: 'button', iconName: 'settings', title: 'Settings', ariaLabel: 'Settings', onClick : handleClickShowModal },
                    {
                      type: 'menu-dropdown',
                      text:  user.signInUserSession.idToken.payload.email /* "myuser@example.com" */,
                      iconName: 'user-profile',
                      items: profileActions,
                      onItemClick : handleClickMenu
                    },
                    {
                      type: 'button',
                      text: 'Sign out',
                      onClick : signOut,
                      variant : "primary-button"
                    },
                  ]}
                />

                <Modal
                      onDismiss={() => setVisibleModal(false)}
                      visible={visibleModal}                      
                      footer={
                        <Box float="right">
                          <SpaceBetween direction="horizontal" size="xs">
                            <Button variant="link" onClick={() => {setVisibleModal(false);}} >Cancel</Button>
                            <Button variant="primary" onClick={handleClickSave}>Save</Button>
                          </SpaceBetween>
                        </Box>
                      }                      
                      header="Profile management"                      
                      >
                          <div> 
                         <FormField label={"Accounts"}>
                                <TokenInput01 
                                      label=""
                                      value={templateJson['accounts']}                                      
                                      onChange={({ detail }) => {               
                                        setTemplateJson({...templateJson,accounts : detail.value});
                                        templateJsonCurrent.current['accounts'] = detail.value;                                              
                                                                                                                                              
                                      }}            
                                      placeholder="1234567890,0987654321"
                                      description={"Press Enter or use commas to add multiple accounts"}       
                                      limit={3}                                      
                                  />    
                        </FormField>
                        <br/>
                        <FormField label={"Regions"}>
                                <TokenInput01 
                                      label=""
                                      value={templateJson['regions']}                                      
                                      onChange={({ detail }) => {               
                                        setTemplateJson({...templateJson,regions : detail.value});
                                        templateJsonCurrent.current['regions'] = detail.value;                                              
                                                                                                                                              
                                      }}            
                                      placeholder="us-east-1,us-east-2"
                                      description={"Press Enter or use commas to add multiple regions"}    
                                      limit={3}                                                                               
                                  />    
                            </FormField>
                          </div>                          
                      </Modal>

            </div>        
        
          )}
          
    </Authenticator>

      

  );
}



    
                                                