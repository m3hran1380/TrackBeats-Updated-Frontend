import Tilt from 'react-parallax-tilt';
import { useNavigate } from 'react-router-dom';

export const ActivityGridElement = ({ activity }) => {

    const date = new Date(activity.start_date);
    const date_string = date.toDateString().slice(4) + " " + date.toLocaleTimeString().slice(0, -3);
    activity.start_date = date_string;

    const navigate = useNavigate()

    return (
        <Tilt tiltMaxAngleX={20} tiltMaxAngleY={20}>
            <div className='activity-item'  onClick={() => {navigate(`/activity/${activity.id}`)}} >

                <div className='single-activity-title'>{activity.name}</div>
                <div>Running time: {Math.floor(activity.elapsed_time / 60)}m {activity.elapsed_time % 60}s</div>
                <div>Average Speed: {activity.average_speed.toFixed(2)} m/s</div>
                <div>Distance: {activity.distance}</div>
                <div>{activity.start_date}</div>
            </div>
        </Tilt> 
    )

}