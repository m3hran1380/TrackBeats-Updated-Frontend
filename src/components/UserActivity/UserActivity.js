import './useractivity.css';
import '../Home/home.css'
import { avgPace, avgSpeed, findIndex } from "../Calculations";
import Map, { Layer, Source, Marker } from 'react-map-gl';
import { useParams, useNavigate } from 'react-router-dom';
import { getBackendHttpClient } from '../../backendHttpClient'
import { useEffect, useState, useRef, useCallback } from 'react'; 
import * as turf from "@turf/turf";
import FadeLoader from "react-spinners/FadeLoader";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFlagCheckered, faTrafficLight, faArrowsToDot, faPersonRunning, faAngleDown, faAngleUp } from '@fortawesome/free-solid-svg-icons'
import { UserActivityMusicInforCard } from '../InformationCards/UserActivityMusicInfoCard';
import { MusicCarousel } from '../MusicCarousel/MusicCarousel';
import { SpeedChart } from '../SpeedChart';
import { MousePositionInfoCard } from '../InformationCards/MousePositionInfoCard';
import { BasicActivityInfoCard } from '../InformationCards/BasicActivityInfoCard';
import { MusicInformationCard } from '../InformationCards/MusicInformationCard';


export const UserActivity = () => {
    
    const navigate = useNavigate()
    
    // retrieve the activity and lastFm data corresponding to this particular running activity:
    // Strava activity ID:
    const { id } = useParams();
    const [routeData, setRouteData] = useState();
    const [activityData, setActivityData] = useState();
    const [musicData, setMusicData] = useState();
    const [detailedMusicData, setDetailedMusicData] = useState();
    const [activityStreamsData, setActivityStreamsData] = useState();
    const [musicRoutes, setMusicRoutes] = useState();
    const [activityTimes, setActivityTimes] = useState();
    const [displayMusicRoutes, setDisplayMusicRoutes] = useState(false);
    const [mapboxLayerIds, setMapboxLayerIds] = useState(false);
    const [pathPaint, setPathPaint] = useState();
    const [displayMusicInfoCard, setDisplayMusicInfoCard] = useState(false);
    const [musicInfoCardInvisible, setMusicInfoCardInvisible] = useState(false);
    const [musicCardInfoIndex, setMusicCardInfoIndex] = useState();
    const [musicTrackDataStreams, setMusicTrackDataStreams] = useState();
    const [mouseOut, setMouseOut] = useState(false);
    const [activeSlideIndex, setActiveSlideIndex] = useState();
    const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0);
    // the following state holds the latitude/longitude cords of the position that the user's mouse is hovering on
    // on the speed chart.
    const [mouseMapPosition, setMouseMapPosition] = useState();
    const [displayMousePositionInfoCard, setDisplayMousePositionInfoCard] = useState(false);
    const [spotifyData, setSpotifyData] = useState();
    const [displayMoreInformation, setDisplayMoreInformation] = useState(false);
    const [viewportWidth, setViewportWidth] = useState(window.innerWidth);
    const mapRef = useRef();
    const calculatedMusicDurations = useRef([]);
    const fetchingMusicData = useRef(true);

    // initialise variables used to display the runner's running path + adjust the map size to the route size:
    let routeLineString, minLng, minLat, maxLng, maxLat, centreLng, centreLat, startLng, startLat, endLng, endLat;

    // following function returns style object to be used to style the layers on the map.
    const getMusicRouteStyle = useCallback(() => {
        const randColour = generateRandColour();
        return [
            {
                'line-color': randColour,
                'line-width': 10
            }
            , randColour];
        }, [])

    // this function generates random colors:
    const generateRandColour = () => {
        const r = Math.floor(Math.random() * 256); 
        const g = Math.floor(Math.random() * 256); 
        const b = Math.floor(Math.random() * 256);
        return `rgba(${r},${g},${b},0.6)`
    }
    

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

    // Following useEffect retrieves the data associated with the selected activity
    useEffect(() => {
        (async () => {
            const httpClient = getBackendHttpClient();
            const response = await httpClient.get('get_activity_strava_data', { params: {'activity_id': id}});
            // if for whatever reason we can't retrieve the data, send them back to the home page
            if (response.data.error_status) {
                navigate('/');
            }
            const retrievedactivityData = response.data.activity_data;

            // reverse the order of latitude and longitude coordinates in the returned array - Google uses lat-lng ordering whereas GeoJson uses lng-lat ordering:
            response.data.activity_streams.latlng.data = response.data.activity_streams.latlng.data.map((coordinatePair) => {
                return [coordinatePair[1], coordinatePair[0]];
            })
            // set activity data:
            setActivityData(retrievedactivityData);
            // set routeData - routeData contains the latitude longitude values of the entirety of the route taken by the user
            setRouteData(response.data.activity_streams.latlng.data);
            setActivityStreamsData(response.data.activity_streams);
        })();

    }, [setRouteData, setActivityData, setActivityStreamsData, navigate, id]);


    // the following useEffect gets the music tracks that were listened to by the user during this particular running activity
    useEffect(() => {
        (async () => {
            const httpClient = getBackendHttpClient();
            const response = await httpClient.get('get_activity_music_data', { params: {'activity_id': id}});
            // if for whatever reason we can't retrieve the data, send them back to the home page
            if (response.data.error_status) {
                navigate('/');
            }
            setMusicData(response.data.music_data);
            setActivityTimes(response.data.activity_times);
            fetchingMusicData.current = false; 
        })();
    }, [setMusicData, navigate, setActivityTimes, id]);    
    

    // the following useEffect will create LineString geoJson objects representing the path taken by the user during 
    // the music tracks that were streamed throughout the activity.
    // It also extracts the relevant data streams (e.g., velocity stream) specific to each of the music tracks. 
    useEffect(() => {
        let musicRoutes = [];
        let musicVelocities = [];
        let musicTimes = [];
        const detailedMusicInfo = [];

        if ((musicData && activityStreamsData)) {
            musicData.forEach((trackInfo, index) => {
                // get the elapsed time (in seconds) since start of activity to start of the music track:
                // if song started before the start of the activity set it's start time to the start time of the activity
                
                let startElapsedTime;
                let endElapsedTime;

                if (trackInfo.date.uts < activityTimes.startTime) {
                    startElapsedTime = 0;
                }
                else { 
                    startElapsedTime = trackInfo.date.uts - activityTimes.startTime;
                }

                // get elapsed time (in seconds) since start of activity to end of the music track:
                const trackDuration = (trackInfo.duration / 1000);
                // some music tracks don't have duration info on them - for these we will assume that the track ends before the next song starts
                // or if it's the last track being played, we will assume the end of the track coincides with the end of the journey.
                
                if (!trackDuration) {
                    // the array holds the music tracks in a reverse order - so if the index is 0 it is the last track being played.
                    !index ?
                        // if we don't have the duration of the song and it's the last song, assume it's end time coincides with the end of the running activity.
                        endElapsedTime = activityTimes.endTime - activityTimes.startTime
                    :
                        // if the song is not the last song being played, assume it's end time coincides with the start time of the next song
                        endElapsedTime = musicData[index - 1].date.uts - activityTimes.startTime
                }
                else {
                    // if the track does have duration data, we obtain the end elapsed time by adding the duration to start time
                    // but since it's possible for the user to have changed the music before the music coming to an end we first
                    // need to check to ensure the end time of the song does not exceed the start time of next song.
                    
                    // also check see if the song is not the last song (as the last song has no song coming after it so it won't exceed their start time):
                    // if its the last song, we need to check whether the song duration exceeds end of the running activity - if it does we need to use
                    // end of running activity as end of the song.
                    if (index) {
                        const nextSongStartTime = musicData[index - 1].date.uts - activityTimes.startTime;
                        endElapsedTime = (startElapsedTime + trackDuration) > nextSongStartTime ? 
                            nextSongStartTime
                            :
                            startElapsedTime + trackDuration
                    }
                    else {
                        endElapsedTime = ((startElapsedTime + trackDuration) > (activityTimes.endTime - activityTimes.startTime)) ?
                            activityTimes.endTime - activityTimes.startTime 
                        :
                            startElapsedTime + trackDuration; 
                    }  
                }
                // calculate the music duration based on start and end elapsed time and add the value to the musicDuration ref.
                const musicDuration = endElapsedTime - startElapsedTime;
                calculatedMusicDurations.current[index] = musicDuration;

                // Now use the start and end elapsed times to find their position in the times streams we retrieved from Strava:
                // if there is no exact match we want to return the index of the closest matching entry in the streams array.
                // Since the streams array is sorted we can use a binary search algorithm (this is faster than the pre-built methods such as indexOf)            
                                
                const time_stream = activityStreamsData.time.data; 
                const startStreamIndex = findIndex(time_stream, startElapsedTime); 
                const endStreamIndex = findIndex(time_stream, endElapsedTime);
                
                // use the indexes to extract the corresponding segment of the time stream data for the track:
                const music_time_stream = activityStreamsData.time.data.slice(startStreamIndex, endStreamIndex + 1);
                musicTimes.push(music_time_stream);

                // use the indexes to extract the corresponding segment of the latitude_longitude stream data for the track:
                const music_latitude_longitude_stream = activityStreamsData.latlng.data.slice(startStreamIndex, endStreamIndex + 1);

                // use the indexes to extract the corresponding segment of the smooth_velocity stream data for the track:
                const music_velocity_stream = activityStreamsData.velocity_smooth.data.slice(startStreamIndex, endStreamIndex + 1);
                musicVelocities.push(music_velocity_stream);

                if (music_latitude_longitude_stream.length) {
                    // create GeoJson LineString objects representing the route during which this particular music track was being listened to.
                    const musicRouteLineString = turf.lineString(music_latitude_longitude_stream);
                    musicRoutes.push([trackInfo, musicRouteLineString])
                }
                // measure average speed and pace during the song:
                if (music_velocity_stream.length) {
                    const averageVelocityDuringMusic = avgSpeed(music_velocity_stream);
                    const [minPerKM, remainingSeconds] = avgPace(averageVelocityDuringMusic);
                    const highestSpeed = Math.max(...music_velocity_stream);

                    const detailedMusicObj = {
                        music: trackInfo,
                        avgSpeed: averageVelocityDuringMusic,
                        avgPace: [minPerKM, remainingSeconds],
                        highestSpeed: highestSpeed
                    }

                    detailedMusicInfo.push(detailedMusicObj)
                }
            })
        }
        if (detailedMusicInfo.length) {
            setDetailedMusicData(detailedMusicInfo);
        }
        if (musicRoutes.length) {
            setMusicRoutes(musicRoutes);
            const stylesArray = [];
            // generate styles for the layers that will represent the music routes:
            musicRoutes.map(() => stylesArray.push(getMusicRouteStyle()));

            setPathPaint(stylesArray);
        }
        if (musicVelocities.length && musicTimes.length) {
            setMusicTrackDataStreams({'velocity': musicVelocities, 'time': musicTimes});
        }

    }, [musicData, activityData, setMusicRoutes, activityStreamsData, activityTimes, getMusicRouteStyle])

    // the following useEffect is used to obtain an array of Mapbox layer ids - this is used to implement the hover effect:
    useEffect(()=> {
        if (musicRoutes && displayMusicRoutes) {
            let layerIdArray = [];
            for (let i=0; i<musicRoutes.length; i++) {
                layerIdArray.push(`music_route_${i}`)
            }
            setMapboxLayerIds(layerIdArray);
        }
        else {
            setMapboxLayerIds(false);
        }
    }, [setMapboxLayerIds, musicRoutes, displayMusicRoutes]
    )

    // the following useEffect retrieves the music genres and similar music to each of the song tracks played during the activity:
    // it does this via a call to the backend - the backend retrieves these data using the spotify API
    useEffect(() => {
        if (musicData) {
            (async () => {
                const httpClient = getBackendHttpClient();
                const response = await httpClient.get('get_music_artist_data', { params: {'activity_id': id}});
                // if for whatever reason we can't retrieve the data, send them back to the home page
                if (response.data.error_status) navigate('/');
                // set the value of the state holding the retrieved spotify data:
                setSpotifyData(response.data);
            })();
        }
    }, [musicData, id, setSpotifyData, navigate])


    // if we have retrieved the activity route data, calculate the coordinates of the midpoint of the activity
    // so that the initial position of the map can be set accordingly.
    if (routeData) {
        // assign start and end Lat Lng:
        startLng = routeData[0][0];
        startLat = routeData[0][1];
        endLng = routeData[routeData.length - 1][0];
        endLat = routeData[routeData.length - 1][1];

        // create a geoJson linestring representing the path taken by the runner
        routeLineString = turf.lineString(routeData);
        // get the minimum bounding box around the path:
        [minLng, minLat, maxLng, maxLat] = turf.bbox(routeLineString);

        // calculate the coordinates of the centre of the rectangle to position the map accordingly
        centreLng = ((minLng + maxLng) / 2);  
        centreLat = ((minLat + maxLat) / 2);  
    }

    // upon the map loading in, adjust the map view so that it fits to the entire activity route taken by the user. 
    const adjustMapView = () => {
        mapRef.current.fitBounds([[minLng, minLat], [maxLng, maxLat]], {padding: 40, duration: 500});
    }
    
    // define the styling to be used to display the runner's path:
    const layerStyle = {
        id: "path_route",
        type: "line",
        paint: {
            'line-color': "#F48024",
        }
    };

    // following function gets called when user moves mouse over the map
    // it then checks to see if the user is hovering over any of our layers (specified by mapboxLayerIds array)
    // if so, it highlights that layer that is being hovered on. 
    const handleMouseMove = (e)=>{
        if (displayMusicRoutes) {
            const feature = mapRef.current.queryRenderedFeatures(e.point, {layers: mapboxLayerIds})
            if (feature.length) {
                const index = parseInt(e.features[0].layer.id.slice(12));
                // set all the paths to their normal colours first
                resetPathColours();
                // then set the currently hovered on path to white and make the path line slightly thicker.
                highlightPath(index);
                // display the info box showing currently hovered song details
                setMusicCardInfoIndex({index: index});
            }
        }
    }

    // following function handles mouse click on music paths
    const handleMouseClick = (e) => {
        // find the feature that was clicked on - only query the features whose layerId is within the mapboxLayerIds list
        const feature = mapRef.current.queryRenderedFeatures(e.point, {layers: mapboxLayerIds})
        
        // if user clicked on a feature whose id is within the list - i.e., if they clicked on a music path - then set
        // the index of that particular path as the activeSlideIndex - this will cause the MusicCarousel to move to the particular
        // music that was clicked on. 
        if (feature.length && mapboxLayerIds) {
            const index = parseInt(e.features[0].layer.id.slice(12));
            setActiveSlideIndex(index);
        }
    }


    // i used useCallback to create memoized functions - this is because i have used these functions in useEffect and 
    // they are in the useEffect dependency array - so without this, we would have infinite loop as the functions would get re-defined on every re-render

    // this function resets all the music path styles back to their normal styles.
    const resetPathColours = useCallback(() => {
        // set all the layers back to their normal colours.

        setPathPaint((currentColour) => {
            for (let i=0; i<musicRoutes.length; i++) {
                currentColour[i][0] = {'line-color': currentColour[i][1], 'line-width': 10};
            }
            return currentColour;
        });
    }, [setPathPaint, musicRoutes]);


    // this function highlights the music path with the provided index
    const highlightPath = useCallback((index) => {
        setPathPaint((currentColour) => {
            currentColour[index][0] = {'line-color': 'white', 'line-width': 15};
            return currentColour;
        });
    }, [setPathPaint])

    return (
        <div className='individual-activity-container home-container-glow'>
            { fetchingMusicData.current ? <div className='music-info-spinner'><FadeLoader color="white" size={30} data-testid="loader" /></div>  : 
            <div className='activity-info-section'>
                {musicData.length ? 
                    <>
                        { musicTrackDataStreams ? 
                        <>
                            <MusicCarousel highlightPath={highlightPath} displayMusicRoutes={displayMusicRoutes} setCurrentCarouselIndex={setCurrentCarouselIndex}
                            setMusicCardInfoIndex={setMusicCardInfoIndex} resetPathColours={resetPathColours} detailedMusicData={detailedMusicData} mouseOut={mouseOut}
                            musicTrackDataStreams={musicTrackDataStreams} activeSlideIndex={activeSlideIndex} setActiveSlideIndex={setActiveSlideIndex} viewportWidth={viewportWidth}/>
                            
                            { (!displayMoreInformation) ? 
                            <>
                                <SpeedChart detailedMusicData={detailedMusicData} activeSlideIndex={activeSlideIndex} musicTrackDataStreams={musicTrackDataStreams} pathPaint={pathPaint}
                                activityStreamsData={activityStreamsData} setMouseMapPosition={setMouseMapPosition} setMusicCardInfoIndex={setMusicCardInfoIndex} 
                                displayMusicInfoCard={displayMusicInfoCard} setDisplayMousePositionInfoCard={setDisplayMousePositionInfoCard} setMusicInfoCardInvisible={setMusicInfoCardInvisible}/>

                                <div className='arrow-container down-arrow'><FontAwesomeIcon icon={faAngleDown} onClick={() => setDisplayMoreInformation(true)}/></div>
                            </> :
                            <>
                                <div className='arrow-container up-arrow'><FontAwesomeIcon icon={faAngleUp} onClick={() => setDisplayMoreInformation(false)}/></div>
                                <MusicInformationCard viewportWidth={viewportWidth} spotifyData={spotifyData} activeSlideIndex={activeSlideIndex} currentCarouselIndex={currentCarouselIndex}/>
                            </>
                            }

                        </> : <></> }
                    </>
                    :
                    <>
                        <h1 className='no-music-found'>No music data found for this activity!</h1>
                        {activityData ? <BasicActivityInfoCard activityData={activityData}/> : <></>}
                    </>
                    }
            </div>
            }
            {routeLineString ? 
            <>
                {/* if the user is currently hovering their mouse over the map display the MousePositionInfoCard which contains information such as speed etc.
                about the user at that point in time during the activity */}

                { mouseMapPosition && displayMusicRoutes && displayMousePositionInfoCard ? 
                <MousePositionInfoCard musicInfoCardInvisible={musicInfoCardInvisible} mouseMapPosition={mouseMapPosition} activityStreamsData={activityStreamsData}/> : <></> }


                { displayMusicInfoCard ? <UserActivityMusicInforCard musicInfoCardInvisible={musicInfoCardInvisible}
                                            detailedMusicData={detailedMusicData} musicIndex={musicCardInfoIndex} 
                                            musicDurations={calculatedMusicDurations.current} /> : <></> }
                
                {musicRoutes ? 
                    <div className={`music-track-toggle-btn ${ displayMusicRoutes ? 'btn-active' : 'btn-deactive' }`}
                        onClick={()=>{
                            setDisplayMusicRoutes((currentValue)=>!currentValue);
                            resetPathColours();
                            setMusicCardInfoIndex({index: activeSlideIndex});
                            setDisplayMusicInfoCard((val) => !val);
                        }}>
                        Toggle Music Path
                    </div>
                :<></>}
                
                <FontAwesomeIcon className={`centre-icon ${musicRoutes?'centre-icon-bottom':'centre-icon-top'}`} icon={faArrowsToDot} onClick={adjustMapView} />

                <Map
                    ref={mapRef}

                    onLoad={()=>{adjustMapView()}}
                    onMouseLeave={() => {setMouseOut((val) => !val)}}
                    onMouseMove={(e) => {handleMouseMove(e)}}
                    onClick={(e) => {handleMouseClick(e); mapRef.current.resize()}}

                    interactiveLayerIds={mapboxLayerIds}

                    initialViewState={{
                        longitude: centreLng,
                        latitude: centreLat,
                        zoom: 20
                    }}
                    
                    style={{width: 'fit', height: 'fit', borderTopRightRadius: '10px', borderBottomRightRadius: '10px', margin: '0.25rem'}}
                    mapStyle="mapbox://styles/mapbox/dark-v11"
                    
                    fitBounds={[[minLng, minLat], [maxLng, maxLat]]}>

                    <Source id="strava-route" type="geojson" data={routeLineString}>
                        <Layer {...layerStyle} />
                    </Source> 
                    <Marker longitude={startLng} latitude={startLat}>
                        <FontAwesomeIcon icon={faTrafficLight} style={{fontSize: '1.4rem', color:'#15b03f'}}/>
                    </Marker>
                    <Marker longitude={endLng} latitude={endLat}> 
                        <FontAwesomeIcon icon={faFlagCheckered} style={{fontSize: '1.3rem', color:'red'}}/>
                    </Marker>

                    {(musicRoutes && displayMusicRoutes) ? 
                        <>
                            {musicRoutes.map((route, index) => {
                                return (
                                    <Source key={index} id={`music_source_${index}`} type="geojson" data={route[1]}>
                                        <Layer id={`music_route_${index.toString()}`} type='line' paint={pathPaint[index][0]} />
                                    </Source>                
                                )
                            })}

                            {mouseMapPosition && displayMousePositionInfoCard ? 
                                (mouseMapPosition.coordinates) ? 
                                    <Marker longitude={mouseMapPosition.coordinates[0]} latitude={mouseMapPosition.coordinates[1]}> 
                                        <FontAwesomeIcon icon={faPersonRunning} style={{fontSize: '1rem', color:'red'}}/>
                                    </Marker>
                                :
                                <></>
                                :
                                <></>
                            }

                        </>:<></>
                    }
                    
                </Map>
            </>
            :
            <div className='map-skeleton'>
                <div className='loading-spinner-container'>
                    <FadeLoader
                        color="white"
                        size={30}
                        data-testid="loader"
                    /> 
                </div>
            </div>
        }

       </div>
    )
}





