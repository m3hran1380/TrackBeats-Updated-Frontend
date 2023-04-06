import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { convertToMinSec, findIndex } from './Calculations';
import { Line } from 'react-chartjs-2';
import zoomPlugin from 'chartjs-plugin-zoom';
import {Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowsToDot } from '@fortawesome/free-solid-svg-icons'

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    zoomPlugin
);

// musicTrackDataStreams.velocity[activeSlideIndex],

export const SpeedChart = ({activeSlideIndex, musicTrackDataStreams, detailedMusicData, pathPaint, activityStreamsData, setMusicInfoCardInvisible,
                             setMouseMapPosition, setMusicCardInfoIndex, displayMusicInfoCard, setDisplayMousePositionInfoCard}) => {
    
    // the following state will contain coordinate arrays corresponding to velocity, avg velocity and avg pace of the runner during each music track. 
    const [musicTracksCoordinates, setMusicTracksCoordinates] = useState();
    const [chartData, setChartData] = useState();
    const [showAllMusicCharts, setShowAllMusicCharts] = useState(false);
    const [radioValue, setRadioValue] = useState('all');
    const [mouseOut, setMouseOut] = useState(false);
    const chartRef = useRef();

    // following useEffect is used to create an array of x and y values whereby the x value is time in seconds since start of activity
    // and y value is the velocity of the runner at that point in time.
    useEffect(() => {
        // list of the coordinate arrays for all music tracks
        const musicsCoordinateArray = [];
        for (let i=0; i<musicTrackDataStreams.time.length; i++) {
            // list of the coordinate array for the current music track in loop
            const musicCoordinateArray = [];
            for (let j=0; j<musicTrackDataStreams.time[i].length; j++) {
                const coordinatesObj = {
                    x: musicTrackDataStreams.time[i][j],
                    y: musicTrackDataStreams.velocity[i][j]
                };
                musicCoordinateArray.push(coordinatesObj);
            }
            musicsCoordinateArray.push(musicCoordinateArray);
        }

        // create coordinate arrays for avg speed:
        const musicAvgSpeedCoordinates = [];
        for (let i=0; i<detailedMusicData.length; i++) {
            musicAvgSpeedCoordinates.push(
                {
                    // we are setting the X value to the number of the song in the order that it was played during the activity.
                    x: detailedMusicData.length - i,
                    y: parseFloat(detailedMusicData[i].avgSpeed),
                }
            ) 
        }
        // create coordinate arrays for avg pace:
        const musicAvgPaceCoordinates = [];
        for (let i=0; i<detailedMusicData.length; i++) {
            // convert the pace back to seconds:
            const seconds = (detailedMusicData[i].avgPace[0] * 60) + parseInt(detailedMusicData[i].avgPace[1]);
            musicAvgPaceCoordinates.push(
                {
                    // we are setting the X value to the number of the song in the order that it was played during the activity.
                    x: detailedMusicData.length - i,
                    y: seconds,
                }
            )   
        }
        setMusicTracksCoordinates([musicsCoordinateArray, musicAvgSpeedCoordinates, musicAvgPaceCoordinates]);
    }, [musicTrackDataStreams, detailedMusicData])


    // following useEffect creates the data for the line chart:
    useEffect(() => {
        if (musicTracksCoordinates && (activeSlideIndex !== undefined)) {

            if (!showAllMusicCharts) {
                // only show the chart corresponding to the currently active music track.
                const data = {
                    datasets: [
                        {
                            label: detailedMusicData[activeSlideIndex].music.name,
                            data: musicTracksCoordinates[0][activeSlideIndex],
                            pointRadius: 0, 
                            lineWidth: 1,
                            tension: 0.2,
                            borderColor: 'black',
                        }
                    ]
                }
                setChartData(data);
            }
            else {
                // show all charts for all music tracks listened to.
                let data;

                if (radioValue === 'all') {
                    const chartDataSet = [];

                    detailedMusicData.forEach((music, index) => {
                        const chartMusicObj = {
                            label: detailedMusicData[index].music.name,
                            data: musicTracksCoordinates[0][index],
                            pointRadius: 0,
                            tension: 0.2,
                            // if the particular chart data corresponds to the current active music card, set it's chart data color to white, otherwise set it
                            // to the colour of its path on the map - the regular expression here removes the alpha channel from the color string. 
                            borderColor: (index === activeSlideIndex) ? 'white' : pathPaint[index][1].replace("rgba", "rgb").replace(/,\s*\d\.\d+\)/, ")"),
                            backgroundColor: (index === activeSlideIndex) ? 'white' : 'rgba(0,0,0,0)',
                            borderWidth: (index === activeSlideIndex) ? 3 : 1.5,
                        };
                        chartDataSet.push(chartMusicObj);
                    })

                    data = {
                        datasets: [...chartDataSet]
                    }
                }
                else {
                    const chartDataSet = [];

                    detailedMusicData.forEach((music, index) => {
                        const chartMusicObj = {
                            label: detailedMusicData[index].music.name,
                            data: (radioValue === 'avgSpeed') ? [musicTracksCoordinates[1][index]] : [musicTracksCoordinates[2][index]],
                            pointRadius: (index === activeSlideIndex) ? 10 : 6, 
                            // if the particular chart data corresponds to the current active music card, set it's chart data color to white, otherwise set it
                            // to the colour of its path on the map - the regular expression here removes the alpha channel from the color string. 
                            borderColor: (index === activeSlideIndex) ? 'white' : pathPaint[index][1].replace("rgba", "rgb").replace(/,\s*\d\.\d+\)/, ")"),
                            backgroundColor: (index === activeSlideIndex) ? 'white' : pathPaint[index][1].replace("rgba", "rgb").replace(/,\s*\d\.\d+\)/, ")")
                        };
                        chartDataSet.push(chartMusicObj);
                    })
                    data = {
                        datasets: [...chartDataSet]
                    }

                }
                setChartData(data);
            }
        }
    }, [musicTracksCoordinates, activeSlideIndex, setChartData, detailedMusicData, showAllMusicCharts, pathPaint, radioValue])


    // following useEffect sets the position of the character icon on the map to the start of the currently selected song segment.
    useEffect(() => {
        if (radioValue === 'all' && (activeSlideIndex !== undefined)) {
            const musicStartIndex = findIndex(activityStreamsData.time.data, musicTrackDataStreams.time[activeSlideIndex][0]);
            const latLng = activityStreamsData.latlng.data[musicStartIndex]; 
            setMouseMapPosition({coordinates: latLng, timeIndex: musicStartIndex});
        }
    }, [activeSlideIndex, setMouseMapPosition, radioValue, activityStreamsData, musicTrackDataStreams]);


    // the following useEffect is used to set the music info card back to the active music info card, after the user hovers away from the speed chart. 
    // mouseOut is used as a dependency and its value changes everytime the user moves their mouse away from the chart, thus causing this function
    // to get executed. 
    useEffect(() => {
        if (musicTracksCoordinates && (activeSlideIndex !== undefined) && displayMusicInfoCard) {
            setMusicCardInfoIndex({index: activeSlideIndex});
        } 
    }, [musicTracksCoordinates, mouseOut, setMusicCardInfoIndex, activeSlideIndex, displayMusicInfoCard])

    
    // here I used the useCallback hook to memoize my function declaration - therefore, the function will only get re-created if one of its dependencies change.
    // avoiding its redeclaration on every component re-render. This is necessary as I have used this as a dependency in the memoized options object below.
    const handleChartMouseHover = useCallback((e, slideIndex) => {
        if (radioValue === 'all') {
            // e.x gives us the x coordinate of the mouse on the chart
            // we then use getValueForPixel to obtain the actual value at that coordinate - which in this case would be the elapsed time since start 
            // of activity in seconds. 
            const {scales: { x }} = e.chart;
            let elapsedTime = x.getValueForPixel(e.x);

            // if only one song is being displayed, check see if the x-value which represents elapsed time lies within the boundaries of the song:
            if (!showAllMusicCharts) {
                const musicElapsedStartTime = musicTrackDataStreams.time[slideIndex][0];
                const musicElapsedEndTime = musicTrackDataStreams.time[slideIndex][musicTrackDataStreams.time[slideIndex].length - 1];

                // if elapsedTime is before the start time of the current music track, set it to the start time of music track.
                // similarly if it is after the end time of the current music track, set it to the end time of the current music track. 
                elapsedTime = (elapsedTime <= musicElapsedStartTime) ? musicElapsedStartTime : (elapsedTime >= musicElapsedEndTime) ? musicElapsedEndTime : elapsedTime;
            }

            const timeStream = activityStreamsData.time.data;

            // this is the index of the particular point in time that the mouse is hovering over in our time stream data.
            const index = findIndex(timeStream, elapsedTime);

            // we can use this index to obtain the latitude and longitude values of the position of the runner at that point in time:
            const latLng = activityStreamsData.latlng.data[index];
            
            // we use the state variable defined in UserActivity.js to save these latitude and longitude values
            // we will then render an icon showing this 
            setMouseMapPosition({coordinates: latLng, timeIndex: index});
            // display the music card info
            setDisplayMousePositionInfoCard(true);

            // check see what song is currently getting hovered over.
            let currentHoveredMusicIndex;

            
            for (let i=(musicTrackDataStreams.time.length - 1); i>=0; i--) {
                if ((elapsedTime <= musicTrackDataStreams.time[i][musicTrackDataStreams.time[i].length - 1]) && elapsedTime >= musicTrackDataStreams.time[i][0]) {
                    currentHoveredMusicIndex = i;
                    break;
                }
            }

            // check see if the song being hovered over is different to the currently active card. Only do this when all the songs are being displayed.
            if (currentHoveredMusicIndex !== undefined && showAllMusicCharts) {
                setMusicInfoCardInvisible(false);
                if (currentHoveredMusicIndex !== slideIndex) { 
                    // if a different song is getting hovered on change the info card displayed on the map to reflect this song:
                    setMusicCardInfoIndex({index: currentHoveredMusicIndex});
                }
                else {
                    setMusicCardInfoIndex({index: slideIndex});
                }
            }
            else if (showAllMusicCharts) {
                // if we are displaying all the music charts and the currentHoveredMusicIndex is undefined (i.e., the mouse is hovering over
                // a region of the map that corresponds to no music) then don't display any music card:
                setMusicInfoCardInvisible(true);
            }


        }
        else {
            setMouseMapPosition(undefined);
        }
    }, [radioValue, activityStreamsData, setMouseMapPosition, showAllMusicCharts, musicTrackDataStreams, setMusicCardInfoIndex, setDisplayMousePositionInfoCard, setMusicInfoCardInvisible])

    
    // here I used the useMemo hook to memoize the options object's declaration. The return value (in this case options object) will
    // only get recomputed if one of the dependencies change.
    const options = useMemo(() => {
        const optionsObj = {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {  
                    type: (radioValue === 'all') ? 'linear' : 'category',
                    grid: {color: 'rgba(0,0,0,0.1)'},
                    ticks: {
                        callback: 
                            // the following callback function is used to add some formatting to the x-axis labels.
                            function(value) {
                                if (radioValue === 'all') {
                                    const [timeMin, timeSec] = convertToMinSec(value); 
                                    return `${timeMin}:${timeSec}`
                                }
                                else {
                                    return value;
                                }
                            },
                        color: 'black'
                    },
                    title: {
                        display: true,
                        color: 'black',
                        text: (radioValue === 'all') ? 'Elapsed time since the start of the activity (m:s)' : 'Order in which the music tracks were played during the activity',
                        font: {size: 15}
                    }
                },
                y: {type: 'linear',
                    grid: {color: 'rgba(0,0,0,0.1)'},
                    ticks: {
                        callback: 
                            // the following callback function is used to add some formatting to the y-axis labels.
                            // for examlpe the y-axis values for pace represent seconds per km - to make it more readable we convert it to minutes:seconds per km.
                            function(value) {
                                if (radioValue === 'avgPace') {
                                    const [timeMin, timeSec] = convertToMinSec(value); 
                                    return `${timeMin}:${timeSec} /km`
                                }
                                else {
                                    return `${value.toFixed(2)} m/s`;
                                }
                            },
                        color: 'black'
                    },
                    // reverse the y-axis scale for pace to make it more intuitive - the lower the pace the better the runner has performed.
                    reverse: (radioValue === 'avgPace') ? true : false,
                    title: {
                        display: true,
                        color: 'black',
                        text: (radioValue === 'all') ? 'Running Speed (m/s)' : (radioValue === 'avgSpeed') ? 'Average Running Speed (m/s)' :
                        'Average Running Pace (time/km)',
                        font: {size: 15}
                    }
                },
            },
            plugins: {
                legend: {
                    labels: {
                        color: 'black',
                        font: {size: 16}
                    }
                },
                zoom: {
                  zoom: {
                    wheel: {enabled: true,},
                    pinch: {enabled: true},
                    mode: 'xy',
                  },
                  pan: {enabled: true}
                }
            },
            onHover: (e) => {handleChartMouseHover(e, activeSlideIndex)},
            events: ['mouseout', 'mousemove']
        }

        return optionsObj;
    }, [radioValue, activeSlideIndex, handleChartMouseHover])

    // the following if statement changes the label of the x-axis if the radioButton value gets changed from All to something else.
    if (radioValue !== 'all') {
        options.scales.x['labels'] = detailedMusicData.map((music, index) => { return (index + 1)});
    }

    const resetChartPosition = () => {
        chartRef.current.resetZoom();
    }

    const isRadioBtnChecked = (btnId) => {
        return radioValue === btnId;
    }

    // following memoizes the chart component and prevents the zoom from resetting when the state updates and component re-renders:
    const chartComponent = useMemo(()=>(
        <Line 
            className='speed-chart'
            ref={chartRef}
            data={chartData} 
            options={options}

            // following pluggin is used to handle when the user's mouse leaves the chart.
            // it removes the character icon from the map and also hides the hover info card. 
            plugins={[
                {
                    id:'mouseOutEvent',
                    beforeEvent(chart, args) {
                        const event = args.event;

                        if (event.type === 'mouseout') {
                            setMusicInfoCardInvisible(false);
                            setMouseMapPosition(undefined);
                            setMouseOut((val) => !val);
                            setDisplayMousePositionInfoCard(false);
                        }

                    }
                }
            ]}
        />
    ), [chartData, options, setMouseMapPosition, setMouseOut, setDisplayMousePositionInfoCard, setMusicInfoCardInvisible])


    return (
        <>
        {chartData ? 
            <div className='speed-chart-container slide-up' >
                <div className='chart-settings-section'>
                    <div className={`show-all-btn ${showAllMusicCharts ? 'show-all-active' : ''}`} onClick={() => {setShowAllMusicCharts((currentVal) => !currentVal); setRadioValue('all'); resetChartPosition()} }>show all tracks</div>
                    { showAllMusicCharts ? 
                        <div className='radio-btn-container'>
                            <div className='input-container'>
                                <label htmlFor="all">All</label>
                                <input id="all" type="radio" name="chart-mode" checked={isRadioBtnChecked("all")} value="all" onChange={(e) => setRadioValue(e.target.value)} />
                            </div>

                            <div className='input-container'>
                                <label htmlFor="avgSpeed">Avg&nbsp;Speed</label>
                                <input id="avgSpeed" type="radio" name="chart-mode" checked={isRadioBtnChecked("avgSpeed")}  value="avgSpeed" onChange={(e) => setRadioValue(e.target.value)} />
                            </div>

                            <div className='input-container'>
                                <label htmlFor="avgPace">Avg&nbsp;Pace</label>
                                <input id="avgPace" type="radio" name="chart-mode" checked={isRadioBtnChecked("avgPace")} value="avgPace" onChange={(e) => setRadioValue(e.target.value)} />
                            </div>
                        </div> : <></> }
                    <FontAwesomeIcon className='reset-map-icon' icon={faArrowsToDot} onClick={resetChartPosition} />
                </div>
                {chartComponent}

            </div>
            :
            <></>
        }
        </>
    )
    

}