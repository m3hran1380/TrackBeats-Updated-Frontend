import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCaretRight, faCaretLeft } from '@fortawesome/free-solid-svg-icons'


export const Paginator = ({ decrementArrow, handleDecrement, paginationCounter, pageNumber, incrementArrow, handleIncrement}) => (

    <div className='paginator'>
        <FontAwesomeIcon ref={decrementArrow} onClick={handleDecrement} icon={faCaretLeft} className='left-arrow pagination-arrow' />
        <div ref={paginationCounter} className='page-number-container'>
            <p className='page-number'>{pageNumber}</p>
        </div>
        <FontAwesomeIcon ref={incrementArrow} onClick={handleIncrement} icon={faCaretRight} className='right-arrow pagination-arrow' />
    </div>

)