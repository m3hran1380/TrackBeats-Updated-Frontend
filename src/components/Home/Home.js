import './home.css';
import { useState, useEffect, useContext, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { getBackendHttpClient } from '../../backendHttpClient';
import { AuthContext } from '../AuthorisationContextProvider';
import { ActivityGridElement } from '../ActivityGridElements/ActivityGridElement';
import { ActivityCardSkeleton } from '../ActivityGridElements/ActivityCardSkeleton';
import { Paginator } from '../Paginator';
import { UserProfile } from '../UserProfile/UserProfile';
import { Filter } from '../Filter/Filter';


export const Home = ({ lastFMConnected }) => {

    const {setAuthenticationStatus} = useContext(AuthContext);

    const [userData, setUserData] = useState();
    const [userActivities, setUserActivities] = useState();
    const [filteredUserActivities, setFilteredUserActivities] = useState();
    const [currentPageActivities, setCurrentPageActivities] = useState();
    // following state keeps track of currently displayed page on UI
    const [pageNumber, setPageNumber] = useState(1);  

    // this would allow us to render a loading spinner while the user data is being fetched. 
    const stravaFetchingStatus = useRef(false);

    // following two variables are references to the increment and decrement icons:
    const incrementArrow = useRef();
    const decrementArrow = useRef();
    const paginationCounter = useRef();

    // following are state variables that handle the values of the filter form:
    const [filterCriteria, setFilterCriteria] = useState({searchTitle: '', minDistance: '', maxDistance: ''})
    const [searchDates, setSearchDates] = useState({startDate: '', endDate: ''});
    const [epochDates, setEpochDates] = useState({epochStartDate: '', epochEndDate: ''});

    // retrieve user's profile data (from Strava) 
    useEffect(
        () => {
            if (lastFMConnected) {
                (async () => {
                    const httpClient = getBackendHttpClient();
                    const response = await httpClient.get('get_user_profile_data');
                    // if for whatever reason we can't retrieve the user's data, log the user out and force them to log back in.
                    if (response.data.error_status) {
                        await httpClient.post('logout');
                        setAuthenticationStatus(false);
                    }
                    setUserData(response.data.athlete_data);
                })();
            }
        }, [setUserData, setAuthenticationStatus, lastFMConnected]
    )

    // retrieve user's activity data (from Strava)
    useEffect(
        () => {
            if (lastFMConnected) {

                // set the pagination buttons to disabled to prevent the user changing page number while data is getting fetched:
                incrementArrow.current.classList.add('disabled');
                decrementArrow.current.classList.add('disabled');
                paginationCounter.current.classList.add('disabled');

                // set the fetch status to true - it gets set to false once the async func is finished executing
                stravaFetchingStatus.current = true;

                (async () => {
                    const httpClient = getBackendHttpClient();
                    const response = await httpClient.get('get_user_activity_data', { params: {'start_date': epochDates.epochStartDate, 'end_date': epochDates.epochEndDate}})
                    // if for whatever reason we can't retrieve the user's data, log the user out and force them to log back in.
                    if (response.data.error_status) {
                        await httpClient.post('logout');
                        setAuthenticationStatus(false);
                    }
                    setUserActivities(response.data.athlete_running_data);

                    // after retreiving the data remove the disabled class from the pagination arrows and counter.
                    incrementArrow.current.classList.remove('disabled');
                    decrementArrow.current.classList.remove('disabled');
                    paginationCounter.current.classList.remove('disabled');
                    stravaFetchingStatus.current = false;
                })();
            }
        }, 
        [lastFMConnected, setAuthenticationStatus, epochDates]
    )
    
    // handle page increments
    useEffect( 
        () => {
            if (lastFMConnected) {
                // if we are on page number 1, disable the page decrement button
                (pageNumber === 1) ? decrementArrow.current.classList.add('disabled') : decrementArrow.current.classList.remove('disabled');

                if (filteredUserActivities) {
                    // calculate total number of pages we are going to have - remember, we are only displaying 8 activities per page:
                    const totalNumOfPages = Math.ceil(filteredUserActivities.length / 8);
   
                    // check see if we are on the last page or if there are no activities to display, if so set the next button to disabled
                    
                    if (pageNumber === totalNumOfPages) { 
                        incrementArrow.current.classList.add('disabled');
                    }
                    else {
                        incrementArrow.current.classList.remove('disabled');
                    }

                    if (!filteredUserActivities.length) {
                        incrementArrow.current.classList.add('disabled');
                        decrementArrow.current.classList.add('disabled');
                        paginationCounter.current.classList.add('disabled');
                    }
                    else {
                        paginationCounter.current.classList.remove('disabled');
                    }
    
                                        
                    const startIndex = (pageNumber - 1) * 8;
                    const endIndex = startIndex + 8;
                    setCurrentPageActivities(filteredUserActivities.slice(startIndex, endIndex));

                }
            }
        },
        [pageNumber, filteredUserActivities, lastFMConnected]
    )

    // handle filter functionalities:
    useEffect(
        () => {
            if (userActivities) {
                let filteredActivities = [...userActivities];
                if (filterCriteria.searchTitle) {
                    filteredActivities = filteredActivities.filter((activity) => {
                        return activity.name.toLowerCase().includes(filterCriteria.searchTitle.toLowerCase());
                    })
                }
                if (filterCriteria.minDistance) {
                    filteredActivities = filteredActivities.filter((activity) => {
                        return activity.distance > filterCriteria.minDistance
                    })
                }
                if (filterCriteria.maxDistance) {
                    filteredActivities = filteredActivities.filter((activity) => {
                        return activity.distance < filterCriteria.maxDistance
                    })
                }
                setFilteredUserActivities(filteredActivities);
            }
        }, 
        [filterCriteria, userActivities, setFilteredUserActivities]
    )

    
    const handleSearchSubmit = (e) => {
        e.preventDefault();
        
        if (searchDates.startDate) { 
            const startDateEpoch = parseInt(searchDates.startDate.getTime().toString().slice(0, 10));
            setEpochDates({...epochDates, epochStartDate: startDateEpoch});
            stravaFetchingStatus.current = true;
        }

        if (searchDates.endDate) { 
            const endDateEpoch = parseInt(searchDates.endDate.getTime().toString().slice(0, 10));
            setEpochDates((currentEpochDates) => ({...currentEpochDates, epochEndDate: endDateEpoch}));
            stravaFetchingStatus.current = true;
        }
    }

    const handleIncrement = () => {
        // if the arrow is set to disabled don't increment the page number.
        if (incrementArrow.current.classList.contains('disabled')) { return }
        setPageNumber((currentPageNumber) => currentPageNumber + 1);
    }

    const handleDecrement = () => {
        // if the arrow is set to disabled don't decrement the page number.
        if (decrementArrow.current.classList.contains('disabled')) { return }
        setPageNumber((currentPageNumber) => currentPageNumber - 1);
    }

    if (lastFMConnected) {
        return(
            <div className='home-container-glow'>

                <div className='user-section'>
                    <UserProfile userData={userData}/>                         
                    <div className='user-details'></div>
                </div>

                <div className='activity-container'>                    
                    <div className='activity-section'>
                        <h2 className='activity-title'>Recent Strava Activities</h2>
                        
                        {/* display a loading spinner while we are getting the user's data */}
                        <div className='activity-grid'>
                            {(!currentPageActivities || stravaFetchingStatus.current) ?
                                <ActivityCardSkeleton cards={8} />
                                :
                                <>
                                    {currentPageActivities.length ? 
                                        currentPageActivities.map((activity) => (
                                        <ActivityGridElement key={activity.id} activity={activity}/>
                                        )) 
                                    :
                                        <div className='no-activity-prompt'><p>No Activities Found!</p></div>
                                    }
                                </>
                            }
                        </div>

                        <Paginator 
                            incrementArrow={incrementArrow} 
                            decrementArrow={decrementArrow} 
                            pageNumber={pageNumber} 
                            paginationCounter={paginationCounter} 
                            handleDecrement={handleDecrement} 
                            handleIncrement={handleIncrement}
                        />
                        
                    </div>
                            
                    <Filter epochDates={epochDates}
                            setEpochDates={setEpochDates} 
                            stravaFetchingStatus={stravaFetchingStatus}
                            filterCriteria={filterCriteria}
                            setFilterCriteria={setFilterCriteria}
                            handleSearchSubmit={handleSearchSubmit}
                            searchDates={searchDates} setSearchDates={setSearchDates}
                    />

                </div>
            </div>
        )
    }
    else {
        return <Navigate to="/connect_last_fm" />
    }



}


