import { useState, useEffect } from 'react'
import { getActivePools, getSquaresByPool } from '../services/squaresService'
import './Home.css'

function Home() {
  const [pools, setPools] = useState([])
  const [selectedPool, setSelectedPool] = useState(null)
  const [squares, setSquares] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (selectedPool) {
      loadSquares(selectedPool.id)
    }
  }, [selectedPool])

  useEffect(() => {
    const handler = () => {
      if (selectedPool) {
        loadSquares(selectedPool.id)
      }
    }
    window.addEventListener('squares-updated', handler)
    return () => window.removeEventListener('squares-updated', handler)
  }, [selectedPool])

  const loadData = async () => {
    try {
      const poolsData = await getActivePools()
      setPools(poolsData)
      if (poolsData.length > 0) {
        setSelectedPool(poolsData[0])
      }
      setLoading(false)
    } catch (err) {
      console.error('Failed to load data', err)
      setLoading(false)
    }
  }

  const loadSquares = async (poolId) => {
    try {
      const squaresData = await getSquaresByPool(poolId)
      setSquares(squaresData)
    } catch (err) {
      console.error('Failed to load squares', err)
    }
  }

  const getSquareByPosition = (row, col) => {
    return squares.find(s => s.rowPosition === row && s.colPosition === col)
  }

  const getAfcNumbers = () => {
    if (selectedPool?.afcNumbers) {
      return selectedPool.afcNumbers.split(',').map(n => n.trim())
    }
    return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
  }

  const getNfcNumbers = () => {
    if (selectedPool?.nfcNumbers) {
      return selectedPool.nfcNumbers.split(',').map(n => n.trim())
    }
    return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
  }

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  return (
    <div className="container">
      <h1>Super Bowl Squares</h1>
      
      <div className="card">
        <h2>Pool Selection</h2>
        <div className="form-group">
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
      </div>

      {selectedPool && (
        <div className="card">
          <h2>{selectedPool.poolName}</h2>
          
          {/* Grid with score rows and columns */}
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
                      {getAfcNumbers().map((num, colIdx) => {
                        return (
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
                            {num}
                          </div>
                        )
                      })}
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
                          {['Q1', 'Q2', 'Q3', 'FINAL'].map((quarter, qIdx) => {
                            return (
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
                            )
                          })}
                        </div>
                      
                      {/* Grid squares for this row */}
                      <div className="grid-row">
                        {getAfcNumbers().map((afcNum, col) => {
                          const square = getSquareByPosition(row, col)
                          return (
                            <div
                              key={`square-${row}-${col}`}
                              className={`grid-square ${(square?.profile && square?.profile?.id) ? 'claimed' : 'available'}`}
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
        </div>
      )}
    </div>
  )
}

export default Home
