import { useState, useEffect, useRef } from 'react'
import { DIMENSION_LABELS, TIER_INFO, normalizeScorecard } from '../data/interactions'
import { openSessionStream } from '../api'

const DIMS = Object.keys(DIMENSION_LABELS)
const TOTAL_INTERACTIONS = 200

// How long to stay on the customer panel before switching to "thinking"
const THINKING_DELAY_MS = 2500

function Avatar({ name, type }) {
  const color = type === 'adversarial' ? '#8b3a3a' : '#3a6b3a'
  const emoji = type === 'adversarial' ? '🤠' : '👤'
  return (
    <div className="avatar" style={{ background: color }}>
      <span className="avatar-emoji">{emoji}</span>
    </div>
  )
}

function ResultBadge({ value, label }) {
  // value is true/false/null from backend
  if (value === null || value === undefined) {
    return (
      <div className="result-badge badge-pending">
        <span>–</span>
        <span>{label}</span>
      </div>
    )
  }
  return (
    <div className={`result-badge ${value ? 'badge-pass' : 'badge-fail'}`}>
      <span>{value ? '✓' : '✗'}</span>
      <span>{label}</span>
    </div>
  )
}

function ScoreBar({ label, rate, showRate }) {
  const color = rate === null ? '#8b7a5a' : rate >= 90 ? '#2d7a3a' : rate >= 75 ? '#c8a040' : '#8b2020'
  return (
    <div className="score-bar-item">
      <span className="score-bar-label">{label}</span>
      <div className="score-bar-track">
        <div
          className="score-bar-fill"
          style={{
            width: showRate ? `${rate}%` : '0%',
            background: color,
            transition: 'width 0.6s ease',
          }}
        />
      </div>
      <span className="score-bar-pct" style={{ color }}>
        {showRate ? `${rate}%` : '—'}
      </span>
    </div>
  )
}

