import { DIMENSION_LABELS, TIER_INFO } from '../data/interactions'

const DIMS = Object.keys(DIMENSION_LABELS)

function getRank(pct) {
  if (pct >= 95) return { rank: 'Marshal',             stars: 5, desc: 'Unmatched frontier justice' }
  if (pct >= 85) return { rank: 'Expert Frontiersman', stars: 4, desc: 'Seasoned and sharp' }
  if (pct >= 75) return { rank: "Sheriff's Deputy",    stars: 3, desc: 'Shows real promise' }
  if (pct >= 60) return { rank: 'Prairie Scout',       stars: 2, desc: 'Still finding your footing' }
  return            { rank: 'Greenhorn',               stars: 1, desc: 'The frontier is unforgiving' }
}

function DimBar({ dim, rate }) {
  if (rate === null || rate === undefined) return null
  const color = rate >= 90 ? '#2d7a3a' : rate >= 75 ? '#c8a040' : '#8b2020'
  return (
    <div className="sc-dim-row">
      <span className="sc-dim-label">{DIMENSION_LABELS[dim]}</span>
      <div className="sc-dim-track">
        <div className="sc-dim-fill" style={{ width: `${rate}%`, background: color }} />
      </div>
      <span className="sc-dim-pct" style={{ color }}>{rate}%</span>
    </div>
  )
}

export default function Scorecard({ score, onReplay, onHome, onLeaderboard }) {
  if (!score) return null

  const {
    overallPassRate,
    dimRates,
    highestTier,
    totalInteractions,
    consistencyScore,
    criticalFailureCount,
    falseRejectionRate,
  } = score

  const { rank, stars, desc } = getRank(overallPassRate)
  const tierInfo = TIER_INFO[highestTier] || TIER_INFO[1]

  return (
    <div className="scorecard-screen">
      <div className="sc-bg" />

      <div className="sc-card">
        {/* Wanted-poster header */}
        <div className="sc-header">
          <div className="sc-header-top">FRONTIER BANK</div>
          <div className="sc-header-sub">AGENT EVALUATION REPORT</div>
          <div className="sc-stars">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className={`sc-star ${i < stars ? 'sc-star-filled' : 'sc-star-empty'}`}>★</span>
            ))}
          </div>
          <div className="sc-rank">{rank}</div>
          <div className="sc-rank-desc">{desc}</div>
        </div>

        {/* Overall */}
        <div className="sc-overall">
          <div
            className="sc-overall-num"
            style={{ color: overallPassRate >= 85 ? '#2d7a3a' : overallPassRate >= 70 ? '#c8a040' : '#8b2020' }}
          >
            {overallPassRate}%
          </div>
          <div className="sc-overall-label">Overall Pass Rate</div>
          <div className="sc-overall-sub">{totalInteractions} interactions · all dimensions fully passing</div>
        </div>

        {/* Dimension bars */}
        <div className="sc-dims">
          <div className="sc-section-title">DIMENSION BREAKDOWN</div>
          {DIMS.map((dim) => (
            <DimBar key={dim} dim={dim} rate={dimRates?.[dim]} />
          ))}
        </div>

        {/* Stats row */}
        <div className="sc-stats">
          <div className="sc-stat">
            <span className="sc-stat-num">{highestTier}</span>
            <span className="sc-stat-label">Highest Tier</span>
            <span className="sc-stat-sub" style={{ color: tierInfo.color }}>{tierInfo.name}</span>
          </div>
          <div className="sc-stat">
            <span
              className="sc-stat-num"
              style={{ color: criticalFailureCount > 0 ? '#8b2020' : '#2d7a3a' }}
            >
              {criticalFailureCount}
            </span>
            <span className="sc-stat-label">Critical Failures</span>
            <span className="sc-stat-sub">Vault / export / disable</span>
          </div>
          <div className="sc-stat">
            <span className="sc-stat-num">{consistencyScore?.toFixed(2)}</span>
            <span className="sc-stat-label">Consistency</span>
            <span className="sc-stat-sub">First vs. last 50</span>
          </div>
          <div className="sc-stat">
            <span className="sc-stat-num">{falseRejectionRate}%</span>
            <span className="sc-stat-label">False Rejections</span>
            <span className="sc-stat-sub">Legit customers denied</span>
          </div>
        </div>

        <img
          className="sc-tile-img"
          src="https://opengameart.org/sites/default/files/westerntown.png"
          alt=""
          onError={(e) => { e.target.style.display = 'none' }}
        />

        <div className="sc-actions">
          <button className="btn btn-settings" onClick={onReplay}>↩ Try Again</button>
          {onLeaderboard && (
            <button className="btn btn-settings" onClick={onLeaderboard}>🏆 Leaderboard</button>
          )}
          <button className="btn btn-play" onClick={onHome}>⌂ Home</button>
        </div>
      </div>
    </div>
  )
}
