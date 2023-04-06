// This component will be used to create private routes which require user to be authenticated
import { useContext } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { AuthContext } from './AuthorisationContextProvider';


export const PrivateRoutes = () => {

    const { authenticationStatus: auth_status } = useContext(AuthContext);

    // check authorisation status of the user
    // the pending stage is added so that the user doesn't get redirected to the login path before we fetch the authentication status of the user from the backend. 

    if (auth_status === null) {
        return <p>Loading...</p>
    }
    else if (auth_status) {
        return <Outlet />
    }
    else {
        return <Navigate to="/login" />
    }

}

