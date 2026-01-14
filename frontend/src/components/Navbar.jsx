
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useState } from 'react';
import './Navbar.css';

function Navbar() {
  const { isAuthenticated, isAdmin, logout } = useAuth();
  const [navOpen, setNavOpen] = useState(false);

  const handleToggle = () => setNavOpen((open) => !open);
  const handleNavClick = () => setNavOpen(false);

  return (
    <>
      <nav className="navbar">
        <div className="navbar-brand">
          <Link to="/" style={{ color: 'white', textDecoration: 'none' }} onClick={handleNavClick}>
            Super Bowl Squares
          </Link>
        </div>

        <button
          className="navbar-toggle"
          aria-label="Toggle navigation"
          aria-expanded={navOpen}
          aria-controls="navbar-drawer"
          onClick={handleToggle}
        >
          &#9776;
        </button>

        <div id="navbar-drawer" className={`navbar-drawer${navOpen ? ' open' : ''}`}>
          <button
            type="button"
            className="navbar-drawer-close"
            aria-label="Close menu"
            onClick={handleNavClick}
          >
            {'\u00D7'}
          </button>
          <ul className="navbar-nav">
            {isAuthenticated && <li><Link to="/entry" onClick={handleNavClick}>Entry</Link></li>}
            {isAuthenticated && <li><Link to="/account" onClick={handleNavClick}>Account</Link></li>}
            {isAuthenticated && isAdmin && <li><Link to="/admin" onClick={handleNavClick}>Admin</Link></li>}
            {!isAuthenticated ? (
              <li><Link to="/login" onClick={handleNavClick}>Login</Link></li>
            ) : (
              <li>
                <button
                  onClick={() => { logout(); handleNavClick(); }}
                  className="btn btn-secondary"
                  style={{ padding: '8px 12px' }}
                >
                  Logout
                </button>
              </li>
            )}
          </ul>
        </div>
      </nav>

      <div
        className={`navbar-overlay${navOpen ? ' open' : ''}`}
        onClick={handleNavClick}
        aria-hidden={!navOpen}
      />
    </>
  );
}

export default Navbar;
