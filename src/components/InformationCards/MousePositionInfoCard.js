import { avgPace } from '../Calculations';
import './activityinfocards.css';

export const MousePositionInfoCard = ({mouseMapPosition, activityStreamsData, musicInfoCardInvisible}) => {
    
    // index of the data corresponding to the current poisition of the mouse on the speed chart:
    const index = mouseMapPosition.timeIndex;
    
    // velocity value at that index within the streams array of velocities:
    const velocity = activityStreamsData.velocity_smooth.data[index];

    // pace equivalent to this velocity
    const [minPerKM, remainingSeconds] = avgPace(velocity);

    return (
        <div className={`mouse-position-info-card ${musicInfoCardInvisible ? 'speed-info-top' : 'speed-info-bottom'}`}>
            <p>Speed: {velocity} m/s</p>
            <p>Pace: {minPerKM}:{remainingSeconds} /km</p>
        </div>
    )
}