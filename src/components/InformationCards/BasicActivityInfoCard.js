// this component displays basic activity information when there is no music data recorded for the particular activity
import './activityinfocards.css'; 
import { avgPace } from '../Calculations';
import Tilt from 'react-parallax-tilt';


export const BasicActivityInfoCard = ({ activityData }) => {

    const date = new Date(activityData.start_date);
    const date_string = date.toDateString().slice(4) + " " + date.toLocaleTimeString().slice(0, -3);
    activityData.start_date = date_string;

    const [minPerKM, remainingSeconds] = avgPace(activityData.average_speed);

    return (
        <Tilt tiltMaxAngleX={5} tiltMaxAngleY={5}>
            <div className='basic-activity-info'>
                <h2>{activityData.name}</h2>
                <div className='descriptions'>
                    <p><strong>Start time:</strong> {activityData.start_date}</p>
                    <p><strong>Running time:</strong> {Math.floor(activityData.elapsed_time / 60)}m {activityData.elapsed_time % 60}s</p>
                    <p><strong>Average speed:</strong> {activityData.average_speed} m/s</p>
                    <p><strong>Average pace:</strong> {minPerKM}:{remainingSeconds} /km</p>
                    <p><strong>Running distance:</strong> {activityData.distance} metres</p>
                    {activityData.description ? <p><strong>Activity description:</strong> {activityData.description}</p> : <></>}
                </div>
            </div>
        </Tilt>
    )
}