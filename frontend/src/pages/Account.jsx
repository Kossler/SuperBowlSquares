import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  changeMyPassword,
  createMyProfile,
  deleteMyProfile,
  getAccountMe,
  updateMyEmail,
  updateMyPaymentInfo,
  updateMyProfile,
} from '../services/accountService'
import { useAuth } from '../context/AuthContext.jsx'
import { setUser as storeUser } from '../utils/auth'
import './Account.css'

function Account() {
  const { login, user: authUser, updateUser } = useAuth()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (!error) return
    window.alert(error)
  }, [error])

  const normalizeFullName = useCallback((value) => (value ?? '').trim().toLowerCase(), [])

  const [me, setMe] = useState(null)

  const [newEmail, setNewEmail] = useState('')
  const [emailPassword, setEmailPassword] = useState('')

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')

  const [editingProfile, setEditingProfile] = useState(null)
  const [profileData, setProfileData] = useState({ fullName: '' })

  const [paymentEdits, setPaymentEdits] = useState({})

  const applyMeData = useCallback(
    (data) => {
      setMe(data)

      const nextPaymentEdits = {}
      const paymentInfos = Array.isArray(data?.paymentInfos) ? data.paymentInfos : []
      for (const p of paymentInfos) {
        if (p?.id == null) continue
        nextPaymentEdits[p.id] = {
          paymentMethod: p.paymentMethod ?? 'Venmo',
          accountIdentifier: p.accountIdentifier ?? '',
        }
      }
      setPaymentEdits(nextPaymentEdits)

      // Keep localStorage user in sync for Entry profile dropdown usage
      storeUser({
        email: data?.email,
        isAdmin: data?.isAdmin,
        profiles: Array.isArray(data?.profiles) ? data.profiles : [],
      })

      if (typeof updateUser === 'function') {
        updateUser({
          email: data?.email,
          isAdmin: data?.isAdmin,
          profiles: Array.isArray(data?.profiles) ? data.profiles : [],
        })
      }
    },
    [updateUser]
  )

  const refreshMe = useCallback(async () => {
    setError('')
    setSuccess('')
    const data = await getAccountMe()
    applyMeData(data)
  }, [applyMeData])

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true)
        await refreshMe()
      } catch (e) {
        setError('Failed to load account details.')
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [refreshMe])

  const sortedProfiles = useMemo(() => {
    const list = Array.isArray(me?.profiles) ? [...me.profiles] : []
    list.sort((a, b) => (a.profileNumber ?? 0) - (b.profileNumber ?? 0))
    return list
  }, [me])

  const sortedPayments = useMemo(() => {
    const list = Array.isArray(me?.paymentInfos) ? [...me.paymentInfos] : []
    list.sort((a, b) => (a.id ?? 0) - (b.id ?? 0))
    return list
  }, [me])

  const handleUpdateEmail = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      const response = await updateMyEmail({ newEmail, currentPassword: emailPassword })
      login(response) // updates token + stored user
      setSuccess('Email updated.')
      setNewEmail('')
      setEmailPassword('')
      await refreshMe()
    } catch (err) {
      setError('Failed to update email.')
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      const response = await changeMyPassword({ currentPassword, newPassword })
      login(response)
      setSuccess('Password updated.')
      setCurrentPassword('')
      setNewPassword('')
    } catch (err) {
      setError('Failed to update password.')
    }
  }

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // Front-end uniqueness check (case-insensitive, trimmed) against current user's profiles
    const candidate = normalizeFullName(profileData.fullName)
    if (!candidate) {
      setError('Square name is required.')
      return
    }
    const duplicate = sortedProfiles.some((p) => {
      if (!p) return false
      if (editingProfile?.id != null && p.id === editingProfile.id) return false
      return normalizeFullName(p.fullName) === candidate
    })
    if (duplicate) {
      setError('A square name with this full name already exists.')
      return
    }

    try {
      const payload = { fullName: profileData.fullName.trim() }

      if (editingProfile) {
        await updateMyProfile(editingProfile.id, payload)
        setSuccess('Square name updated.')
      } else {
        await createMyProfile(payload)
        setSuccess('Square name added.')
      }

      setEditingProfile(null)
      setProfileData({ fullName: '' })
      await refreshMe()
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || ''
      if (msg.toLowerCase().includes('full name')) {
        setError('A square name with this full name already exists.')
      } else {
        setError(editingProfile ? 'Failed to update square name.' : 'Failed to add square name.')
      }
    }
  }

  const handleDeleteProfile = async (profileId) => {
    setError('')
    setSuccess('')

    if (sortedProfiles.length <= 1) {
      setError('At least one square name is required. You cannot delete your last square name.')
      return
    }

    if (profileId == null) {
      setError('Failed to delete square name: missing square name id.')
      return
    }

    try {
      const updated = await deleteMyProfile(profileId)
      setSuccess('Square name deleted.')
      if (updated) {
        applyMeData(updated)
      } else {
        await refreshMe()
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || ''
      setError(msg ? `Failed to delete square name: ${msg}` : 'Failed to delete square name.')
    }
  }

  const handleSavePayment = async (paymentInfo) => {
    setError('')
    setSuccess('')

    try {
      const edits = paymentEdits[paymentInfo.id] || {}
      const nextMethod = (edits.paymentMethod ?? paymentInfo.paymentMethod ?? '').trim()
      const nextIdentifier = (edits.accountIdentifier ?? paymentInfo.accountIdentifier ?? '').trim()

      const normalizedIdentifier = nextMethod === 'Cash' ? 'Cash' : nextIdentifier

      if (!nextMethod || !normalizedIdentifier) {
        setError('Payment method and identifier are required.')
        return
      }

      await updateMyPaymentInfo(paymentInfo.id, {
        paymentMethod: nextMethod,
        accountIdentifier: normalizedIdentifier,
        isPrimary: paymentInfo.isPrimary === true,
      })
      setSuccess('Payment method updated.')
      await refreshMe()
    } catch (err) {
      setError('Failed to update payment method.')
    }
  }

  if (loading) return <div className="loading">Loading...</div>

  return (
    <div className="container">
      <h1>Account</h1>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <div className="card">
        <h2>Email</h2>
        <p className="account-muted">Current: <strong>{me?.email ?? authUser?.email ?? ''}</strong></p>
        <form onSubmit={handleUpdateEmail} className="account-form">
          <div className="form-group">
            <label>New Email:</label>
            <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Current Password:</label>
            <input type="password" value={emailPassword} onChange={(e) => setEmailPassword(e.target.value)} required />
          </div>
          <button className="btn btn-primary" type="submit">Update Email</button>
        </form>
      </div>

      <div className="card">
        <h2>Password</h2>
        <form onSubmit={handleChangePassword} className="account-form">
          <div className="form-group">
            <label>Current Password:</label>
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>New Password:</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} />
          </div>
          <button className="btn btn-primary" type="submit">Change Password</button>
        </form>
      </div>

      <div className="card">
        <h2>Square Names</h2>
        <div className="account-list">
          {sortedProfiles.map((p) => (
            <div key={p.id} className="account-profile-row">
              <div>
                <strong>{p.fullName}</strong>
                {p.profileNumber != null ? <span className="account-muted"> (#{p.profileNumber})</span> : null}
              </div>
              <div className="account-profile-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setEditingProfile(p)
                    setProfileData({
                      fullName: p.fullName ?? '',
                    })
                  }}
                >
                  Edit
                </button>
                <button className="btn btn-danger" type="button" onClick={() => handleDeleteProfile(p.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleProfileSubmit} className="account-form" style={{ marginTop: '14px' }}>
          <h3 style={{ marginTop: 0 }}>
            {editingProfile ? 'Edit Square Name' : 'Add Square Name'}
          </h3>
          <div className="form-group">
            <label>Full Name:</label>
            <input
              value={profileData.fullName}
              onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
              required
            />
          </div>
          
          <button className="btn btn-primary" type="submit">
            {editingProfile ? 'Update Square Name' : 'Add Square Name'}
          </button>
          {editingProfile && (
            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => {
                setEditingProfile(null)
                setProfileData({ fullName: '' })
              }}
              style={{ marginLeft: '8px' }}
            >
              Cancel
            </button>
          )}
        </form>
      </div>

      <div className="card">
        <h2>Payment Methods</h2>
        <div className="account-list">
          {sortedPayments.length === 0 ? (
            <div className="account-muted">No payment method on file.</div>
          ) : null}
          {sortedPayments.map((p) => (
            <div key={p.id} className="account-payment-row">
              <div className="account-payment-fields">
                <div className="form-group">
                  <label>Method</label>
                  <select
                    value={paymentEdits[p.id]?.paymentMethod ?? p.paymentMethod ?? 'Venmo'}
                    onChange={(e) =>
                      setPaymentEdits((prev) => ({
                        ...prev,
                        [p.id]: {
                          ...(prev[p.id] || { paymentMethod: 'Venmo', accountIdentifier: '' }),
                          paymentMethod: e.target.value,
                        },
                      }))
                    }
                  >
                    <option value="Venmo">Venmo</option>
                    <option value="Zelle">Zelle</option>
                    <option value="PayPal">PayPal</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Account Name / Phone / Email</label>
                  <input
                    value={(paymentEdits[p.id]?.paymentMethod ?? p.paymentMethod) === 'Cash'
                      ? 'Cash'
                      : (paymentEdits[p.id]?.accountIdentifier ?? p.accountIdentifier ?? '')}
                    onChange={(e) =>
                      setPaymentEdits((prev) => ({
                        ...prev,
                        [p.id]: {
                          ...(prev[p.id] || { paymentMethod: 'Venmo', accountIdentifier: '' }),
                          accountIdentifier: e.target.value,
                        },
                      }))
                    }
                    disabled={(paymentEdits[p.id]?.paymentMethod ?? p.paymentMethod) === 'Cash'}
                    required
                  />
                </div>
              </div>
              <div className="account-payment-actions">
                <button className="btn btn-primary" type="button" onClick={() => handleSavePayment(p)}>
                  Save
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Account
