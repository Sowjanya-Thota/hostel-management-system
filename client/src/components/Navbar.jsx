import { Link } from 'react-router-dom'
import { FaHome, FaUser, FaSignInAlt, FaUserCircle, FaCog } from 'react-icons/fa'
import { useState, useEffect } from 'react'
import { useAuth } from '../services/authService.jsx'

export default function Navbar() {
  const { user, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <nav className={`navbar navbar-expand-lg navbar-dark py-3 ${scrolled ? 'navbar-scrolled' : ''}`}>
      <div className="container-fluid">
        {/* Updated Brand Section */}
        <Link className="navbar-brand d-flex align-items-center" to="/">
          {/* Animated SVG Icon */}
          <svg 
            width="40" 
            height="40" 
            viewBox="0 0 24 24" 
            className="hostel-icon me-2"
          >
            <rect x="3" y="10" width="18" height="11" className="building"/>
            <path d="M3 10L12 3L21 10" className="roof"/>
            <rect x="7" y="13" width="3" height="3" className="window"/>
            <rect x="14" y="13" width="3" height="3" className="window"/>
            <rect x="10" y="16" width="4" height="5" className="door"/>
          </svg>
          
          {/* Text that will scale on hover */}
          <span className="brand-text">Hassle Free Hostel</span>
        </Link>

        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <Link className="nav-link px-3 py-2" to="/">
                <FaHome className="me-1 fs-5" /> Home
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link px-3 py-2" to="/about">
                <FaUser className="me-1 fs-5" /> About
              </Link>
            </li>
            
            {!user ? (
              <li className="nav-item">
                <Link className="nav-link px-3 py-2" to="/login">
                  <FaSignInAlt className="me-1 fs-5" /> Login
                </Link>
              </li>
            ) : (
              <>
                {/* User Profile */}
                <li className="nav-item dropdown">
                  <a className="nav-link dropdown-toggle px-3 py-2" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                    <FaUserCircle className="me-1 fs-5" /> {user.name || user.username}
                  </a>
                  <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="navbarDropdown">
                    <li>
                      <Link className="dropdown-item" to={`/${user.role}/dashboard`}>
                        Dashboard
                      </Link>
                    </li>
                    <li>
                      <Link className="dropdown-item" to="/profile">
                        <FaUser className="me-2" /> Profile
                      </Link>
                    </li>
                    <li>
                      <Link className="dropdown-item" to="/settings">
                        <FaCog className="me-2" /> Settings
                      </Link>
                    </li>
                    <li><hr className="dropdown-divider" /></li>
                    <li>
                      <button className="dropdown-item" onClick={logout}>
                        Logout
                      </button>
                    </li>
                  </ul>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}