// Add AFC/NFC score fetching for Edit Pool modal
import { getAfcScoresFromSheet, getNfcScoresFromSheet } from '../services/squaresService'
import { useMemo, useState, useEffect } from 'react'
import {
  getAllPools,
  createPool,
  togglePoolStatus,
  updatePool,
  deletePool,
  getAllUsers,
  makeUserAdmin,
  updateUser,
  getUserById,
  createProfile,
  updateProfile,
  deleteProfile,
  createPaymentInfo,
  updatePaymentInfo,
  deletePaymentInfo,
  updateCellInSheet,
  getPoolById
} from '../services/squaresService'
import './Admin.css'
import SquaresGrid from '../components/SquaresGrid'
import { getSquaresByPool, claimSquare, unclaimSquare, getAllUsers as fetchAllUsers, getAllProfiles } from '../services/squaresService'

function Admin() {
    // All useState declarations at the top
    const [activeTab, setActiveTab] = useState('pools');
    const [editSquaresPool, setEditSquaresPool] = useState(null);
    const [editSquares, setEditSquares] = useState([]);
    const [allProfiles, setAllProfiles] = useState([]);
    const [showEditSquareModal, setShowEditSquareModal] = useState(false);
    const [selectedSquare, setSelectedSquare] = useState(null);
    const [selectedProfileId, setSelectedProfileId] = useState('');
    const [editSquaresError, setEditSquaresError] = useState('');
    const [pools, setPools] = useState([]);
    const [users, setUsers] = useState([]);
    const [showCreatePool, setShowCreatePool] = useState(false);
    const [showEditPool, setShowEditPool] = useState(false);
    const [editingPool, setEditingPool] = useState(null);
    const [editingUser, setEditingUser] = useState(null);
    const [showEditUser, setShowEditUser] = useState(false);
    const [activeModalTab, setActiveModalTab] = useState('details');
    const [userUpdateData, setUserUpdateData] = useState({ email: '', password: '' });
    const [profileData, setProfileData] = useState({ fullName: '', profileNumber: '' });
    const [paymentInfoData, setPaymentInfoData] = useState({ paymentMethod: 'Venmo', accountIdentifier: '', isPrimary: true });
    const [editingProfile, setEditingProfile] = useState(null);
    const [editingPaymentInfo, setEditingPaymentInfo] = useState(null);
    // useState declarations for newPool, editPool, message, and error
    const [editPool, setEditPool] = useState(null);
    const [newPool, setNewPool] = useState({ poolName: '', betAmount: '' });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    // AFC/NFC scores for the edit pool modal
    const [afcScores, setAfcScores] = useState(null);
    const [nfcScores, setNfcScores] = useState(null);

    // Fetch AFC/NFC scores when editPool changes (Edit Pool modal open)
    useEffect(() => {
      if (showEditPool && editPool && editPool.poolName) {
        const fetchScores = async () => {
          try {
            const spreadsheetId = '1zXue8QE0GBV5GRWv7k5JSR67yRjMf3o7Cj9egY4Fguk';
            const sheetName = editPool.poolName || 'Sheet1';
            const afc = await getAfcScoresFromSheet(spreadsheetId, sheetName);
            setAfcScores(afc);
            const nfc = await getNfcScoresFromSheet(spreadsheetId, sheetName);
            setNfcScores(nfc);
          } catch (err) {
            setAfcScores(null);
            setNfcScores(null);
          }
        };
        fetchScores();
      } else {
        setAfcScores(null);
        setNfcScores(null);
      }
    }, [showEditPool, editPool]);

    // Always load all profiles when Edit Pool modal is open (for dropdown)
    useEffect(() => {
      if (showEditPool) {
        getAllProfiles().then(profiles => {
          setAllProfiles(Array.isArray(profiles) ? profiles : []);
        });
      }
    }, [showEditPool]);

    // Load squares for selected pool
    useEffect(() => {
      if (showEditPool && editPool && editPool.id) {
        getSquaresByPool(editPool.id).then(squares => {
          setEditSquares(Array.isArray(squares) ? squares : [])
        });
      }
    }, [showEditPool, editPool]);

    const editSquaresSheetName = useMemo(() => {
      return editSquaresPool?.poolName || editPool?.poolName || 'Sheet1'
    }, [editPool?.poolName, editSquaresPool?.poolName])
    // Admin square click handler
    const handleAdminSquareClick = async (square) => {
      // If a profile is selected in the dropdown, assign/unassign directly
      if (selectedProfileId) {
        try {
          if (square.profile && square.profile.id === parseInt(selectedProfileId)) {
            // Unclaim if already claimed by selected profile
            await unclaimSquare(editSquaresPool.id, square.rowPosition, square.colPosition);
            // Google Sheets sync for removal
            const spreadsheetId = '1zXue8QE0GBV5GRWv7k5JSR67yRjMf3o7Cj9egY4Fguk';
            await updateCellInSheet(
              spreadsheetId,
              editSquaresSheetName,
              square.rowPosition,
              square.colPosition,
              ''
            );
          } else {
            // Claim for selected profile
            await claimSquare({
              poolId: editSquaresPool.id,
              rowPosition: square.rowPosition,
              colPosition: square.colPosition,
              profileId: parseInt(selectedProfileId),
            });
            // Google Sheets sync for claim
            const spreadsheetId = '1zXue8QE0GBV5GRWv7k5JSR67yRjMf3o7Cj9egY4Fguk';
            const profileObj = allProfiles.find(p => p.id === parseInt(selectedProfileId));
            const value = profileObj ? profileObj.fullName : '';
            await updateCellInSheet(
              spreadsheetId,
              editSquaresSheetName,
              square.rowPosition,
              square.colPosition,
              value
            );
          }
          getSquaresByPool(editSquaresPool.id).then(setEditSquares);
        } catch (err) {
          setEditSquaresError('Failed to update square.');
        }
      } else {
        // No profile selected: do nothing
        return;
      }
    };

    // Admin assign profile to square
    const handleAdminAssignProfile = async () => {
      if (!selectedSquare || !editSquaresPool) return;
      try {
        if (selectedProfileId) {
          await claimSquare({
            poolId: editSquaresPool.id,
            rowPosition: selectedSquare.rowPosition,
            colPosition: selectedSquare.colPosition,
            profileId: parseInt(selectedProfileId),
          });
        } else {
          // If already unassigned, just close modal
          if (!selectedSquare.profile && !selectedSquare.profileName) {
            setShowEditSquareModal(false);
            return;
          }
          await unclaimSquare(editSquaresPool.id, selectedSquare.rowPosition, selectedSquare.colPosition);
        }

        // --- Google Sheets Sync Logic ---
        const spreadsheetId = '1zXue8QE0GBV5GRWv7k5JSR67yRjMf3o7Cj9egY4Fguk';
        const value = selectedProfileId
          ? (allProfiles.find(p => p.id === parseInt(selectedProfileId))?.fullName || '')
          : '';
        await updateCellInSheet(
          spreadsheetId,
          editSquaresSheetName,
          selectedSquare.rowPosition,
          selectedSquare.colPosition,
          value
        );

        setShowEditSquareModal(false);
        getSquaresByPool(editSquaresPool.id).then(setEditSquares);
      } catch (err) {
        setEditSquaresError('Failed to update square.');
      }
    };
  // Removed duplicate useState declarations for pools, users, showCreatePool, showEditPool, editingPool, editingUser, showEditUser, activeModalTab, userUpdateData, profileData, paymentInfoData, editingProfile, editingPaymentInfo

  // Removed duplicate useState declarations for newPool, editPool, message, and error

  useEffect(() => {
    if (activeTab === 'pools') {
      loadPools()
    } else if (activeTab === 'users') {
      loadUsers()
    }
  }, [activeTab])

  useEffect(() => {
    if (editingUser) {
      setUserUpdateData({ email: editingUser.email, password: '' });
      setProfileData({ fullName: '', profileNumber: '' });
      setPaymentInfoData({ paymentMethod: 'Venmo', accountIdentifier: '', isPrimary: true });
      setEditingProfile(null);
      setEditingPaymentInfo(null);
    }
  }, [editingUser]);

  const loadPools = async () => {
    try {
      const response = await getAllPools()
      setPools(response)
    } catch (err) {
      setError('Failed to load pools')
    }
  }

  const loadUsers = async () => {
    try {
      const response = await getAllUsers()
      if (response && Array.isArray(response.data)) {
        setUsers(response.data)
      } else {
        setUsers([]); // Set to empty array to prevent crash
      }
    } catch (err) {
      setError('Failed to load users')
    }
  }

  const handleMakeAdmin = async (userId) => {
    if (window.confirm('Are you sure you want to make this user an admin?')) {
      try {
        await makeUserAdmin(userId)
        setMessage('User promoted to admin successfully')
        loadUsers()
      } catch (err) {
        setError('Failed to promote user')
      }
    }
  }

  const handleOpenEditUserModal = async (userId) => {
    try {
      const response = await getUserById(userId);
      setEditingUser(response.data);
      setShowEditUser(true);
    } catch (err) {
      setError('Failed to load user details.');
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;

    setError('');
    setMessage('');

    try {
      await updateUser(editingUser.id, userUpdateData);
      setMessage('User updated successfully!');
      setShowEditUser(false);
      setEditingUser(null);
      loadUsers();
    } catch (err) {
      setError('Failed to update user');
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    setError('');
    setMessage('');

    try {
      if (editingProfile) {
        await updateProfile(editingProfile.id, profileData);
        setMessage('Profile updated successfully!');
      } else {
        // Auto-assign profile number
        const profiles = editingUser.profiles || [];
        const maxProfileNumber = profiles.length > 0 ? Math.max(...profiles.map(p => Number(p.profileNumber) || 0)) : 0;
        const newProfile = {
          ...profileData,
          profileNumber: maxProfileNumber + 1
        };
        await createProfile(editingUser.id, newProfile);
        setMessage('Profile created successfully!');
      }
      setEditingProfile(null);
      setProfileData({ fullName: '', profileNumber: '' });
      // Refresh the user data in the modal
      const response = await getUserById(editingUser.id);
      setEditingUser(response.data);
    } catch (err) {
      console.error('Profile save error:', err);
      let errorMsg = 'Failed to save profile.';
      const backendMsg = err?.response?.data?.message || err?.response?.data?.error || '';
      if ((err.response && err.response.status === 400 && typeof backendMsg === 'string' && backendMsg.toLowerCase().includes('full name')) ||
          (typeof err.message === 'string' && err.message.toLowerCase().includes('full name'))) {
        errorMsg = 'A profile with this full name already exists. Please choose a different name.';
      } else if (backendMsg) {
        errorMsg = backendMsg;
      }
      window.alert(errorMsg);
      setError('');
    }
  };

  const handleDeleteProfile = async (profileId) => {
    if (window.confirm('Are you sure you want to delete this profile?')) {
      try {
        await deleteProfile(profileId);
        setMessage('Profile deleted successfully!');
        // Refresh the user data in the modal
        const response = await getUserById(editingUser.id);
        setEditingUser(response.data);
      } catch (err) {
        setError('Failed to delete profile.');
      }
    }
  };

  const handlePaymentInfoSubmit = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    setError('');
    setMessage('');

    try {
      if (editingPaymentInfo) {
        await updatePaymentInfo(editingPaymentInfo.id, paymentInfoData);
        setMessage('Payment info updated successfully!');
      } else {
        await createPaymentInfo(editingUser.id, paymentInfoData);
        setMessage('Payment info created successfully!');
      }
      setEditingPaymentInfo(null);
      setPaymentInfoData({ paymentMethod: 'Venmo', accountIdentifier: '', isPrimary: true });
      // Refresh the user data in the modal
      const response = await getUserById(editingUser.id);
      setEditingUser(response.data);
    } catch (err) {
      setError('Failed to save payment info.');
    }
  };

  const handleDeletePaymentInfo = async (paymentInfoId) => {
    if (window.confirm('Are you sure you want to delete this payment method?')) {
      try {
        await deletePaymentInfo(paymentInfoId);
        setMessage('Payment method deleted successfully!');
        // Refresh the user data in the modal
        const response = await getUserById(editingUser.id);
        setEditingUser(response.data);
      } catch (err) {
        setError('Failed to delete payment method.');
      }
    }
  };


  const handleCreatePool = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')

    // Step 2: Prepare payload
    const payload = {
      poolName: newPool.poolName,
      betAmount: newPool.betAmount === '' ? null : newPool.betAmount.toString()
    };

    try {
      const response = await createPool(payload);
      setMessage('Pool created successfully!')
      setShowCreatePool(false)
      setNewPool({
        poolName: '',
        betAmount: '',
      })
      loadPools()
    } catch (err) {
      if (err.response) {
        setError(err.response.data?.message || JSON.stringify(err.response.data) || 'Failed to create pool');
      } else {
        setError('Failed to create pool: ' + err.message);
      }
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
      // Use the updatePool function from squaresService.js
      await updatePool(editPool.id, {
        poolName: editPool.poolName,
        betAmount: parseFloat(editPool.betAmount),
      });
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
        {/* Edit Squares tab removed, editable grid is now in Edit Pool modal */}
        <button
          className={`tab-btn ${activeTab === 'pools' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('pools');
            setShowEditUser(false);
          }}
        >
          Manage Pools
        </button>
        <button
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('users');
            setShowEditPool(false);
          }}
        >
          Manage Users
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
                {Array.isArray(pools) && pools.map(pool => (
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
                          setEditSquaresPool({
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

      {activeTab === 'users' && (
        <div className="card">
          <h2>Users</h2>
          <div className="table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Is Admin?</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(users) && users.map((user, idx) => (
                  <tr key={user.id ?? idx}>
                    <td>{user.email}</td>
                    <td>{user.isAdmin ? 'Yes' : 'No'}</td>
                    <td>
                      <button
                        className="btn btn-primary"
                        onClick={() => handleOpenEditUserModal(user.id)}
                      >
                        Manage
                      </button>
                      {!user.isAdmin && (
                        <button
                          className="btn btn-primary"
                          onClick={() => handleMakeAdmin(user.id)}
                          style={{ marginLeft: '10px' }}
                        >
                          Make Admin
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showEditUser && editingUser && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Edit User: {editingUser.email}</h2>

            <div className="modal-tabs">
              <button className={`tab-button ${activeModalTab === 'details' ? 'active' : ''}`} onClick={() => setActiveModalTab('details')}>User Details</button>
              <button className={`tab-button ${activeModalTab === 'profiles' ? 'active' : ''}`} onClick={() => setActiveModalTab('profiles')}>Profiles</button>
              <button className={`tab-button ${activeModalTab === 'payment' ? 'active' : ''}`} onClick={() => setActiveModalTab('payment')}>Payment</button>
            </div>

            {activeModalTab === 'details' && (
              <form onSubmit={handleUpdateUser}>
                <div className="form-group">
                  <label>Email:</label>
                  <input
                    type="email"
                    value={userUpdateData.email}
                    onChange={(e) => setUserUpdateData({ ...userUpdateData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>New Password:</label>
                  <input
                    type="password"
                    placeholder="Leave blank to keep current password"
                    value={userUpdateData.password}
                    onChange={(e) => setUserUpdateData({ ...userUpdateData, password: e.target.value })}
                  />
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">
                    Save Changes
                  </button>
                </div>
              </form>
            )}

            {activeModalTab === 'profiles' && (
              <div className="user-details-section">
                <h3>Profiles</h3>
                <table className="sub-table">
                  <thead>
                    <tr>
                      <th>Full Name</th>
                      <th>Profile Number</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {editingUser?.profiles?.map((p, idx) => (
                      <tr key={p.id ?? idx}>
                        <td>{p.fullName}</td>
                        <td>{p.profileNumber}</td>
                        <td>
                          <button className="btn btn-secondary btn-sm" onClick={() => { setEditingProfile(p); setProfileData(p); }}>Edit</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDeleteProfile(p.id)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <form onSubmit={handleProfileSubmit} className="sub-form">
                  <h4>{editingProfile ? 'Edit Profile' : 'Add New Profile'}</h4>
                  <div className="form-group">
                    <input type="text" placeholder="Full Name" value={profileData.fullName} onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })} required />
                  </div>
                  <button type="submit" className="btn btn-primary">{editingProfile ? 'Update Profile' : 'Add Profile'}</button>
                  {editingProfile && <button type="button" className="btn btn-secondary" onClick={() => { setEditingProfile(null); setProfileData({ fullName: '', profileNumber: '' }); }}>Cancel Edit</button>}
                </form>
              </div>
            )}

            {activeModalTab === 'payment' && (
              <div className="user-details-section">
                <h3>Payment Methods</h3>
                <table className="sub-table">
                  <thead>
                    <tr>
                      <th>Method</th>
                      <th>Identifier</th>
                      <th>Primary</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {editingUser?.paymentInfos?.map((p, idx) => (
                      <tr key={p.id ?? idx}>
                        <td>{p.paymentMethod}</td>
                        <td>{p.accountIdentifier}</td>
                        <td>{p.isPrimary ? 'Yes' : 'No'}</td>
                        <td>
                          <button className="btn btn-secondary btn-sm" onClick={() => { setEditingPaymentInfo(p); setPaymentInfoData(p); }}>Edit</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDeletePaymentInfo(p.id)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <form onSubmit={handlePaymentInfoSubmit} className="sub-form">
                  <h4>{editingPaymentInfo ? 'Edit Payment Method' : 'Add New Payment Method'}</h4>
                  <div className="form-group">
                    <select value={paymentInfoData.paymentMethod} onChange={(e) => setPaymentInfoData({ ...paymentInfoData, paymentMethod: e.target.value })}>
                      <option value="Venmo">Venmo</option>
                      <option value="CashApp">CashApp</option>
                      <option value="Zelle">Zelle</option>
                      <option value="PayPal">PayPal</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <input type="text" placeholder="Account Identifier (e.g., @username, email)" value={paymentInfoData.accountIdentifier} onChange={(e) => setPaymentInfoData({ ...paymentInfoData, accountIdentifier: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>
                      <input type="checkbox" checked={paymentInfoData.isPrimary} onChange={(e) => setPaymentInfoData({ ...paymentInfoData, isPrimary: e.target.checked })} />
                      Set as Primary
                    </label>
                  </div>
                  <button type="submit" className="btn btn-primary">{editingPaymentInfo ? 'Update Method' : 'Add Method'}</button>
                  {editingPaymentInfo && <button type="button" className="btn btn-secondary" onClick={() => { setEditingPaymentInfo(null); setPaymentInfoData({ paymentMethod: 'Venmo', accountIdentifier: '', isPrimary: true }); }}>Cancel Edit</button>}
                </form>
              </div>
            )}

            <div className="form-actions">
               <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowEditUser(false);
                    setEditingUser(null);
                  }}
                >
                  Close
                </button>
            </div>
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
          <div className="modal-content" style={{ maxWidth: 'fit-content', width: 'fit-content', minWidth: 0 }}>
            <h2>Edit Pool</h2>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 32, marginTop: 0 }}>
              <form onSubmit={handleEditPool} style={{ minWidth: 320, maxWidth: 400 }}>
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
              <div style={{ flex: 1, minWidth: 0, maxWidth: 'fit-content' }}>
                {/* Edit Square Panel removed; will show as modal popup below */}
                <h3>Edit Squares for this Pool</h3>
                {/* Persistent profile dropdown for grid assignment */}
                <div style={{ marginTop: '1em', marginBottom: '1em' }}>
                  <label htmlFor="admin-profile-dropdown"><strong>Select Profile:</strong></label>
                  <select
                    id="admin-profile-dropdown"
                    value={selectedProfileId}
                    onChange={e => setSelectedProfileId(e.target.value)}
                    style={{ marginLeft: '1em', minWidth: '200px' }}
                  >
                    <option value="">-- Unassigned --</option>
                    {allProfiles.length === 0
                      ? <option disabled>-- No profiles found --</option>
                      : [...allProfiles].sort((a, b) => a.fullName.localeCompare(b.fullName)).map(profile => (
                          <option key={profile.id} value={profile.id}>{profile.fullName} ({profile.userEmail})</option>
                        ))}
                  </select>
                  <span style={{ marginLeft: '1em', color: '#888' }}>
                    Select a profile, then click a square to assign/unassign.
                  </span>
                </div>
                <div className="grid-wrapper">
                  <div className="grid-container">
                    {/* Score rows - 4 rows showing AFC numbers with quarter labels on left */}
                    <div className="score-rows-container">
                      {['Q1', 'Q2', 'Q3', 'FINAL'].map((quarter, qIdx) => {
                        const quarterColors = ['#FCE5CD', '#FBBC04', '#B6D7A8', '#00FFFF']
                        const quarterLabels = ['1Q', '1H', '3Q', 'FS']
                        // Use AFC numbers from editPool, fallback to 0-9
                        // Use AFC scores from sheet if available, else fallback
                        let afcRow = (afcScores && Array.isArray(afcScores) && afcScores[qIdx]) ? afcScores[qIdx] : (editPool.afcNumbers ? editPool.afcNumbers.split(',').map(n => n.trim()) : [0,1,2,3,4,5,6,7,8,9]);
                        return (
                          <div key={quarter} style={{ display: 'flex', marginBottom: '2px' }}>
                            {/* Empty spacing cells before label (qIdx cells) */}
                            {Array.from({ length: qIdx }).map((_, i) => (
                              <div
                                key={`space-before-${qIdx}-${i}`}
                                style={{
                                  width: '40px',
                                  height: '32px',
                                  border: '1px solid #333',
                                  backgroundColor: ['#FCE5CD', '#FBBC04', '#B6D7A8'][i] || quarterColors[qIdx],
                                  boxSizing: 'border-box',
                                  margin: 0,
                                  padding: 0,
                                }}
                              />
                            ))}
                            <div
                              style={{
                                width: '40px',
                                height: '32px',
                                border: '1px solid #333',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 'bold',
                                backgroundColor: quarterColors[qIdx],
                                fontSize: '14px',
                                boxSizing: 'border-box',
                                margin: 0,
                                padding: 0,
                              }}
                            >
                              {quarterLabels[qIdx]}
                            </div>
                            {/* Empty spacing cells after label (3 - qIdx cells) */}
                            {Array.from({ length: 3 - qIdx }).map((_, i) => (
                              <div
                                key={`space-after-${qIdx}-${i}`}
                                style={{
                                  width: '40px',
                                  height: '32px',
                                  border: '1px solid #333',
                                  backgroundColor: quarterColors[qIdx],
                                  boxSizing: 'border-box',
                                  margin: 0,
                                  padding: 0,
                                }}
                              />
                            ))}
                            {(afcRow && afcRow.length === 10 ? afcRow : Array(10).fill('')).map((num, colIdx) => (
                              <div 
                                key={`${quarter}-afc-${colIdx}`}
                                style={{
                                  width: '80px',
                                  height: '32px',
                                  border: '1px solid #333',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 'bold',
                                  backgroundColor: quarterColors[qIdx],
                                  fontSize: '16px',
                                  textAlign: 'center',
                                }}
                              >
                                {typeof num === 'string' && num.trim() !== '' ? num : ''}
                              </div>
                            ))}
                          </div>
                        )
                      })}
                    </div>
                    {/* Main grid area with NFC score columns on left */}
                    <div className="main-grid-area">
                      {/* 10x10 Grid of squares with NFC numbers on left */}
                      <div className="squares-grid">
                        {/* Use NFC numbers from editPool, fallback to 0-9 for 4 columns */}
                        {Array.from({ length: 10 }).map((_, row) => {
                          const quarterColors = ['#FCE5CD', '#FBBC04', '#B6D7A8', '#00FFFF']
                          // Use NFC scores from sheet if available, else fallback
                          let nfcRow = (nfcScores && Array.isArray(nfcScores) && nfcScores[row]) ? nfcScores[row] : (editPool.nfcNumbers ? Array(4).fill(editPool.nfcNumbers.split(',').map(n => n.trim())[row] ?? '') : Array(4).fill(''));
                          return (
                            <div key={`row-${row}`} className="grid-row-wrapper">
                              {/* NFC Score Columns - one number per row for each quarter */}
                              <div className="nfc-score-columns">
                                {nfcRow.map((nfcNum, qIdx) => (
                                  <div 
                                    key={`nfc-col-${qIdx}-row-${row}`}
                                    style={{
                                      width: '40px',
                                      height: '60px',
                                      border: '1px solid #333',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontWeight: 'bold',
                                      backgroundColor: quarterColors[qIdx],
                                      fontSize: '16px',
                                      boxSizing: 'border-box',
                                      margin: 0,
                                      padding: 0,
                                    }}
                                  >
                                    {typeof nfcNum === 'string' && nfcNum.trim() !== '' ? nfcNum : ''}
                                  </div>
                                ))}
                              </div>
                              {/* Grid squares for this row */}
                              <div className="grid-row">
                                {Array.from({ length: 10 }).map((_, col) => {
                                  let square = editSquares.find(sq => sq.rowPosition === row && sq.colPosition === col);
                                  if (!square) {
                                    square = { rowPosition: row, colPosition: col };
                                  }
                                  const isOwned = square?.profile && selectedProfileId && square.profile.id === parseInt(selectedProfileId);
                                  const isClaimed = square?.profile || square?.profileName;
                                  let squareClass = 'grid-square';
                                  if (isOwned) {
                                    squareClass += ' owned';
                                  } else if (isClaimed) {
                                    squareClass += ' claimed';
                                  } else {
                                    squareClass += ' available';
                                  }
                                  return (
                                    <div
                                      key={`square-${row}-${col}`}
                                      className={squareClass}
                                      title={square?.profileName || 'Available'}
                                      style={{ cursor: 'pointer' }}
                                      onClick={() => handleAdminSquareClick(square)}
                                    >
                                      {square?.profileName || ''}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
      {/* Edit Square Modal as true popup, outside Edit Pool modal */}
      {showEditSquareModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Edit Square</h3>
            <p>Row: {selectedSquare?.rowPosition ?? '--'}, Col: {selectedSquare?.colPosition ?? '--'}</p>
            <div className="form-group">
              <label>Assign Profile:</label>
              <select value={selectedProfileId} onChange={e => setSelectedProfileId(e.target.value)}>
                <option value="">-- Unassigned --</option>
                {allProfiles.length === 0
                  ? <option disabled>-- No profiles found --</option>
                  : [...allProfiles].sort((a, b) => a.fullName.localeCompare(b.fullName)).map(profile => (
                      <option key={profile.id} value={profile.id}>{profile.fullName} ({profile.userEmail})</option>
                    ))}
              </select>
            </div>
            {editSquaresError && <div className="error">{editSquaresError}</div>}
            <div className="form-actions">
              <button className="btn btn-primary" onClick={handleAdminAssignProfile}>Save</button>
              <button
                className="btn"
                style={{ marginLeft: '8px', backgroundColor: '#e74c3c', color: 'white' }}
                onClick={async () => {
                  if (!selectedSquare || !editSquaresPool) return;
                  try {
                    await unclaimSquare(editSquaresPool.id, selectedSquare.rowPosition, selectedSquare.colPosition);
                    // Google Sheets sync for removal
                    const spreadsheetId = '1zXue8QE0GBV5GRWv7k5JSR67yRjMf3o7Cj9egY4Fguk';
                    await updateCellInSheet(
                      spreadsheetId,
                      editSquaresSheetName,
                      selectedSquare.rowPosition,
                      selectedSquare.colPosition,
                      ''
                    );
                    setShowEditSquareModal(false);
                    getSquaresByPool(editSquaresPool.id).then(setEditSquares);
                  } catch (err) {
                    setEditSquaresError('Failed to remove entry.');
                  }
                }}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
        </div>
      )}
    </div>
  )
}

export default Admin
