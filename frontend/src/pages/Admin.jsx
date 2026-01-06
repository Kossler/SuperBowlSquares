import { useState, useEffect } from 'react'
import {
  getAllPools,
  createPool,
  togglePoolStatus,
  updatePool,
  deletePool,
} from '../services/squaresService'
import './Admin.css'

function Admin() {
  const [activeTab, setActiveTab] = useState('pools')
  const [pools, setPools] = useState([])
  const [showCreatePool, setShowCreatePool] = useState(false)
  const [showEditPool, setShowEditPool] = useState(false)
  const [editingPool, setEditingPool] = useState(null)
  const [newPool, setNewPool] = useState({
    poolName: '',
    betAmount: '',
  })
  const [editPool, setEditPool] = useState({
    id: '',
    poolName: '',
    betAmount: '',
  })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (activeTab === 'pools') {
      loadPools()
    }
  }, [activeTab])

  const loadPools = async () => {
    try {
      const data = await getAllPools()
      setPools(data)
    } catch (err) {
      setError('Failed to load pools')
    }
  }

  const handleCreatePool = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')

    try {
      await createPool({
        ...newPool,
        betAmount: parseFloat(newPool.betAmount),
      })
      setMessage('Pool created successfully!')
      setShowCreatePool(false)
      setNewPool({
        poolName: '',
        betAmount: '',
      })
      loadPools()
    } catch (err) {
      setError('Failed to create pool')
    }
  }

  const handleTogglePool = async (poolId) => {
    try {
      await togglePoolStatus(poolId)
      setMessage('Pool status updated')
      loadPools()
    } catch (err) {
      setError('Failed to toggle pool status')
    }
  }

  const handleDeletePool = async (poolId) => {
    if (window.confirm('Are you sure you want to delete this pool? This action is permanent.')) {
      try {
        await deletePool(poolId);
        setMessage('Pool deleted successfully');
        loadPools();
      } catch (err) {
        setError('Failed to delete pool');
      }
    }
  };

  const handleEditPool = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')

    try {
      const response = await fetch(`/admin/pools/${editPool.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('superbowl_token')}`
        },
        body: JSON.stringify({
          poolName: editPool.poolName,
          betAmount: parseFloat(editPool.betAmount),
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update pool')
      }

      setMessage('Pool updated successfully!')
      setShowEditPool(false)
      loadPools()
    } catch (err) {
      setError('Failed to update pool: ' + err.message)
    }
  }

  return (
    <div className="container">
      <h1>Admin Panel</h1>

      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === 'pools' ? 'active' : ''}`}
          onClick={() => setActiveTab('pools')}
        >
          Manage Pools
        </button>
      </div>

      {message && <div className="success">{message}</div>}
      {error && <div className="error">{error}</div>}

      {activeTab === 'pools' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Pools</h2>
            <button 
              className="btn btn-primary" 
              onClick={() => {
                setShowCreatePool(true)
              }}
            >
              Create New Pool
            </button>
          </div>

          <div className="table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Bet Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pools.map(pool => (
                  <tr key={pool.id}>
                    <td>{pool.poolName}</td>
                    <td>${pool.betAmount}</td>
                    <td>
                      <span className={`status-badge ${pool.isActive ? 'active' : 'inactive'}`}>
                        {pool.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary"
                        onClick={() => handleTogglePool(pool.id)}
                      >
                        Toggle
                      </button>
                      <button
                        className="btn btn-primary"
                        onClick={() => {
                          setEditPool({
                            id: pool.id,
                            poolName: pool.poolName,
                            betAmount: pool.betAmount,
                          })
                          setShowEditPool(true)
                        }}
                        style={{ marginLeft: '10px' }}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleDeletePool(pool.id)}
                        style={{ marginLeft: '10px' }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showCreatePool && (
        <div className="modal" onClick={() => setShowCreatePool(false)}>
          <div
            className="modal-content"
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Create New Pool</h2>
              <button className="close-btn" onClick={() => setShowCreatePool(false)}>×</button>
            </div>
            <form onSubmit={handleCreatePool}>
                  <div className="form-group">
                    <label>Pool Name:</label>
                    <input
                      type="text"
                      value={newPool.poolName}
                      onChange={(e) => setNewPool({ ...newPool, poolName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Bet Amount:</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newPool.betAmount}
                      onChange={(e) => setNewPool({ ...newPool, betAmount: e.target.value })}
                      required
                    />
                  </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  Create Pool
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowCreatePool(false)
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditPool && (
        <div className="modal-overlay">
          <div
            className="modal-content"
          >
            <h2>Edit Pool</h2>
            <form onSubmit={handleEditPool}>
                  <div className="form-group">
                    <label>Pool Name:</label>
                    <input
                      type="text"
                      value={editPool.poolName}
                      onChange={(e) => setEditPool({ ...editPool, poolName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Bet Amount:</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editPool.betAmount}
                      onChange={(e) => setEditPool({ ...editPool, betAmount: e.target.value })}
                      required
                    />
                  </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowEditPool(false)
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Admin
