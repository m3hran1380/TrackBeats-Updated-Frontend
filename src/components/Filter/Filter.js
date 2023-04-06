import './filter.css';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark } from '@fortawesome/free-solid-svg-icons'


export const Filter = ({ epochDates, setEpochDates, filterCriteria, setFilterCriteria,
                         handleSearchSubmit, searchDates, setSearchDates, stravaFetchingStatus}) => {
    
    const currentDate = new Date();

    const handleRemoveStartDate = () => {
        stravaFetchingStatus.current = true;
        setEpochDates({...epochDates, epochStartDate:''})
        setSearchDates({...searchDates, startDate:''})
    }
    const handleRemoveEndDate = () => {
        stravaFetchingStatus.current = true;
        setEpochDates({...epochDates, epochEndDate:''})
        setSearchDates({...searchDates, endDate:''})
    }

    return (
        <div className='filter-search-container'>

            <div className='search-section'>
                <h2>Search by date</h2>

                {epochDates.epochStartDate ? <FilterBlob handleRemove={handleRemoveStartDate}>Start Date</FilterBlob> : <></> }
                {epochDates.epochEndDate ? <FilterBlob handleRemove={handleRemoveEndDate}>End Date</FilterBlob> : <></> }

                <form onSubmit={handleSearchSubmit}>
                    <div className='date-filter'>

                        <label htmlFor='start-date' >Start date</label>
                        <DatePicker selected={searchDates.startDate} maxDate={searchDates.endDate || currentDate}
                                     onChange={(date) => setSearchDates({...searchDates, startDate: date})}
                                        id='start-date' autoComplete='off' dateFormat='dd/MM/yyyy'/>

                        <label htmlFor='end-date' >End date</label>
                        <DatePicker selected={searchDates.endDate} minDate={searchDates.startDate} maxDate={currentDate} 
                            id='end-date' autoComplete='off'
                            dateFormat='dd/MM/yyyy'
                            onChange={(date) => { 
                                // change the date object so it reflects the end of the day rather than the start of the day:
                                date.setHours(23);
                                date.setMinutes(59);
                                date.setSeconds(59);
                                date.setMilliseconds(999);
                                setSearchDates({...searchDates, endDate: date})
                        }}/>
                                    
                    </div>
                    <button className='filter-submit-btn' type='submit'>Submit</button>
                </form>
            </div>
            
            <div className='filter-section'>
                <div className='filter-wrapper'>
                    <h2>Filter activities</h2>

                    <h4>Filter by title</h4>
                    <label htmlFor='keyword-input'>Activity title</label>
                    <input id='keyword-input' onChange={(e) => { setFilterCriteria({...filterCriteria, searchTitle: e.currentTarget.value}) }}
                             type='text' value={filterCriteria.searchTitle} autoComplete='off'
                    />   

                    <div>
                        <h4>Filter by distance</h4>
                        <div className='distance-inputs'>

                            <span>
                                <label htmlFor='min-distance'>Min Distance (m)</label>
                                <input id='min-distance' onChange={(e) => { setFilterCriteria({...filterCriteria, minDistance: e.currentTarget.value }) }}
                                        autoComplete='off' type='number' value={filterCriteria.minDistance} min={0}
                                />                    
                            </span>

                            <span>
                                <label htmlFor='max-distance'>Max Distance (m)</label>
                                <input id='max-distance' onChange={(e) => { setFilterCriteria({...filterCriteria, maxDistance: e.currentTarget.value}) }}
                                        autoComplete='off' type='number' value={filterCriteria.maxDistance} min={0}
                                />                    
                            </span>

                        </div>
                    </div>
                </div>
            </div>

        </div>
    )
}



const FilterBlob = ({ handleRemove, children }) => {
    return (
        <div className='date-filter-blob'>
            {children}
            <FontAwesomeIcon className='remove-btn' icon={faXmark} onClick={handleRemove} />
        </div>
    )
}