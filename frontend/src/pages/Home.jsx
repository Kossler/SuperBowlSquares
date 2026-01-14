import { useCallback, useEffect, useMemo, useState } from 'react'
import { getActivePools, getSquaresByPool } from '../services/squaresService'
import './Home.css'

function Home() {
  const [pools, setPools] = useState([])
  const [selectedPool, setSelectedPool] = useState(null)
  const [squares, setSquares] = useState([])
  const [loading, setLoading] = useState(true)
  const [showHelp, setShowHelp] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  const closeHelp = useCallback(() => {
    setShowHelp(false)
  }, [])

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

  useEffect(() => {
    if (!showHelp) return

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeHelp()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [showHelp, closeHelp])

  useEffect(() => {
    const media = window.matchMedia('(max-width: 700px)')
    const update = () => setIsMobile(Boolean(media.matches))

    update()

    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', update)
      return () => media.removeEventListener('change', update)
    }

    // Safari fallback
    media.addListener(update)
    return () => media.removeListener(update)
  }, [])

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

  const helpTitleId = isMobile ? 'home-help-title-mobile' : 'home-help-title'

  return (
    <div className="container">
      {showHelp && (
        <div
          className={`home-help-overlay ${isMobile ? 'home-help-overlay--mobile' : ''}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby={helpTitleId}
          onClick={closeHelp}
        >
          <div
            className={`home-help-modal ${isMobile ? 'home-help-modal--mobile' : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="home-help-close"
              aria-label="Close help"
              onClick={closeHelp}
            >
              {'\u00D7'}
            </button>

            {isMobile ? (
              <>
                <h2 id={helpTitleId}>Quick start</h2>
                <ol className="home-help-list">
                  <li>Tap on the menu icon (☰) to open navigation.</li>
                  <li>Register an account on the <strong>login</strong> page.</li>
                  <li>On the <strong>entry</strong> page, pick a pool.</li>
                  <li>Select <strong>your name</strong> in the dropdown box.</li>
                  <li>Yellow squares are available; claimed squares show a name.</li>
                  <li>Tap a yellow square to claim it. Tap again to unclaim it.</li>
                </ol>
              </>
            ) : (
              <>
                <h2 id={helpTitleId}>How to use this app</h2>
                <ol className="home-help-list">
                  <li>Register an account on the <strong>login</strong> page.</li>
                  <li>On the <strong>entry</strong> page, pick a pool.</li>
                  <li>Select <strong>your name</strong>.</li>
                  <li>To claim a square, simply click on an available (yellow) square. Click again to unclaim it.</li>
                </ol>
              </>
            )}

            <div className="home-help-actions">
              <button type="button" className="btn btn-primary" onClick={closeHelp}>
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

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
          
          <div className="grid-wrapper">
            <div className="grid-container">
              <div className="grid-only">
                {Array.from({ length: 10 }).map((_, row) =>
                  Array.from({ length: 10 }).map((_, col) => {
                    const square = getSquareByPosition(row, col)
                    const isClaimed = Boolean(square?.profile && square?.profile?.id)
                    return (
                      <div
                        key={`square-${row}-${col}`}
                        className={`grid-square ${isClaimed ? 'claimed' : 'available'}`}
                        title={square?.profileName || 'Available'}
                      >
                        {square?.profileName || ''}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Home
