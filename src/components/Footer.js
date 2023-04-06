import { Link } from 'react-router-dom';

export const Footer = ({lastFMConnected}) => {
    return (
        <footer className={`${lastFMConnected ? 'footer-normal' : 'footer-login'}`}>
            <Link to='#'>Terms of Service</Link>
            <Link to='#'>Privacy Policy</Link>
        </footer>
    )
}