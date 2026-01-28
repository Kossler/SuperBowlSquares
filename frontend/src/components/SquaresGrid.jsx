import { useState, useEffect } from 'react'
import { getSquaresByPool, getActivePools, claimSquare, unclaimSquare, getPoolById, syncGridToSheet, updateCellInSheet } from '../services/squaresService'
import { getUser } from '../utils/auth'
import './SquaresGrid.css'

function SquaresGrid({ poolId, onSquareClaimed, selectedProfileId }) {
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

      // Always fetch pool metadata for lock status
      const poolsData = await getActivePools()
      const selectedPoolData = poolsData.find(p => p.id === poolId)
      setPool(selectedPoolData)

      setLoading(false)
    } catch (err) {
      setError('Failed to load squares')
      setLoading(false)
    }
  }


  // New: Only allow editing for selected profile
  const handleSquareClick = async (square) => {
    if (!selectedProfileId) return;
    if (!square) return;
    setError('');

    // Prevent editing if pool is locked (unless admin panel, which uses a different component)
    if (pool?.isLocked) {
      setError('This pool is locked. No further changes allowed.');
      return;
    }

    const spreadsheetId = '1zXue8QE0GBV5GRWv7k5JSR67yRjMf3o7Cj9egY4Fguk';
    const sheetName = pool?.poolName || 'Sheet1';

    const selectedProfileNumericId = parseInt(selectedProfileId);
    const selectedProfileObj = user?.profiles?.find(p => p.id === selectedProfileNumericId);
    const profileName = selectedProfileObj ? selectedProfileObj.fullName : '';

    const ownedBySelectedProfile = square.profile && square.profile.id === selectedProfileNumericId;
    const isUnclaimed = !square.profile;
    const canEdit = isUnclaimed || ownedBySelectedProfile;
    if (!canEdit) return;

    // Optimistically update UI immediately; do network in background.
    const previousSquares = squares;

    // If square is claimed by this profile, unclaim on click
    if (ownedBySelectedProfile) {
      setSquares(prev => prev.map(s => {
        if (s.rowPosition !== square.rowPosition || s.colPosition !== square.colPosition) return s;
        return { ...s, profile: null, profileName: '' };
      }));

      try {
        await unclaimSquare(poolId, square.rowPosition, square.colPosition);
        await updateCellInSheet(spreadsheetId, sheetName, square.rowPosition, square.colPosition, '');
        if (onSquareClaimed) onSquareClaimed();
        window.dispatchEvent(new Event('squares-updated'));
      } catch (err) {
        setSquares(previousSquares);
        setError('Failed to update square');
      }
      return;
    }

    // If square is unclaimed, claim for selected profile
    if (isUnclaimed) {
      setSquares(prev => prev.map(s => {
        if (s.rowPosition !== square.rowPosition || s.colPosition !== square.colPosition) return s;
        return { ...s, profile: { id: selectedProfileNumericId }, profileName };
      }));

      try {
        await claimSquare({
          poolId: poolId,
          rowPosition: square.rowPosition,
          colPosition: square.colPosition,
          profileId: selectedProfileNumericId,
        });
        await updateCellInSheet(spreadsheetId, sheetName, square.rowPosition, square.colPosition, profileName);
        if (onSquareClaimed) onSquareClaimed();
        window.dispatchEvent(new Event('squares-updated'));
      } catch (err) {
        setSquares(previousSquares);
        setError('Failed to update square');
      }
      return;
    }
  }

  const handleClaim = async () => {
    if (!selectedProfile) {
      setError('Please select a square name');
      return;
    }

    try {
      await claimSquare({
        poolId: poolId,
        rowPosition: selectedSquare.rowPosition,
        colPosition: selectedSquare.colPosition,
        profileId: parseInt(selectedProfile),
      });
      setShowModal(false);
      loadData();
      if (onSquareClaimed) onSquareClaimed();
      window.dispatchEvent(new Event('squares-updated'));

      // --- Google Sheets Sync Logic ---
      const pool = await getPoolById(poolId);
      const spreadsheetId = '1zXue8QE0GBV5GRWv7k5JSR67yRjMf3o7Cj9egY4Fguk';
      const sheetName = pool.poolName || 'Sheet1';
      try {
        // Map grid (0,0) to F6 (row+6, col+6)
        const row = selectedSquare.rowPosition;
        const col = selectedSquare.colPosition;
        const selectedProfileObj = user?.profiles?.find(p => p.id === parseInt(selectedProfile));
        const value = selectedProfileObj ? selectedProfileObj.fullName : '';
        // Map grid [row,col] directly to Google Sheet cell (no offset)
        await updateCellInSheet(
          spreadsheetId,
          sheetName,
          selectedSquare.rowPosition,
          selectedSquare.colPosition,
          value
        );
      } catch (syncErr) {
        // Optionally handle sync error (e.g., setError)
      }
      // --- End Google Sheets Sync Logic ---
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to claim square');
    }
  }  

  const handleRemove = async () => {
    try {
      await unclaimSquare(poolId, selectedSquare.rowPosition, selectedSquare.colPosition);
      setShowModal(false);
      loadData();
      if (onSquareClaimed) onSquareClaimed();
      window.dispatchEvent(new Event('squares-updated'));

      // --- Google Sheets Sync Logic ---
      const pool = await getPoolById(poolId);
      const spreadsheetId = '1zXue8QE0GBV5GRWv7k5JSR67yRjMf3o7Cj9egY4Fguk';
      const sheetName = pool.poolName || 'Sheet1';
      try {
        // Map grid (0,0) to F6 (row+6, col+6)
        const row = selectedSquare.rowPosition + 6;
        const col = selectedSquare.colPosition + 6;
        // Map grid [row,col] directly to Google Sheet cell (no offset)
        await updateCellInSheet(
          spreadsheetId,
          sheetName,
          selectedSquare.rowPosition,
          selectedSquare.colPosition,
          '' // Remove profile name
        );
      } catch (syncErr) {
        // Optionally handle sync error (e.g., setError)
      }
      // --- End Google Sheets Sync Logic ---
    } catch (err) {
      setError('Failed to remove square');
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
          <div className="grid-only">
            {Array.from({ length: 10 }).map((_, row) =>
              Array.from({ length: 10 }).map((_, col) => {
                const square = getSquareByPosition(row, col)
                const owned = square?.profile && selectedProfileId && square.profile.id === parseInt(selectedProfileId)
                const isClaimed = Boolean(square?.profile && square?.profile?.id)
                return (
                  <div
                    key={`square-${row}-${col}`}
                    className={`grid-square ${isClaimed ? 'claimed' : 'available'} ${owned ? 'owned' : ''} ${pool?.isLocked ? 'locked' : ''}`}
                    onClick={() => handleSquareClick(square)}
                    title={pool?.isLocked ? 'Locked' : (square?.profileName || 'Available')}
                    style={{ cursor: pool?.isLocked ? 'not-allowed' : ((!square?.profile || owned) ? 'pointer' : 'not-allowed') }}
                  >
                    {square?.profileName || (pool?.isLocked ? '🔒' : '')}
                  </div>
                )
              })
            )}
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
                    <label>Select Square Name:</label>
                    <select 
                      value={selectedProfile} 
                      onChange={(e) => setSelectedProfile(e.target.value)}
                    >
                      <option value="">-- Select a square name --</option>
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
