
import { useCallback, useEffect, useMemo, useState } from 'react'
import { getActivePools, getPoolStats, getMe } from '../services/squaresService'
import SquaresGrid from '../components/SquaresGrid'
import { getUser, setUser } from '../utils/auth'
import './Entry.css'

function Entry() {
  const [pools, setPools] = useState([])
  const [selectedPool, setSelectedPool] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [user, setUserState] = useState(() => getUser())
  const [selectedProfileId, setSelectedProfileId] = useState(() => getUser()?.profiles?.[0]?.id || '')

  useEffect(() => {
    // Fetch latest user info on mount
    const fetchUser = async () => {
      try {
        const freshUser = await getMe();
        setUser(freshUser);
        setUserState(freshUser);
        // If no profile selected, default to first
        if (!selectedProfileId && freshUser?.profiles?.length > 0) {
          setSelectedProfileId(freshUser.profiles[0].id)
        }
      } catch (err) {
        // fallback to local user
        setUserState(getUser())
      }
    };
    fetchUser();
    loadPools();
  }, []);

  useEffect(() => {
    if (selectedPool) {
      loadStats(selectedPool.id)
    }
  }, [selectedPool])

  const loadPools = useCallback(async () => {
    try {
      const poolsData = await getActivePools()
      setPools(poolsData)
      if (poolsData.length > 0) {
        setSelectedPool(poolsData[0])
      }
      setLoading(false)
    } catch (err) {
      console.error('Failed to load pools', err)
      setLoading(false)
    }
  }, [])

  const loadStats = useCallback(async (poolId) => {
    try {
      const statsData = await getPoolStats(poolId)
      setStats(statsData)
    } catch (err) {
      console.error('Failed to load stats', err)
    }
  }, [])

  const handleSquareClaimed = useCallback(() => {
    if (selectedPool) {
      loadStats(selectedPool.id)
    }
  }, [loadStats, selectedPool])

  const handlePoolChange = useCallback(
    (e) => {
      const nextId = parseInt(e.target.value)
      const pool = pools.find((p) => p.id === nextId)
      setSelectedPool(pool)
    },
    [pools]
  )

  const poolOptions = useMemo(() => pools, [pools])

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  return (
    <div className="container">
      <h1>Enter Squares</h1>

      <div className="card">
        <h2>Pool Selection</h2>
        <div className="form-group">
          <label>Select Pool:</label>
          <select 
            value={selectedPool?.id || ''} 
            onChange={handlePoolChange}
          >
            {poolOptions.map(pool => (
              <option key={pool.id} value={pool.id}>
                {pool.poolName} - ${pool.betAmount}
              </option>
            ))}
          </select>
        </div>

        {selectedPool && (
          <div className="pool-details">
            <div className="info-grid">
              <div className="info-item">
                <strong>Bet Amount:</strong> ${selectedPool.betAmount}
              </div>
            </div>

            {stats && (
              <div className="stats">
                <p><strong>Claimed:</strong> {stats.claimedCount} / 100</p>
                <p><strong>Available:</strong> {stats.availableCount}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {selectedPool && (
        <div className="card">
          <h2>{selectedPool.poolName} - Select Your Squares</h2>
          <div className="form-group" style={{ marginBottom: '1em' }}>
            <label>Select Profile:</label>
            <select
              value={selectedProfileId}
              onChange={e => setSelectedProfileId(e.target.value)}
            >
              {user?.profiles?.map(profile => (
                <option key={profile.id} value={profile.id}>{profile.fullName}</option>
              ))}
            </select>
          </div>
          <p className="instructions">
            Click on a yellow square to claim it for this profile. Click again to unclaim. You can only edit squares for the selected profile.
          </p>
          <div className="grid-wrapper">
            <SquaresGrid poolId={selectedPool.id} onSquareClaimed={handleSquareClaimed} selectedProfileId={selectedProfileId} />
          </div>
        </div>
      )}
    </div>
  )
}

export default Entry
