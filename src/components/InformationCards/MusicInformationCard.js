import { SuggestionCarousel } from "./SuggestionCarousel"
import FadeLoader from "react-spinners/FadeLoader";
import './activityinfocards.css'
import { useState } from 'react';


export const MusicInformationCard = ({ spotifyData, activeSlideIndex, currentCarouselIndex, viewportWidth }) => {

    // following state determines which of the two carousels (top tracks or recommended music) is currently playing.
    // it is used to make sure two cannot be played at the same time. 
    const [theCarouselPlaying, setTheCarouselPlaying] = useState();


    const getSuffix = (num) => {
        if (num % 100 >= 11 && num % 100 <= 13) {
          return "th";
        }
        switch (num % 10) {
          case 1:
            return "st";
          case 2:
            return "nd";
          case 3:
            return "rd";
          default:
            return "th";
        }
      }

    console.log(spotifyData);
    console.log('index', activeSlideIndex);

    return (
        <div className='music-information-card-container slide-down'>
            { spotifyData ?
                <div className='music-info-inner-container'>  
                    <div className='artist-section'>
                        <div className='artist-pfp'>
                            <img src={spotifyData[activeSlideIndex].current_track.artist.image} alt='artist' />
                            <p>{spotifyData[activeSlideIndex].current_track.artist.name}</p>
                        </div>
                        <div className='artist-info-section'>
                            <div className='genre-container-outer'>
                                {spotifyData[activeSlideIndex].current_track.genres.length ? 
                                    <>
                                        <p>Associated Genres:</p>
                                        <div className='genre-container-inner'>
                                            {spotifyData[activeSlideIndex].current_track.genres.map((genre) => 
                                                <div className='genre' key={genre}>
                                                    <p>{genre}</p>
                                                </div>
                                            )}
                                        </div>  
                                    </>
                                :
                                    <h3>We could not find any information about the genre of this track and artist.</h3>
                                }
                            </div>
                            {!currentCarouselIndex ? 
                                <p className='song-speed-text'>This was your fastest song!</p>
                                :
                                <p className='song-speed-text'>This was your {currentCarouselIndex + 1}{getSuffix(currentCarouselIndex + 1)} fastest song.</p>
                            }
                        </div>
                    </div>

                    <div className='carousel-section'>
                        <p className='carousel-title'>Similar Tracks From Same Genre</p>
                        {/* recommended tracks based on current track: */}
                        <SuggestionCarousel tracks={spotifyData[activeSlideIndex].recommended_tracks} currentCarousel="recommended"
                        activeSlideIndex={activeSlideIndex} theCarouselPlaying={theCarouselPlaying} setTheCarouselPlaying={setTheCarouselPlaying}
                        viewportWidth={viewportWidth}/>
                        
                        <p className='carousel-title'>Artist's Top Tracks</p>
                        {/* Artist's top tracks: */}
                        <SuggestionCarousel tracks={spotifyData[activeSlideIndex].current_track.artist.top_tracks} currentCarousel="toptracks"
                        activeSlideIndex={activeSlideIndex} theCarouselPlaying={theCarouselPlaying} setTheCarouselPlaying={setTheCarouselPlaying}
                        viewportWidth={viewportWidth}/>
                    </div>
                </div>
            :
            <div className='spotify-loading-spinner-container'>
                <FadeLoader
                    color="white"
                    size={30}
                    data-testid="loader"
                /> 
            </div>
            }   
        </div>
    )
}