import { useState, useEffect } from 'react'
import { getSquaresByPool, getActivePools, claimSquare, unclaimSquare } from '../services/squaresService'
import { getUser } from '../utils/auth'
import './SquaresGrid.css'

function SquaresGrid({ poolId, onSquareClaimed }) {
  const [squares, setSquares] = useState([])
  const [pool, setPool] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedSquare, setSelectedSquare] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [selectedProfile, setSelectedProfile] = useState('')
  const [error, setError] = useState('')
  const user = getUser()

  useEffect(() => {
    loadData()
  }, [poolId])

  // Listen for global squares-updated event to reload grid
  useEffect(() => {
    const handler = () => {
      loadData();
    };
    window.addEventListener('squares-updated', handler);
    return () => window.removeEventListener('squares-updated', handler);
  }, [poolId]);

  const loadData = async () => {
    try {
      const squaresData = await getSquaresByPool(poolId)
      setSquares(squaresData)
      
      const poolsData = await getActivePools()
      const selectedPoolData = poolsData.find(p => p.id === poolId)
      setPool(selectedPoolData)
      
      setLoading(false)
    } catch (err) {
      setError('Failed to load squares')
      setLoading(false)
    }
  }

  const getAfcNumbers = () => {
    if (pool?.afcNumbers) {
      return pool.afcNumbers.split(',').map(n => n.trim())
    }
    return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
  }

  const getNfcNumbers = () => {
    if (pool?.nfcNumbers) {
      return pool.nfcNumbers.split(',').map(n => n.trim())
    }
    return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
  }

  const handleSquareClick = (square) => {
    if (square.profile) {
      // If user owns this square, allow them to remove it
      if (isOwnedByUser(square)) {
        setSelectedSquare(square)
        setShowModal(true)
        setError('')
      }
      return
    }
    setSelectedSquare(square)
    setShowModal(true)
    setError('')
  }

  const handleClaim = async () => {
    if (!selectedProfile) {
      setError('Please select a profile')
      return
    }

    try {
      await claimSquare({
        poolId: poolId,
        rowPosition: selectedSquare.rowPosition,
        colPosition: selectedSquare.colPosition,
        profileId: parseInt(selectedProfile),
      })
      setShowModal(false)
      loadData()
      if (onSquareClaimed) onSquareClaimed()
      window.dispatchEvent(new Event('squares-updated'))
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to claim square')
    }
  }

  const handleRemove = async () => {
    try {
      await unclaimSquare(poolId, selectedSquare.rowPosition, selectedSquare.colPosition)
      setShowModal(false)
      loadData()
      if (onSquareClaimed) onSquareClaimed()
      window.dispatchEvent(new Event('squares-updated'))
    } catch (err) {
      setError('Failed to remove square')
    }
  }

  const getSquareByPosition = (row, col) => {
    return squares.find(s => s.rowPosition === row && s.colPosition === col)
  }

  const isOwnedByUser = (square) => {
    if (!square?.profile || !user?.profiles) return false
    return user.profiles.some(p => p.id === square.profile.id)
  }

  if (loading) {
    return <div className="loading">Loading grid...</div>
  }

  return (
    <>
      <div className="grid-wrapper">
        <div className="grid-container">
          {/* Score rows - 4 rows showing AFC numbers with quarter labels on left */}
          <div className="score-rows-container">
            {['Q1', 'Q2', 'Q3', 'FINAL'].map((quarter, qIdx) => {
              const quarterColors = ['#ffeb3b', '#ff9800', '#4caf50', '#00bcd4']
              const quarterLabels = ['1Q', '1H', '3Q', 'FS']
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
                        backgroundColor: ['#ffeb3b', '#ff9800', '#4caf50'][i] || quarterColors[qIdx],
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
                      backgroundColor: qIdx === 0 ? '#ffeb3b' : quarterColors[qIdx],
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
                        backgroundColor: (qIdx === 0 && i === 0) ? '#ffeb3b' : quarterColors[qIdx],
                        boxSizing: 'border-box',
                        margin: 0,
                        padding: 0,
                      }}
                    />
                  ))}
                  {getAfcNumbers().map((num, colIdx) => (
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
                        backgroundColor: (qIdx === 0 && colIdx === 0) ? '#ffeb3b' : quarterColors[qIdx],
                        fontSize: '16px',
                        textAlign: 'center',
                      }}
                    >
                      {num}
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
              {getNfcNumbers().map((nfcNum, row) => {
                const quarterColors = ['#ffeb3b', '#ff9800', '#4caf50', '#00bcd4']
                return (
                  <div key={`row-${row}`} className="grid-row-wrapper">
                    {/* NFC Score Columns - one number per row for each quarter */}
                    <div className="nfc-score-columns">
                      {['Q1', 'Q2', 'Q3', 'FINAL'].map((quarter, qIdx) => (
                        <div 
                          key={`${quarter}-nfc-${row}`}
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
                          {nfcNum}
                        </div>
                      ))}
                    </div>
                    {/* Grid squares for this row */}
                    <div className="grid-row">
                      {getAfcNumbers().map((afcNum, col) => {
                        const square = getSquareByPosition(row, col)
                        const owned = isOwnedByUser(square)
                        return (
                          <div
                            key={`square-${row}-${col}`}
                            className={`grid-square ${(square?.profile && square?.profile?.id) ? 'claimed' : 'available'} ${owned ? 'owned' : ''}`}
                            onClick={() => handleSquareClick(square)}
                            title={square?.profileName || 'Available'}
                          >
                            {square?.profileName || ''}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedSquare?.profile ? (isOwnedByUser(selectedSquare) ? 'Remove Square' : 'Square Claimed') : 'Claim Square'}</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div>
              <p>Position: Row {selectedSquare?.rowPosition}, Col {selectedSquare?.colPosition}</p>
              {selectedSquare?.profile ? (
                isOwnedByUser(selectedSquare) ? (
                  <>
                    <p><strong>Claimed by:</strong> {selectedSquare?.profileName}</p>
                    <p>Are you sure you want to remove your entry from this square?</p>
                    {error && <div className="error">{error}</div>}
                    <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                      <button className="btn btn-danger" onClick={handleRemove}>
                        Remove Entry
                      </button>
                      <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p><strong>Claimed by:</strong> {selectedSquare?.profileName}</p>
                    <p>This square is already claimed by another player.</p>
                    <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                      Close
                    </button>
                  </>
                )
              ) : (
                <>
                  <div className="form-group">
                    <label>Select Profile:</label>
                    <select 
                      value={selectedProfile} 
                      onChange={(e) => setSelectedProfile(e.target.value)}
                    >
                      <option value="">-- Select a profile --</option>
                      {user?.profiles?.map(profile => (
                        <option key={profile.id} value={profile.id}>
                          {profile.fullName}
                        </option>
                      ))}
                    </select>
                  </div>
                  {error && <div className="error">{error}</div>}
                  <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                    <button className="btn btn-primary" onClick={handleClaim}>
                      Claim Square
                    </button>
                    <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default SquaresGrid
