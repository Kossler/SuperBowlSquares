import { useState, useEffect } from 'react'
import { getActivePools, getPoolStats } from '../services/squaresService'
import SquaresGrid from '../components/SquaresGrid'
import './Entry.css'

function Entry() {
  const [pools, setPools] = useState([])
  const [selectedPool, setSelectedPool] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPools()
  }, [])

  useEffect(() => {
    if (selectedPool) {
      loadStats(selectedPool.id)
    }
  }, [selectedPool])

  const loadPools = async () => {
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
  }

  const loadStats = async (poolId) => {
    try {
      const statsData = await getPoolStats(poolId)
      setStats(statsData)
    } catch (err) {
      console.error('Failed to load stats', err)
    }
  }

  const handleSquareClaimed = () => {
    if (selectedPool) {
      loadStats(selectedPool.id)
    }
  }

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
            onChange={(e) => {
              const pool = pools.find(p => p.id === parseInt(e.target.value))
              setSelectedPool(pool)
            }}
          >
            {pools.map(pool => (
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
          <h2>Select Your Squares</h2>
          <p className="instructions">
            Click on an available square to claim it with one of your profiles.
            White squares are available, light blue squares are yours, and darker green squares belong to others.
          </p>
          <div className="grid-wrapper">
            <SquaresGrid poolId={selectedPool.id} onSquareClaimed={handleSquareClaimed} />
          </div>
        </div>
      )}
    </div>
  )
}

export default Entry
