import { createContext, useState, useEffect, useRef } from 'react';
import { getBackendHttpClient } from '../backendHttpClient';
import { encrypt } from './Calculations';


// this component will return a context provider - the context will include everything to do with user Authentication.
// in this way we wouldn't have to pass in the authentication status and other related functions as props down the component hierarchy
// by wrapping the app component with this, we can provide the authentication context to all the nexted components.
// Furthermore we will have all the authentication related logic in one place

export const AuthContext = createContext(null);

export const AuthorisationContextProvider = ({ setLastFMConnected, children }) => {

    //  There are three states for the user:
    //  they are authenticated - in which case "authentication_status" is equal to True.
    //  their authentication status is pending (i.e., we are still fetching it from back end) in which case "authentication_status" is set to null.
    //  they are not authenticated - in which case "authentication_status" is set to false.

    // at the very start the status is null as we need to first check with the backend API to see whether they are authenticated or not - so status is pending.
    const [authenticationStatus, setAuthenticationStatus] = useState(null);

    // this is to check see whether we are still waiting for the backend to respond after we have sent it the authorisation code to be exchanged for access and refresh tokens.
    const authExchangeStatus = useRef(false);

    useEffect(() => {
        const urlQueryString = window.location.search;
        const urlParameters = new URLSearchParams(urlQueryString);

        // if the user didn't authorise the application, there won't be any code parameter, so we need to check see whether we have received the Auth code
        const stravaAuthorisationCode = urlParameters.get('code');

        const authorisedScope = urlParameters.get('scope');
        

        // check see if the user authorised us with the required scopes - if not don't authenticate them and ask them to connect strava again, this time giving us 
        // authorisation to the required scopes. 
        if (authorisedScope && !authorisedScope.includes("read,activity:read_all,read_all")) {
            console.log("You need to provide us with access to read all your Strava data! Try reauthenticating again.");
            setAuthenticationStatus(false);
            return
        }

        // if we have received an authorisation code, send this code to the backend API so we can exchange it for access and refresh tokens:

        if (stravaAuthorisationCode) {
            authExchangeStatus.current = true;
            const passAuthCode = async () => {
                const httpClient = getBackendHttpClient();
                const response = await httpClient.get('callback', { params: {'code': stravaAuthorisationCode}});
                
                // check see if we had any error - if we didn't set the authentication status to true otherwise set it to false                

                if (!response.data.error) {
                    setAuthenticationStatus(true);

                    // extract the session id;
                    const serverSideSSID = response.data.session_id;
                    const encryptedSSID = encrypt(serverSideSSID);
                    // save this encrypted session id in local storage:
                    localStorage.setItem('encrypted_session_id', encryptedSSID);
                }
                else {
                    setAuthenticationStatus(false)
                }
            }
            passAuthCode();
        }
    }, [setAuthenticationStatus] 
    )

    // Check with backend to see if a user session exists, this is to see if the user is already authenticated or not
    // also check see whether they already have added their LastFM account (because if not they have to be redirected to the connection page)
    useEffect(
        
        () => {(async () => {

            // if we are still waiting for backend to respond to us sending it the authorisation code we shouldn't check the user's authentication status 
            // as it may not have been set yet.

            if (authExchangeStatus.current) return;
            
            const httpClient = getBackendHttpClient();
            const response = await httpClient.get('authentication_status');

            // the backend will provide a responce which is either True if the user session is valid or false if it isn't - we set this response to the status of our authentication state variable.

            setAuthenticationStatus(response.data.result);
            setLastFMConnected(response.data.last_fm_status);

     })()}, [setLastFMConnected, setAuthenticationStatus])


    const handleLoginAttempt = () => {
        const StravaAuthorisationURL = `http://www.strava.com/oauth/authorize?client_id=${process.env.REACT_APP_CLIENT_ID}&response_type=code&redirect_uri=http://localhost:3000/&scope=read_all,activity:read_all`
        window.location.assign(StravaAuthorisationURL);
    }
    

    const handleLogout = async () => {
        // make a call to backend to clear out the server-side user session.
        const httpClient = getBackendHttpClient();
        await httpClient.get('logout');
        // clear out the session id from the localStorage:
        localStorage.removeItem('encrypted_session_id')
        setAuthenticationStatus(false);
    }

    // these are the values and functions we want to make available throughout the application via the authentication context
    const authorisationContextValue = {
        authenticationStatus: authenticationStatus,
        setAuthenticationStatus: setAuthenticationStatus,
        handleLogout: handleLogout,
        handleLoginAttempt: handleLoginAttempt,
    };

    return (

        // for the components to have access to this context, we have to wrap the elements we want inside AuthContext.Provider
        // using the Children we can pass in everything that is included in between the <AuthorisationContextProvider> element tags to be wrapped in the context provider.
        <AuthContext.Provider value={authorisationContextValue}>
            {children}
        </AuthContext.Provider>
    )
    
}