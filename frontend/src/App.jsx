import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Entry from './pages/Entry'
import Login from './pages/Login'
import Admin from './pages/Admin'
import { useAuth } from './context/AuthContext.jsx'

function App() {
  const { isAuthenticated, isAdmin } = useAuth();

  return (
    <Router>
      <Navbar />
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
            isAuthenticated ? <Navigate to="/" /> : <Login />
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