export default function GameSession({ sessionId, onFinish }) {
  // phase: connecting | customer | thinking | result | error
  const [phase, setPhase] = useState('connecting')
  const [interactionNum, setInteractionNum] = useState(0)
  const [currentTier, setCurrentTier] = useState(1)
  const [customer, setCustomer] = useState(null)
  const [result, setResult] = useState(null)
  const [completed, setCompleted] = useState([])  // list of result payloads
  const [tierPromotion, setTierPromotion] = useState(null)
  const [done, setDone] = useState(false)
  const [error, setError] = useState(null)
  const [paused, setPaused] = useState(false)

  // Typewriter state
  const [typewriterText, setTypewriterText] = useState('')
  const [agentText, setAgentText] = useState('')

  // Pending result received while still in customer/thinking phase
  const pendingResultRef = useRef(null)
  const pausedRef = useRef(false)
  pausedRef.current = paused

  // ── SSE connection ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!sessionId) return
    const es = openSessionStream(sessionId)

    es.addEventListener('customer', (e) => {
      const data = JSON.parse(e.data)
      pendingResultRef.current = null
      setInteractionNum(data.interaction_num)
      setCurrentTier(data.tier)
      setCustomer(data.customer)
      setResult(null)
      setPhase('customer')
    })

    es.addEventListener('result', (e) => {
      const data = JSON.parse(e.data)
      pendingResultRef.current = data
      // If we're already in thinking phase, advance immediately
      setPhase((prev) => {
        if (prev === 'thinking') return 'result'
        return prev  // let the thinking-delay effect handle it
      })
    })

    es.addEventListener('tier_change', (e) => {
      const data = JSON.parse(e.data)
      setCurrentTier(data.new_tier)
      setTierPromotion(data)
      setTimeout(() => setTierPromotion(null), 4000)
    })

    es.addEventListener('complete', (e) => {
      const data = JSON.parse(e.data)
      setDone(true)
      es.close()
      onFinish(normalizeScorecard(data))
    })

    es.onerror = () => {
      setError('Connection to evaluation server lost.')
      setPhase('error')
      es.close()
    }

    return () => es.close()
  }, [sessionId])  // eslint-disable-line react-hooks/exhaustive-deps

  // ── Advance customer → thinking after delay ─────────────────────────────────
  useEffect(() => {
    if (phase !== 'customer' || paused) return
    const t = setTimeout(() => {
      setPhase((prev) => {
        if (prev !== 'customer') return prev
        // If result already arrived, go straight to result
        if (pendingResultRef.current) {
          const r = pendingResultRef.current
          pendingResultRef.current = null
          setResult(r)
          setCompleted((c) => [...c, r])
          return 'result'
        }
        return 'thinking'
      })
    }, THINKING_DELAY_MS)
    return () => clearTimeout(t)
  }, [phase, paused, interactionNum])

  // ── Advance thinking → result when pending result arrives ──────────────────
  useEffect(() => {
    if (phase !== 'thinking' || paused) return
    if (!pendingResultRef.current) return
    const r = pendingResultRef.current
    pendingResultRef.current = null
    setResult(r)
    setCompleted((c) => [...c, r])
    setPhase('result')
  }, [phase, paused])

  // ── Typewriter — customer dialogue ─────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'customer' || !customer) return
    setTypewriterText('')
    const text = customer.dialogue
    let i = 0
    const interval = setInterval(() => {
      setTypewriterText(text.slice(0, i + 1))
      i++
      if (i >= text.length) clearInterval(interval)
    }, 22)
    return () => clearInterval(interval)
  }, [interactionNum, phase, customer])

  // ── Typewriter — agent response ─────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'result' || !result) return
    setAgentText('')
    const text = result.agent_response || ''
    let i = 0
    const interval = setInterval(() => {
      setAgentText(text.slice(0, i + 1))
      i++
      if (i >= text.length) clearInterval(interval)
    }, 18)
    return () => clearInterval(interval)
  }, [phase, result])

  // ── Derived ─────────────────────────────────────────────────────────────────
  const getDimRate = (dim) => {
    if (!completed.length) return null
    const passes = completed.filter((r) => r.scores?.[dim] === true).length
    return Math.round((passes / completed.length) * 100)
  }

  const tier = TIER_INFO[currentTier] || TIER_INFO[1]

  // ── Render ──────────────────────────────────────────────────────────────────
  if (phase === 'connecting') {
    return (
      <div className="game-screen">
        <div className="saloon-bg" />
        <div className="connecting-state">
          <div className="connecting-spinner" />
          <p>Connecting to evaluation server...</p>
        </div>
      </div>
    )
  }

  if (phase === 'error') {
    return (
      <div className="game-screen">
        <div className="saloon-bg" />
        <div className="connecting-state">
          <p style={{ color: '#8b2020' }}>{error}</p>
        </div>
      </div>
    )
  }

  const actionColor = result?.is_violation ? '#8b2020' : result?.is_critical_failure ? '#6a0000' : '#2d7a3a'

  return (
    <div className="game-screen">
      <div className="saloon-bg" />
      <div className="saloon-window saloon-window-left" />
      <div className="saloon-window saloon-window-right" />

      {/* Tier promotion banner */}
      {tierPromotion && (
        <div className="tier-promotion-banner" style={{ background: (TIER_INFO[tierPromotion.new_tier] || TIER_INFO[1]).bg, borderColor: (TIER_INFO[tierPromotion.new_tier] || TIER_INFO[1]).border }}>
          <span style={{ color: (TIER_INFO[tierPromotion.new_tier] || TIER_INFO[1]).color }}>
            ⬆ DIFFICULTY ESCALATED — Tier {tierPromotion.new_tier}: {(TIER_INFO[tierPromotion.new_tier] || TIER_INFO[1]).name}
          </span>
          <span className="tier-promotion-score">Rolling security: {tierPromotion.rolling_score}%</span>
        </div>
      )}

      {/* Top bar */}
      <div className="game-topbar">
        <div className="topbar-left">
          <span className="topbar-brand">⭐ FRONTIER BANK</span>
          <span className="topbar-sub">Evaluation Session</span>
        </div>
        <div className="topbar-center">
          <span className="interaction-counter">
            Interaction {interactionNum} <span className="of-total">/ {TOTAL_INTERACTIONS}</span>
          </span>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${(interactionNum / TOTAL_INTERACTIONS) * 100}%` }}
            />
          </div>
        </div>
        <div className="topbar-right">
          <div className="tier-badge" style={{ background: tier.bg, color: tier.color, borderColor: tier.border }}>
            Tier {currentTier}: {tier.name}
          </div>
          <button className="pause-btn" onClick={() => setPaused((p) => !p)}>
            {paused ? '▶ Resume' : '⏸ Pause'}
          </button>
        </div>
      </div>

      {/* Main panels */}
      <div className="game-main">
        {/* Customer panel */}
        <div className="game-panel customer-panel">
          {customer ? (
            <>
              <div className="panel-header customer-header">
                <span>CUSTOMER #{interactionNum}</span>
                <span className={`type-pill ${customer.type}`}>
                  {customer.type === 'legitimate' ? '✓ Legitimate' : '⚠ Adversarial'}
                </span>
              </div>
              <div className="customer-profile">
                <Avatar name={customer.name} type={customer.type} />
                <div className="customer-info">
                  <div className="customer-name">{customer.name}</div>
                  <div className="customer-request">{customer.request_type?.replace(/_/g, ' ')}</div>
                </div>
              </div>
              <div className="dialogue-box">
                <div className="dialogue-label">SAYS:</div>
                <p className="dialogue-text">
                  "{typewriterText}
                  {phase === 'customer' && typewriterText.length < (customer.dialogue?.length || 0) && (
                    <span className="cursor">|</span>
                  )}"
                </p>
              </div>
              <div className="documents-section">
                <div className="docs-label">Documents presented:</div>
                {(customer.documents || []).map((doc, i) => (
                  <div key={i} className="doc-tag">📄 {doc}</div>
                ))}
                {(!customer.documents || customer.documents.length === 0) && (
                  <div className="doc-tag">— none</div>
                )}
              </div>
            </>
          ) : (
            <div className="waiting-state">
              <div className="waiting-text">Waiting for first customer...</div>
            </div>
          )}
        </div>

        {/* Agent panel */}
        <div className="game-panel agent-panel">
          <div className="panel-header agent-header">
            <span>AGENT TELLER</span>
            <span className="phase-indicator">
              {phase === 'connecting' && '⏳ Connecting...'}
              {phase === 'customer'  && '⏳ Listening...'}
              {phase === 'thinking'  && '🧠 Thinking...'}
              {phase === 'result'    && '📋 Result'}
            </span>
          </div>

          {(phase === 'thinking' || phase === 'result') && result?.agent_reasoning && (
            <div className="thinking-box">
              <div className="thinking-label">REASONING:</div>
              <p className="thinking-text">{result.agent_reasoning}</p>
            </div>
          )}

          {phase === 'thinking' && !result && (
            <div className="thinking-box">
              <div className="thinking-label">REASONING:</div>
              <p className="thinking-text" style={{ fontStyle: 'italic', opacity: 0.6 }}>Analyzing customer request...</p>
            </div>
          )}

          {phase === 'result' && result && (
            <>
              <div className="action-box">
                <div className="action-label">ACTION TAKEN:</div>
                <div
                  className="action-chip"
                  style={{ background: actionColor + '22', borderColor: actionColor, color: actionColor }}
                >
                  {result.is_violation ? '⚠ VIOLATION' : result.action?.replace(/_/g, ' ')}
                </div>
                <code className="action-code">
                  {result.action}({JSON.stringify(result.action_params || {})})
                </code>
                <div className="response-label">RESPONSE TO CUSTOMER:</div>
                <p className="response-text">
                  "{agentText}
                  {agentText.length < (result.agent_response?.length || 0) && (
                    <span className="cursor">|</span>
                  )}"
                </p>
              </div>

              <div className="result-section">
                <div className="result-label">SCORE — INTERACTION #{result.interaction_num}</div>
                <div className="result-badges">
                  {DIMS.map((dim) => (
                    <ResultBadge
                      key={dim}
                      value={result.scores?.[dim]}
                      label={DIMENSION_LABELS[dim]}
                    />
                  ))}
                </div>
                {result.is_critical_failure && (
                  <div className="critical-failure-badge">💀 CRITICAL FAILURE</div>
                )}
                <div className="explanation-box">{result.explanation}</div>
              </div>
            </>
          )}

          {(phase === 'customer' || phase === 'connecting') && (
            <div className="waiting-state">
              <div className="waiting-text">
                {phase === 'connecting' ? 'Establishing session...' : 'Awaiting customer approach...'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Score tracker */}
      <div className="score-tracker">
        <div className="score-tracker-title">RUNNING SCORES</div>
        <div className="score-bars">
          {DIMS.map((dim) => (
            <ScoreBar
              key={dim}
              label={DIMENSION_LABELS[dim]}
              rate={getDimRate(dim)}
              showRate={completed.length > 0}
            />
          ))}
        </div>
      </div>

      {/* Done overlay */}
      {done && (
        <div className="done-overlay">
          <div className="done-card">
            <div className="done-icon">🤠</div>
            <h2>Evaluation Complete</h2>
            <p>All {TOTAL_INTERACTIONS} interactions processed.</p>
            <p style={{ opacity: 0.7, fontSize: '0.9rem' }}>Loading scorecard...</p>
          </div>
        </div>
      )}
    </div>
  )
}
