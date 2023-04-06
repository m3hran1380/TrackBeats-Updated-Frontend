import './userprofile.css';
import Tilt from 'react-parallax-tilt';
import FadeLoader from "react-spinners/FadeLoader";

export const UserProfile = ({ userData }) => {

    let imgSrc;

    if (userData) {
        imgSrc = userData.profile;
    }

    return (
        <Tilt tiltMaxAngleX={5} tiltMaxAngleY={5} >
            <div className='user-pfp'>
                { userData ?
                    <>    
                        <img className='user-pfp-img' referrerPolicy="no-referrer" src={imgSrc} alt='user profile'  />
                        <div className='profile-text'>{userData.firstname}</div>
                    </>
                    :
                    <FadeLoader
                        color="white"
                        loading={userData}
                        size={30}
                        data-testid="loader"
                    /> 
                }
            </div>
        </Tilt>
    )
}