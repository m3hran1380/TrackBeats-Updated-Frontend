import axios from 'axios'
import { decrypt } from './components/Calculations';

// the following function is used to create an axios instance and add the "session_id" to the header if one is present:
// this was a fix for the deployment version of the application.

export const getBackendHttpClient = () => {
    const httpClient = axios.create(
        {
            withCredentials: true,
            baseURL: "http://localhost:5000/"
        }
    )

    // if a session-id exists in the localStorage, decrypt it and then include it in the header:
    if (localStorage.getItem('encrypted_session_id')) {
        const encryptedSSID = localStorage.getItem('encrypted_session_id')
        const decryptedSSID = decrypt(encryptedSSID);
        httpClient.defaults.headers.common['session-id'] = decryptedSSID;
    }

    return httpClient;

}