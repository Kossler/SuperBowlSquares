import { useCallback, useEffect, useMemo, useState } from 'react'
import { getActivePools, getSquaresByPool, getAfcScoresFromSheet, getNfcScoresFromSheet } from '../services/squaresService'
import './Home.css'

function Home() {
  const [pools, setPools] = useState([])
  const [selectedPool, setSelectedPool] = useState(null)
  const [squares, setSquares] = useState([])
  const [loading, setLoading] = useState(true)
  const [afcScores, setAfcScores] = useState(null)
  const [nfcScores, setNfcScores] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  // Fetch AFC and NFC scores from backend when pool changes
  useEffect(() => {
    const fetchScores = async () => {
      if (!selectedPool) return;
      try {
        const spreadsheetId = '1zXue8QE0GBV5GRWv7k5JSR67yRjMf3o7Cj9egY4Fguk';
        const sheetName = selectedPool.poolName || 'Sheet1';
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
  }, [selectedPool]);

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

  const loadData = useCallback(async () => {
    try {
      const poolsData = await getActivePools()
      setPools(Array.isArray(poolsData) ? poolsData : [])
      if (poolsData.length > 0) {
        setSelectedPool(poolsData[0])
      }
      setLoading(false)
    } catch (err) {
      console.error('Failed to load data', err)
      setLoading(false)
    }
  }, [])

  const loadSquares = useCallback(async (poolId) => {
    try {
      const squaresData = await getSquaresByPool(poolId)
      setSquares(Array.isArray(squaresData) ? squaresData : [])
    } catch (err) {
      console.error('Failed to load squares', err)
      setSquares([])
    }
  }, [])

  const squaresByPosition = useMemo(() => {
    const map = new Map()
    if (!Array.isArray(squares)) return map
    for (const square of squares) {
      map.set(`${square.rowPosition},${square.colPosition}`, square)
    }
    return map
  }, [squares])

  const getSquareByPosition = useCallback(
    (row, col) => squaresByPosition.get(`${row},${col}`),
    [squaresByPosition]
  )

  const afcRows = useMemo(() => {
    if (Array.isArray(afcScores) && afcScores.length > 0) {
      return afcScores
    }
    if (selectedPool?.afcNumbers) {
      return [selectedPool.afcNumbers.split(',').map((n) => n.trim())]
    }
    return [Array(10).fill('')]
  }, [afcScores, selectedPool])

  const afcGridNumbers = useMemo(() => {
    return afcRows[0] || Array(10).fill('')
  }, [afcRows])

  const nfcColumns = useMemo(() => {
    if (Array.isArray(nfcScores) && nfcScores.length > 0) {
      return nfcScores
    }
    if (selectedPool?.nfcNumbers) {
      const col = selectedPool.nfcNumbers.split(',').map((n) => n.trim())
      return Array.from({ length: 10 }, (_, i) => Array(4).fill(col[i] || ''))
    }
    return Array.from({ length: 10 }, () => Array(4).fill(''))
  }, [nfcScores, selectedPool])

  const handlePoolChange = useCallback(
    (e) => {
      const nextId = parseInt(e.target.value)
      const pool = pools.find((p) => p.id === nextId)
      setSelectedPool(pool)
    },
    [pools]
  )

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
            onChange={handlePoolChange}
          >
            {(Array.isArray(pools) ? pools : []).map(pool => (
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
                  const quarterColors = ['#FCE5CD', '#FBBC04', '#B6D7A8', '#00FFFF']
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
                      {(afcRows[qIdx] || Array(10).fill('')).map((num, colIdx) => (
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
                      ))}
                    </div>
                  )
                })}
              </div>

              {/* Main grid area with NFC score columns on left */}
              <div className="main-grid-area">
                
                {/* 10x10 Grid of squares with NFC numbers on left */}
                <div className="squares-grid">
                  {nfcColumns.map((nfcRow, row) => {
                    const quarterColors = ['#FCE5CD', '#FBBC04', '#B6D7A8', '#00FFFF']
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
                              {nfcNum}
                            </div>
                          ))}
                        </div>
                      {/* Grid squares for this row */}
                      <div className="grid-row">
                        {afcGridNumbers.map((afcNum, col) => {
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
