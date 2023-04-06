import './activityinfocards.css';

export const UserActivityMusicInforCard = ({ detailedMusicData, musicIndex, musicDurations, musicInfoCardInvisible }) => {
    const index = musicIndex.index;
    const currentMusic = detailedMusicData[index];

    const totalDuration = musicDurations[index]
    const songMinuteDuration = Math.floor(totalDuration / 60);
    const songSecondsDuration = totalDuration % 60;

    return (
        <div className={`hovered-music ${musicInfoCardInvisible ? 'invisible' : 'visible' }`}>
            
            <img src={currentMusic.music.image[3]['#text']} alt="music album" />
            <div className='music-card-info-section'>
                <p>{currentMusic.music.name}</p>
                <p>Duration: {songMinuteDuration}m : {songSecondsDuration}s</p>
                <p>Average Speed: {currentMusic.avgSpeed} m/s</p>
                <p>Average Pace: {currentMusic.avgPace[0]}:{currentMusic.avgPace[1]} /km</p>
            </div>
        </div>
    )
}