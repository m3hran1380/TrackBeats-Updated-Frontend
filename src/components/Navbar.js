import { NavLink, Link } from 'react-router-dom';
import { useContext, useState, useEffect } from 'react';
import { AuthContext } from './AuthorisationContextProvider';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBars, faX } from '@fortawesome/free-solid-svg-icons'


export const Navbar = () => { 
    const { authenticationStatus: auth_status, handleLogout } = useContext(AuthContext);
    const [navClosed, setNavClosed] = useState(true);
    const [viewportWidth, setViewportWidth] = useState(window.innerWidth);

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
  
    return (
        <nav className="navbar">
            <div className='logo'><NavLink to="/">TrackBeats</NavLink></div>

            {(viewportWidth > 850) ?
                <div className='other-nav-links'>
                    <NavLink to="#">ABOUT</NavLink>
                    <NavLink to="#">CONTACT</NavLink>
                    {auth_status && <Link onClick={handleLogout}>LOGOUT</Link>} 
                </div>
            :   
            <>
                <div className='burger-icon'>
                    {(navClosed) ?
                        <span onClick={() => {setNavClosed(false)}}> 
                            <FontAwesomeIcon icon={faBars}/>
                        </span>
                    :
                        <span onClick={() => {setNavClosed(true)}}> 
                            <FontAwesomeIcon icon={faX}/>
                        </span>
                    }
                </div>

                { !navClosed ? 
                    <div className='navbar-hamburger-page'>
                        <NavLink to="#">ABOUT</NavLink>
                        <NavLink to="#">CONTACT</NavLink>
                        {auth_status && <Link onClick={ () => {handleLogout(); setNavClosed(true) }}>LOGOUT</Link>} 
                    </div>

                    :
                    <></>
                }
            </>
            }
        </nav>
    )

}