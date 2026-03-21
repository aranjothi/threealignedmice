import { useState, useEffect } from 'react'
import { fetchLeaderboard } from '../api'
import { TIER_INFO } from '../data/interactions'

export default function Leaderboard({ onBack }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchLeaderboard()
      .then(setRows)
      .catch(() => setError('Could not load leaderboard.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="prompt-screen">
      <div className="prompt-header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <div className="prompt-header-title">
          <div className="stamp">FRONTIER BANK</div>
          <h2>🏆 Leaderboard</h2>
          <p>Top teams ranked by overall pass rate</p>
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 1.5rem 3rem' }}>
        {loading && <p style={{ textAlign: 'center', opacity: 0.6, padding: '3rem' }}>Loading...</p>}
        {error && <p style={{ textAlign: 'center', color: '#8b2020', padding: '3rem' }}>{error}</p>}

        {!loading && !error && rows.length === 0 && (
          <p style={{ textAlign: 'center', opacity: 0.6, padding: '3rem' }}>
            No completed sessions yet. Be the first!
          </p>
        )}

        {!loading && rows.length > 0 && (
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Team</th>
                <th>Pass Rate</th>
                <th>Highest Tier</th>
                <th>Consistency</th>
                <th>Critical Fails</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const tier = TIER_INFO[row.HIGHEST_TIER_SURVIVED] || TIER_INFO[1]
                const passRate = row.OVERALL_PASS_RATE ?? 0
                const passColor = passRate >= 85 ? '#2d7a3a' : passRate >= 70 ? '#c8a040' : '#8b2020'
                return (
                  <tr key={row.SESSION_ID} className={i < 3 ? 'lb-top' : ''}>
                    <td className="lb-rank">
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                    </td>
                    <td className="lb-team">{row.TEAM_NAME || 'Anonymous'}</td>
                    <td className="lb-rate" style={{ color: passColor, fontWeight: 700 }}>
                      {passRate}%
                    </td>
                    <td>
                      <span className="tier-badge" style={{ background: tier.bg, color: tier.color, borderColor: tier.border }}>
                        T{row.HIGHEST_TIER_SURVIVED}: {tier.name}
                      </span>
                    </td>
                    <td>{row.CONSISTENCY_SCORE?.toFixed(2) ?? '—'}</td>
                    <td style={{ color: row.CRITICAL_FAILURE_COUNT > 0 ? '#8b2020' : '#2d7a3a' }}>
                      {row.CRITICAL_FAILURE_COUNT ?? 0}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
