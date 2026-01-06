import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, signup } from '../services/squaresService'
import './Login.css'

function Login({ onLogin }) {
  const navigate = useNavigate()
  const [isSignup, setIsSignup] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [profiles, setProfiles] = useState([{ fullName: '' }])
  const [paymentMethod, setPaymentMethod] = useState('Venmo')
  const [accountIdentifier, setAccountIdentifier] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await login(email, password)
      onLogin(response.token, response.isAdmin)
      navigate('/')
    } catch (err) {
      setError('Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    setError('')

    if (profiles.some(p => !p.fullName.trim())) {
      setError('All profile names must be filled')
      return
    }

    if (!accountIdentifier.trim()) {
      setError('Payment information is required')
      return
    }

    setLoading(true)

    try {
      const signupData = {
        email,
        password,
        profiles: profiles.filter(p => p.fullName.trim()).map(p => ({ fullName: p.fullName })),
        paymentInfo: {
          paymentMethod,
          accountIdentifier,
        },
      }

      const response = await signup(signupData)
      onLogin(response.token, response.isAdmin)
      navigate('/')
    } catch (err) {
      setError('Failed to create account. Email may already exist.')
    } finally {
      setLoading(false)
    }
  }

  const addProfile = () => {
    if (profiles.length < 9) {
      setProfiles([...profiles, { fullName: '' }])
    }
  }

  const removeProfile = (index) => {
    if (profiles.length > 1) {
      setProfiles(profiles.filter((_, i) => i !== index))
    }
  }

  const updateProfile = (index, value) => {
    const newProfiles = [...profiles]
    newProfiles[index].fullName = value
    setProfiles(newProfiles)
  }

  return (
    <div className="container">
      <div className="login-container">
        <div className="card login-card">
          <h1>{isSignup ? 'Sign Up' : 'Login'}</h1>

          {error && <div className="error">{error}</div>}

          <form onSubmit={isSignup ? handleSignup : handleLogin}>
            <div className="form-group">
              <label>Email:</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Password:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            {isSignup && (
              <>
                <div className="form-group">
                  <label>Profiles (up to 9):</label>
                  {profiles.map((profile, index) => (
                    <div key={index} className="profile-input-group">
                      <input
                        type="text"
                        value={profile.fullName}
                        onChange={(e) => updateProfile(index, e.target.value)}
                        placeholder={`Profile ${index + 1} Name`}
                        required
                      />
                      {profiles.length > 1 && (
                        <button
                          type="button"
                          className="btn btn-danger"
                          onClick={() => removeProfile(index)}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  {profiles.length < 9 && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={addProfile}
                      style={{ marginTop: '10px' }}
                    >
                      Add Profile
                    </button>
                  )}
                </div>

                <div className="form-group">
                  <label>Payment Method:</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="Venmo">Venmo</option>
                    <option value="CashApp">CashApp</option>
                    <option value="Zelle">Zelle</option>
                    <option value="PayPal">PayPal</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Account Name / Phone / Email:</label>
                  <input
                    type="text"
                    value={accountIdentifier}
                    onChange={(e) => setAccountIdentifier(e.target.value)}
                    placeholder="Your payment account identifier"
                    required
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', marginTop: '20px' }}
            >
              {loading ? 'Processing...' : (isSignup ? 'Sign Up' : 'Login')}
            </button>
          </form>

          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <button
              onClick={() => {
                setIsSignup(!isSignup)
                setError('')
              }}
              className="btn btn-secondary"
            >
              {isSignup ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
