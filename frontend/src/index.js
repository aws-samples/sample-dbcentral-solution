import { render } from "react-dom";
import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

//-- Libraries
import '@cloudscape-design/global-styles/index.css';
import { Amplify } from "aws-amplify";
import { AmplifyProvider, Authenticator } from "@aws-amplify/ui-react";
import { StrictMode } from "react";
import Axios from "axios";

//-- Pages
import Authentication from "./pages/Authentication";
import Home from "./pages/Home";
import SmClustersDSQL from "./pages/Sm-clustersDSQL-01";
import SmDSQL01 from "./pages/Sm-dsql-01";
import SmDSQL02 from "./pages/Sm-dsql-02";
import Logout from "./pages/Logout";

import { AmplifyTheme } from './components/AmplifyTheme';


//-- Components

import ProtectedDb from "./components/ProtectedDb";
import ProtectedApp from "./components/ProtectedApp";
import { applyMode,  Mode } from '@cloudscape-design/global-styles';

if (localStorage.getItem("themeMode") === null ){
    localStorage.setItem("themeMode", "light");
}

if (localStorage.getItem("themeMode") == "dark")
    applyMode(Mode.Dark);
else
    applyMode(Mode.Light);
    


Axios.get(`/aws-exports.json`,).then((data)=>{

    var configData = data.data;
    Amplify.configure({
                    Auth: {
                      region: configData.aws_region,
                      userPoolId: configData.aws_cognito_user_pool_id,
                      userPoolWebClientId: configData.aws_cognito_user_pool_web_client_id,
                    },
    });
                  
    const rootElement = document.getElementById("root");
    render(
      <StrictMode>
        <AmplifyProvider theme={AmplifyTheme}>
          <Authenticator.Provider>
              <BrowserRouter>
                <Routes>
                    <Route path="/" element={<ProtectedApp><Home /> </ProtectedApp>} />
                    <Route path="/authentication" element={<Authentication />} />
                    <Route path="/clusters/dsql/" element={<ProtectedApp><SmClustersDSQL /> </ProtectedApp>} />
                    <Route path="/dsql/single/" element={<ProtectedApp><SmDSQL01 /> </ProtectedApp>} />
                    <Route path="/dsql/cluster/" element={<ProtectedApp><SmDSQL02 /> </ProtectedApp>} />
                    <Route path="/logout" element={<ProtectedApp><Logout /> </ProtectedApp>} />
                </Routes>
              </BrowserRouter>
          </Authenticator.Provider>
        </AmplifyProvider>
      </StrictMode>,
      rootElement
    );

})
.catch((err) => {
    console.log('API Call error : ./aws-exports.json' );
    console.log(err)
});
              
              

