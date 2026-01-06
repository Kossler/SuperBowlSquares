import { Link } from 'react-router-dom'

function Navbar({ isAuthenticated, isAdmin, onLogout }) {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/" style={{ color: 'white', textDecoration: 'none' }}>
          Super Bowl Squares
        </Link>
      </div>
      <ul className="navbar-nav">
        <li><Link to="/">Home</Link></li>
        {isAuthenticated && <li><Link to="/entry">Entry</Link></li>}
        {isAuthenticated && isAdmin && <li><Link to="/admin">Admin</Link></li>}
        {!isAuthenticated ? (
          <li><Link to="/login">Login</Link></li>
        ) : (
          <li>
            <button 
              onClick={onLogout} 
              className="btn btn-secondary"
              style={{ padding: '5px 15px' }}
            >
              Logout
            </button>
          </li>
        )}
      </ul>
    </nav>
  )
}

export default Navbar
