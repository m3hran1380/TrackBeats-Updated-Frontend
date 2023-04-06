import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { getBackendHttpClient } from '../../backendHttpClient'
import backgroundEffect from '../../assets/last-fm/bg-casset-effect.svg';
import './lastfm.css';
import BeatLoader from "react-spinners/BeatLoader";


export const LastFM = ({ lastFMConnected, setLastFMConnected }) => {

    const originalMessage = 'Connect your Last.Fm account by typing it in the field below.'

    const [lastfmUsername, setlastfmUsername] = useState();
    // this state will be used to conditionally render a loading spinner when we send a request to the backend after the user enters their username
    const [lastFmPending, setLastFmPending] = useState(false);
    const [viewportWidth, setViewportWidth] = useState(window.innerWidth);
    const [messageToDisplay, setMessageToDisplay] = useState(originalMessage);


    // following useEffect is used to set the viewport width when the user resizes the window.
    useEffect(() => {
      const handleResize = () => {
        setViewportWidth(window.innerWidth);
      }
      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }, []);


    const handleInput = (e) => {
        setlastfmUsername(e.currentTarget.value);
    }

    const handleSubmit = (e) => {
        e.preventDefault();

        // send the submitted lastFM username to the back-end so it can be stored in the user-session and to retrieve user's LastFM data:
        
        const sendLastFM = async () => {
            const httpClient = getBackendHttpClient();
            const response = await httpClient.get('retrieve_lastfm', { params: {'username': lastfmUsername}});
            
            // implement this error handling properly later
            if (response.data.error) {
                setMessageToDisplay('Please enter a valid LastFm username.');
                setLastFmPending(false);
                return;
            }
            // if there were no error generated from the backend, set the pending status to False and also set the LASTFM connection status to True
            // this will redirect the user to the home page.
            setLastFmPending(false);
            setLastFMConnected(true);
        }
        sendLastFM();
        setLastFmPending(true);
    }   

    console.log(messageToDisplay);

    
    if (lastFMConnected) {
        return <Navigate to="/" />
    }
    else {
        return (
            <div className='last-fm-prompt-container'>
                <div className='casset-hero'>
                    <img src={backgroundEffect} alt="prompt asking user to connect their LastFM account" />
                </div>

                <div className='last-fm-form-container'>

                    {!lastFmPending ? 
                    
                        <form onSubmit={handleSubmit} className='last-fm-form'>
                            <p className='prompt'>{messageToDisplay}</p>
                            <input onChange={handleInput} autoFocus type='text' required />
                            <button type='submit'>ADD ACCOUNT</button>
                        </form>
                    :
                        <>
                        {/* if user has submitted their username, whilst we are sending it to backend to verify it, a loading spinner should be rendered. */}
                            <form onSubmit={handleSubmit} className='last-fm-form'>
                                <p className='prompt'>Checking if the username is valid ...</p>
                                <input type='text' disabled />
                                <button className='btn-submitted' disabled type='submit'>ADD ACCOUNT</button>
                            </form>

                            <BeatLoader
                                color="black"
                                loading={lastFmPending}
                                size={(viewportWidth > 650) ? 30 : 20}
                                aria-label="Loading Spinner"
                                data-testid="loader"
                                className='lastfm-loading-spinner'
                            />
                        </>
                    }

                </div>
            </div>
        )
    }
}


