import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Entry from './pages/Entry'
import Login from './pages/Login'
import Admin from './pages/Admin'
import { getToken, getUser, removeToken } from './utils/auth'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = getToken()
    const user = getUser()
    if (token && user) {
      setIsAuthenticated(true)
      // Check both 'isAdmin' and 'admin' fields for compatibility
      setIsAdmin(user.isAdmin || user.admin || false)
    } else if (token) {
      // Fallback: try to decode JWT token if user data not in localStorage
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        setIsAuthenticated(true)
        setIsAdmin(payload.authorities?.includes('ROLE_ADMIN') || false)
      } catch (error) {
        removeToken()
      }
    }
    setLoading(false)
  }, [])

  const handleLogin = (token, admin) => {
    setIsAuthenticated(true)
    setIsAdmin(admin)
  }

  const handleLogout = () => {
    removeToken()
    setIsAuthenticated(false)
    setIsAdmin(false)
  }

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  return (
    <Router>
      <Navbar 
        isAuthenticated={isAuthenticated} 
        isAdmin={isAdmin} 
        onLogout={handleLogout} 
      />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route 
          path="/entry" 
          element={
            isAuthenticated ? <Entry /> : <Navigate to="/login" />
          } 
        />
        <Route 
          path="/login" 
          element={
            isAuthenticated ? <Navigate to="/" /> : <Login onLogin={handleLogin} />
          } 
        />
        <Route 
          path="/admin" 
          element={
            isAuthenticated && isAdmin ? <Admin /> : <Navigate to="/" />
          } 
        />
      </Routes>
    </Router>
  )
}

export default App
