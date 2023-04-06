import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

export const ActivityCardSkeleton = ({ cards }) => {

    // create an array of zeros for the number of cards given as props:
    
    return (
        Array(cards).fill(0).map( (item, i) => (
            <div key={i}>
                <Skeleton borderRadius='16px' height="150px"/>
            </div>
        ))
    )
}