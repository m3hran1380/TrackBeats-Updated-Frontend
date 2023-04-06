import { Routes, Route } from 'react-router-dom';
import { Login } from './components/Login/Login';
import { Home } from './components/Home/Home';
import { LastFM } from './components/LastFM/LastFM';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { PrivateRoutes } from './components/PrivateRoutes';
import { AuthorisationContextProvider } from './components/AuthorisationContextProvider';
import { useState } from 'react';
import { SkeletonTheme } from 'react-loading-skeleton';
import { UserActivity } from './components/UserActivity/UserActivity';


function App() {
  const [lastFMConnected, setLastFMConnected] = useState(false);

  return (
    // Provide the authorisation context to all the nested components
    // using props.children we can pass in all of the included components inside of the <AuthorisationContextProvider> element tags to be included in the context Provider
    
    // SkeletonTheme just provides a theme for all the children skeleton elements.
    <SkeletonTheme baseColor='#313131' highlightColor='#525252'>
      <AuthorisationContextProvider setLastFMConnected={setLastFMConnected}>
        <div className='container'>

          <Navbar/>

          <Routes>
            {/* If user trying to access a private/protected route, check see if they are authenticated and if not send them to login route */}
              <Route element={<PrivateRoutes />}>
                <Route element={<Home lastFMConnected={lastFMConnected}/>} path='/' />
                
                <Route element={<UserActivity/>} path='/activity/:id' />

                {/* potentially temporary */}
                <Route element={<LastFM lastFMConnected={lastFMConnected} setLastFMConnected={setLastFMConnected} />} path="/connect_last_fm" />
              </Route>

              <Route element={<Login />} path="/login" />
          </Routes>

          <Footer lastFMConnected={lastFMConnected}/>
        </div>
      </AuthorisationContextProvider>
    </SkeletonTheme>
  )
}

export default App;
