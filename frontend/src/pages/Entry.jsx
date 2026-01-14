
import { useCallback, useEffect, useMemo, useState } from 'react'
import { getActivePools, getPoolStats, getMe, getSquaresByPool } from '../services/squaresService'
import SquaresGrid from '../components/SquaresGrid'
import { getUser, setUser } from '../utils/auth'
import './Entry.css'

function Entry() {
  const [pools, setPools] = useState([])
  const [selectedPool, setSelectedPool] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [user, setUserState] = useState(() => getUser())
  const [showHelp, setShowHelp] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [summaryRefresh, setSummaryRefresh] = useState(0)
  const [profileSummaryLoading, setProfileSummaryLoading] = useState(false)
  const [profileSummaryError, setProfileSummaryError] = useState('')
  const [profileSummary, setProfileSummary] = useState(null)
  const [selectedProfileId, setSelectedProfileId] = useState(() => {
    const firstId = getUser()?.profiles?.[0]?.id
    return firstId != null ? String(firstId) : ''
  })

  const usd = useMemo(() => {
    try {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
    } catch {
      return null
    }
  }, [])

  const formatUsd = useCallback(
    (amount) => {
      const num = Number(amount)
      const safe = Number.isFinite(num) ? num : 0
      return usd ? usd.format(safe) : `$${safe.toFixed(2)}`
    },
    [usd]
  )

  const closeHelp = useCallback(() => {
    setShowHelp(false)
  }, [])

  useEffect(() => {
    // Fetch latest user info on mount
    const fetchUser = async () => {
      try {
        const freshUser = await getMe();
        setUser(freshUser);
        setUserState(freshUser);
        // If no profile selected, default to first
        if (!selectedProfileId && freshUser?.profiles?.length > 0) {
          setSelectedProfileId(String(freshUser.profiles[0].id))
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
    const handler = () => {
      setSummaryRefresh((v) => v + 1)
    }
    window.addEventListener('squares-updated', handler)
    return () => window.removeEventListener('squares-updated', handler)
  }, [])

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

  const sortedProfiles = useMemo(() => {
    const list = Array.isArray(user?.profiles) ? [...user.profiles] : []
    list.sort((a, b) => (a.profileNumber ?? 0) - (b.profileNumber ?? 0))
    return list
  }, [user])

  const selectedProfile = useMemo(() => {
    const numericId = parseInt(selectedProfileId)
    if (!Number.isFinite(numericId)) return null
    return sortedProfiles.find((p) => p.id === numericId) ?? null
  }, [selectedProfileId, sortedProfiles])

  useEffect(() => {
    const profileNumericId = parseInt(selectedProfileId)
    if (!Number.isFinite(profileNumericId) || pools.length === 0) {
      setProfileSummary(null)
      setProfileSummaryError('')
      setProfileSummaryLoading(false)
      return
    }

    let cancelled = false

    const loadSummary = async () => {
      setProfileSummaryLoading(true)
      setProfileSummaryError('')

      try {
        const rows = await Promise.all(
          pools.map(async (pool) => {
            const squares = await getSquaresByPool(pool.id)
            const squaresOwned = Array.isArray(squares)
              ? squares.filter((s) => s?.profile?.id === profileNumericId).length
              : 0

            const betAmount = Number(pool?.betAmount)
            const betAmountSafe = Number.isFinite(betAmount) ? betAmount : 0
            const amountBet = squaresOwned * betAmountSafe

            return {
              poolId: pool.id,
              poolName: pool.poolName,
              betAmount: betAmountSafe,
              squaresOwned,
              amountBet,
            }
          })
        )

        const totalSquares = rows.reduce((sum, r) => sum + r.squaresOwned, 0)
        const totalBet = rows.reduce((sum, r) => sum + r.amountBet, 0)

        if (!cancelled) {
          setProfileSummary({ rows, totalSquares, totalBet })
        }
      } catch (err) {
        if (!cancelled) {
          setProfileSummary(null)
          setProfileSummaryError('Failed to load square summary')
        }
      } finally {
        if (!cancelled) {
          setProfileSummaryLoading(false)
        }
      }
    }

    loadSummary()
    return () => {
      cancelled = true
    }
  }, [pools, selectedProfileId, summaryRefresh])

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
    setSummaryRefresh((v) => v + 1)
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

  const helpTitleId = isMobile ? 'entry-help-title-mobile' : 'entry-help-title'

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
                  <li>On the <strong>entry</strong> page, pick a pool.</li>
                  <li>Select <strong>your square name</strong> in the dropdown box.</li>
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
                  <li>Select <strong>your square name</strong>.</li>
                  <li>To claim a square, click an available (yellow) square. Click again to unclaim it.</li>
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

      <h1>Enter Squares</h1>

      <div className="card">
        <h2>Pool Selection</h2>
        <div className="form-group entry-pool-select">
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

        <div className="entry-pool-buttons">
          {poolOptions.map((pool) => {
            const isActive = selectedPool?.id === pool.id
            return (
              <button
                key={pool.id}
                type="button"
                className={`entry-pool-btn ${isActive ? 'active' : ''}`}
                onClick={() => setSelectedPool(pool)}
              >
                {pool.poolName} - ${pool.betAmount}
              </button>
            )
          })}
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
          <div className="form-group entry-profile-select" style={{ marginBottom: '1em' }}>
            <label>Select Square Name:</label>
            <select value={selectedProfileId} onChange={(e) => setSelectedProfileId(e.target.value)}>
              {sortedProfiles.map((profile) => (
                <option key={profile.id} value={String(profile.id)}>
                  {profile.fullName}
                </option>
              ))}
            </select>
          </div>

          <div className="entry-profile-buttons" style={{ marginBottom: '1em' }}>
            {sortedProfiles.map((profile) => {
              const id = String(profile.id)
              const isActive = id === selectedProfileId
              const label = profile.profileNumber != null
                ? `#${profile.profileNumber} ${profile.fullName}`
                : profile.fullName

              return (
                <button
                  key={profile.id}
                  type="button"
                  className={`entry-profile-btn ${isActive ? 'active' : ''}`}
                  onClick={() => setSelectedProfileId(id)}
                >
                  {label}
                </button>
              )
            })}
          </div>

          <div className="pool-details" style={{ marginTop: 0 }}>
            <div className="info-grid" style={{ marginTop: 0 }}>
              <div className="info-item">
                <strong>Square Name Summary</strong>
                <div style={{ marginTop: '6px' }}>
                  {selectedProfile?.fullName ? `For: ${selectedProfile.fullName}` : 'Select a square name to see totals'}
                </div>
              </div>
              <div className="info-item entry-summary-total">
                <strong>Total Squares:</strong> {profileSummary?.totalSquares ?? 0}
              </div>
              <div className="info-item entry-summary-total">
                <strong>Total Bet:</strong> {formatUsd(profileSummary?.totalBet ?? 0)}
              </div>
            </div>

            {profileSummaryLoading && <p>Loading summary...</p>}
            {!profileSummaryLoading && profileSummaryError && (
              <div className="error">{profileSummaryError}</div>
            )}

            {!profileSummaryLoading && !profileSummaryError && profileSummary?.rows?.length > 0 && (
              <div className="info-grid" style={{ marginTop: 0 }}>
                {profileSummary.rows.map((row) => (
                  <div className="info-item" key={row.poolId}>
                    <strong>{row.poolName}</strong>
                    <div>Squares: {row.squaresOwned}</div>
                    <div>Bet: {formatUsd(row.amountBet)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <p className="instructions">
            Click on a yellow square to claim it for this square name. Click again to unclaim. You can only edit squares for the selected square name.
          </p>
          <div className="entry-grid">
            <SquaresGrid poolId={selectedPool.id} onSquareClaimed={handleSquareClaimed} selectedProfileId={selectedProfileId} />
          </div>
        </div>
      )}
    </div>
  )
}

export default Entry
