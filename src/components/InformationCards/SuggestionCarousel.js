import React, { useRef, useState, useEffect } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick-theme.css";
import "slick-carousel/slick/slick.css";
import './activityinfocards.css' 
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCirclePlay, faVolumeXmark, faCirclePause } from '@fortawesome/free-solid-svg-icons'


export const SuggestionCarousel = ({ tracks, activeSlideIndex, theCarouselPlaying, setTheCarouselPlaying, currentCarousel, viewportWidth }) => { 

    const audioRef = useRef();
    const [audioSrc, setAudioSrc] = useState();
    const [progress, setProgress] = useState(0);
    const [audioEnded, setAudioEnded] = useState(false);
    const [currentlyPlayingIndex, setCurrentlyPlayingIndex] = useState();
    const [currentlyPlaying, setCurrentlyPlaying] = useState();

    let carouselSettings = {
        dots: true,
        speed: 300,
        slidesToShow: (viewportWidth > 1750) ? 2 : (viewportWidth > 1600) ? 1: (viewportWidth > 950) ? 2 : 1,
        arrows: false,
        centerMode: true,
    };

    const handleMusicPlayBtnClicked = (audioUrl) => {
        if (audioSrc === audioUrl) {
            // if the same music was clicked again, check to see if the music is paused or playing, and in either case do the opposite
            audioRef.current.paused ? audioRef.current.play() : audioRef.current.pause();
        } 
        else {
            setAudioSrc(audioUrl);
            setProgress(0);
            setAudioEnded(false); 
        }
    }

    // check see which carousel is playing - if a different carousel to the current one is playing, pause the music from the current carousel
    useEffect(() => {
        if (theCarouselPlaying !== currentCarousel) {
            audioRef.current.pause();
            setCurrentlyPlaying(false);
            audioRef.current.currentTime = 0;
        }
    }, [theCarouselPlaying, setCurrentlyPlaying, currentCarousel])


    useEffect(() => {
        // when active slide changes, stop any playing music:
        if (audioRef.current) {
            audioRef.current.pause();
            setCurrentlyPlaying(false);
            audioRef.current.currentTime = 0;
        }
    }, [activeSlideIndex])


    // audio source only changes when user clicks on a new song to play, so we start playing that song.
    useEffect(() => {
        if (audioSrc) {
            audioRef.current.src = audioSrc;
            audioRef.current.play();
        } else {
            audioRef.current.pause();
        }
      }, [audioSrc]);

    
    return (
        <Slider {...carouselSettings}>

            { tracks.map((track, index) => (
                <div key={track.track_name} className='music-suggestion-card-container'>
                    <div className='music-suggestion-card'>
                        <img src={track.image ? track.image : require('../../assets/default-song.png') } alt='music album' />
                        {track.preview_url ?                            
                            <PlayButtonComponent handleMusicPlayBtnClicked={handleMusicPlayBtnClicked} audioEnded={audioEnded} progress={progress} 
                            audioSrc={audioSrc} track={track} noAudio={false} setCurrentlyPlayingIndex={setCurrentlyPlayingIndex} index={index}
                            currentlyPlayingIndex={currentlyPlayingIndex} currentlyPlaying={currentlyPlaying} setCurrentlyPlaying={setCurrentlyPlaying}
                            setTheCarouselPlaying={setTheCarouselPlaying} currentCarousel={currentCarousel}/>                          
                        :
                            <PlayButtonComponent handleMusicPlayBtnClicked={handleMusicPlayBtnClicked} audioEnded={audioEnded} progress={progress} 
                            audioSrc={audioSrc} track={track} noAudio={true} setCurrentlyPlayingIndex={setCurrentlyPlayingIndex} index={index}
                            currentlyPlayingIndex={currentlyPlayingIndex} currentlyPlaying={currentlyPlaying} setCurrentlyPlaying={setCurrentlyPlaying}
                            setTheCarouselPlaying={setTheCarouselPlaying} currentCarousel={currentCarousel} />
                        }
                        <audio ref={audioRef} onTimeUpdate={() => {
                            // find the percentage of the song that's been played so far and set the state's value to it:
                            setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
                        }}
                            onEnded={() => {
                                setAudioEnded(true)
                            }}
                        >
                            <source type="audio/mp3" />
                        </audio>

                        <div className='music-card-info-container'>
                            <p>{track.track_name}</p>
                            <p>By: {track.artist}</p>
                        </div>

                    </div>
                </div>
            ))}
        </Slider>
    )
}



const PlayButtonComponent = ({ handleMusicPlayBtnClicked, track, noAudio, currentlyPlaying, setCurrentlyPlaying,
                                 progress, audioEnded, index, setCurrentlyPlayingIndex, currentlyPlayingIndex,
                                 setTheCarouselPlaying, currentCarousel}) => {

    const [displayPlayBtn, setDisplayPlayBtn] = useState(false);
    const progressBarRef = useRef();

    useEffect(() => {
        if (audioEnded) {
            if (progressBarRef.current) {
                progressBarRef.current.style.width = '0%'
            }
            setCurrentlyPlayingIndex(undefined);
        }
    }, [audioEnded, setCurrentlyPlayingIndex])

    return (
        <div className='music-preview-hover-container' onMouseEnter={()=>{setDisplayPlayBtn(true)}} onMouseLeave={()=>setDisplayPlayBtn(false)}>
            <div className={`music-preview-hover ${(displayPlayBtn)? 'play-visible' : 'play-hidden'}`}>
                { noAudio ? 
                    <FontAwesomeIcon className='mute-btn' icon={faVolumeXmark} />
                :
                    ((index === currentlyPlayingIndex) && currentlyPlaying) ? 
                        <>
                            <FontAwesomeIcon className='play-btn' icon={faCirclePause} onClick={()=>{handleMusicPlayBtnClicked(track.preview_url); setCurrentlyPlaying(false)}} />
                        </>
                    :
                        <FontAwesomeIcon className='play-btn' icon={faCirclePlay} onClick={()=>{handleMusicPlayBtnClicked(track.preview_url);
                                                                                                setCurrentlyPlaying(true);
                                                                                                setCurrentlyPlayingIndex(index);
                                                                                                setTheCarouselPlaying(currentCarousel)
                                                                                            }} />
                }
            </div>
            {(!noAudio && (index === currentlyPlayingIndex)) ? 
                <div className='audio-progress-bar' ref={progressBarRef} style={{ width: `${progress}%`}}></div>
            :
                <></>
            }
        </div>
    )
}