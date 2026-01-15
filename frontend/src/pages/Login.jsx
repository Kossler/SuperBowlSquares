import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login as loginService, signup as signupService } from '../services/squaresService'
import { useAuth } from '../context/AuthContext.jsx'
import './Login.css'

function Login() {
  const navigate = useNavigate()
  const { login } = useAuth();
  const [isSignup, setIsSignup] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [profiles, setProfiles] = useState([{ fullName: '' }])
  const [paymentMethod, setPaymentMethod] = useState('Venmo')
  const [accountIdentifier, setAccountIdentifier] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!error) return
    window.alert(error)
  }, [error])

  const normalizeFullName = (value) => (value ?? '').trim().toLowerCase()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await loginService(email, password)
      login(response)
      navigate('/entry')
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
      setError('All square names must be filled')
      return
    }

    // Front-end uniqueness check (case-insensitive, trimmed)
    {
      const normalized = profiles.map((p) => normalizeFullName(p.fullName)).filter(Boolean)
      const unique = new Set(normalized)
      if (unique.size !== normalized.length) {
        setError('Square names must be unique.')
        return
      }
    }

    const normalizedAccountIdentifier = paymentMethod === 'Cash'
      ? 'Cash'
      : accountIdentifier

    if (!normalizedAccountIdentifier.trim()) {
      setError('Payment information is required')
      return
    }

    setLoading(true)

    try {
      const signupData = {
        email,
        password,
        profiles: profiles
          .filter((p) => p.fullName.trim())
          .map((p) => ({ fullName: p.fullName.trim() })),
        paymentInfo: {
          paymentMethod,
          accountIdentifier: normalizedAccountIdentifier,
        },
      }

      const response = await signupService(signupData)
      login(response)
      navigate('/entry')
    } catch (err) {
      let backendMsg = err?.response?.data?.message || err?.response?.data?.error || '';
      if (backendMsg.toLowerCase().includes('full name')) {
        setError('A square name with this full name already exists. Please choose a different name.');
      } else if (backendMsg.toLowerCase().includes('email already exists')) {
        setError('Email already exists. Please use a different email.');
      } else if (backendMsg) {
        setError(backendMsg);
      } else {
        setError('Failed to create account.');
      }
    } finally {
      setLoading(false)
    }
  }

  const addProfile = () => {
    if (profiles.length < 10) {
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
                  <label>Square Names (up to 10):</label>
                  {profiles.map((profile, index) => (
                    <div key={index} className="profile-input-group">
                      <input
                        type="text"
                        value={profile.fullName}
                        onChange={(e) => updateProfile(index, e.target.value)}
                        placeholder={`Square Name ${index + 1}`}
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
                  {profiles.length < 10 && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={addProfile}
                      style={{ marginTop: '10px' }}
                    >
                      Add Square Name
                    </button>
                  )}
                </div>

                <div className="form-group">
                  <label>Payment Method:</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => {
                      const next = e.target.value
                      setPaymentMethod(next)
                      if (next === 'Cash') {
                        setAccountIdentifier('Cash')
                      } else if (accountIdentifier.trim() === 'Cash') {
                        setAccountIdentifier('')
                      }
                    }}
                  >
                    <option value="Venmo">Venmo</option>
                    <option value="Zelle">Zelle</option>
                    <option value="PayPal">PayPal</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>

                {paymentMethod !== 'Cash' ? (
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
                ) : null}
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
