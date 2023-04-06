import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";
import './musiccarousel.css'
import { useState, useEffect, useRef } from 'react';
import Slider from "react-slick";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFire } from '@fortawesome/free-solid-svg-icons'


export const MusicCarousel = ({ highlightPath, resetPathColours, musicTrackDataStreams, detailedMusicData, setCurrentCarouselIndex,
                                 displayMusicRoutes, setMusicCardInfoIndex, mouseOut, activeSlideIndex, setActiveSlideIndex, viewportWidth}) => {

    const [activeIndex, setActiveIndex] = useState(0);
    const [sortedMusicData, setSortedMusicData] = useState([]);

    const carouselRef = useRef();

    let carouselSettings = {
        dots: true,
        speed: 300,
        slidesToShow: (viewportWidth > 1600 || viewportWidth < 650) ? 1 : 2, 
        arrows: false,
        centerMode: true,
        beforeChange: (currentIndex, nextIndex) => {
            setActiveIndex(nextIndex);
            setActiveSlideIndex(sortedMusicData[nextIndex].originalIndex);
            setCurrentCarouselIndex(nextIndex);
        }
    };

    // following useEffect will run once and calculate different metrics e.g., avg speed, avg pace, etc. for each of the songs.
    // it will also sort music tracks from fastest to slowest in terms of runner's speed.
    useEffect(() => {
        const sortedMusicList = [];

        detailedMusicData.forEach((music, index) => {
            // create an object containing all these additional information for each of the music tracks.
            const detailedMusic = {
                music: music.music,
                originalIndex: index,
                avgSpeed: music.avgSpeed,
                avgPace: music.avgPace,
                highestSpeed: music.highestSpeed
            }

            // append the object to our list of music which we will then sort based on average speed:
            sortedMusicList.push(detailedMusic)
        })

        // sort the musicList based on the average speed:
        sortedMusicList.sort((a, b) => b.avgSpeed - a.avgSpeed);
        setSortedMusicData(sortedMusicList);

        // set the activeSlideIndex to point to the first slide's original index
        setActiveSlideIndex(sortedMusicList[0].originalIndex);

    }, [detailedMusicData, musicTrackDataStreams, setActiveSlideIndex])


    // this useEffect ensures the currently active music card on the screen has its route highlighted on the map.
    // additionally, one of its dependancies is mouseOut whose value changes everytime the user's mouse leaves one of the layers on the map.
    // this is so that once the user hovers their mouse on a different layer and then moves away, the active music card's path gets highlighted again. 
    useEffect(()=>{
        if (displayMusicRoutes) {
            resetPathColours();
            highlightPath(sortedMusicData[activeIndex].originalIndex);
            setMusicCardInfoIndex({index: sortedMusicData[activeIndex].originalIndex});
        }
    }, [activeIndex, displayMusicRoutes, mouseOut, setMusicCardInfoIndex, sortedMusicData, highlightPath, resetPathColours])


    // when the user clicks on a music path on the map, the activeSlideIndex's value gets updated to the index value of that path which represents a music.
    // Consequently the following useEffect gets executed which moves the slider to the slide showing the music that the user clicked on.
    // This will also change the activeIndex value, and since the useEffect above has that as its dependency it will get executed, highlighting the music's path
    // on the map.
    useEffect(() => {
        if (activeSlideIndex !== undefined) {
            // find the index of the music card whose original index matches activeSldieIndex:
            let musicCardIndex;

            for (let i=0; i<sortedMusicData.length; i++) {
                if (sortedMusicData[i].originalIndex === activeSlideIndex) {
                    musicCardIndex = i;
                    break;
                }
            }
            // move the carousel slider to the slide showcasing the selected music card.
            carouselRef.current.slickGoTo(musicCardIndex);
        }
    }, [activeSlideIndex, sortedMusicData])


    // end index of the musicData list.
    const end = detailedMusicData.length - 1;

    return (
        <Slider ref={carouselRef} className="music-carousel"{...carouselSettings}>
            { sortedMusicData.map((track, index) => (
                <div className='carousel-card-container' key={track.originalIndex} >

                    {/* we check to see whether the next card is after or before the current card - depending on this we either assign the card a class of left or right */}
                    {/* this is done to change the transform origin of the card and make it appear on either side of the currently active card */}
                    <div className={
                        `music-card ${(index === 0) ? 'fastest' : ''} ${(viewportWidth < 1600) ? 'multiple-card' : (index === activeIndex) ? 'active-card' :
                        (index === activeIndex + 1) ? 'left' : (activeIndex === end && index === 0) ? 'left' : 'right'}`
                    } >
 
                             
                        <img src={track.music.image[3]['#text']} alt="music album" />
                        
                        <div className='music-card-info'>
                            <p>{track.music.name}</p>
                            <p>By: {track.music.artist['#text']} </p>
                            <p>Average Speed: {track.avgSpeed} m/s {(index===0) ? <FontAwesomeIcon icon={faFire}/> : <></> }</p>
                            <p>Average Pace: {track.avgPace[0]}:{track.avgPace[1]} /km {(index===0) ? <FontAwesomeIcon icon={faFire}/> : <></> }</p>
                            <p>Highest Speed: {track.highestSpeed}</p>
                        </div>

                    </div>
                </div>
            ))}
        </Slider>
    )
} 
