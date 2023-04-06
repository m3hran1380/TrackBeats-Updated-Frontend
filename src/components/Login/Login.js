import React from 'react';
import './login.css';
import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../AuthorisationContextProvider';
import heroImg from '../../assets/athlete-cropped.svg';
import heartIcon from '../../assets/heart.png'
import headphoneIcon from '../../assets/headphone.png'
import weightsIcon from '../../assets/weight.png'


export const Login = () => {

    const { authenticationStatus: auth_status, handleLoginAttempt } = useContext(AuthContext);

    //check see if the user is authenticated already - if so, redirect them to the home page.
    if (auth_status) {
        return <Navigate to="/" />
    }
    else if (auth_status === null)
        return <p>Loading...</p>
    else {
        return (
            <div className='main-content hero-section'>
                <div className='hero-text-section'>
                    <h1>Track your music and running habits now!</h1>
                    <h3>Detailed description of the impact of your music listening habits on your running performance and more!</h3>
                    <div className='icon-container'>
                        <span><img alt='heart icon' src={heartIcon} /></span>
                        <span><img alt='weights icon' src={weightsIcon} /></span>
                        <span><img alt='ehadphones icon' src={headphoneIcon} /></span>
                    </div>
                    <button className='cta-btn' onClick={handleLoginAttempt}>LOG IN WITH STRAVA</button> 
                </div>
                <div className='hero-img-section'>
                    <img src={heroImg} alt="athlete running" />
                </div>
            </div>
        )
    }
}
