import { useState, useEffect, useCallback } from 'react'
import { MOCK_INTERACTIONS, DIMENSION_LABELS, TIER_INFO, computeFinalScore } from '../data/interactions'

const PHASE_DELAYS = { customer: 2500, thinking: 2000, action: 2800, result: 3200 }
const PHASE_ORDER = ['customer', 'thinking', 'action', 'result']
const DIMS = Object.keys(DIMENSION_LABELS)

function Avatar({ customer }) {
  return (
    <div className="avatar" style={{ background: customer.avatarColor }}>
      <span className="avatar-emoji">{customer.emoji}</span>
    </div>
  )
}

function ResultBadge({ value, label }) {
  const pass = value === 'pass'
  return (
    <div className={`result-badge ${pass ? 'badge-pass' : 'badge-fail'}`}>
      <span>{pass ? '✓' : '✗'}</span>
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

export default function GameSession({ onFinish }) {
  const [idx, setIdx] = useState(0)
  const [phase, setPhase] = useState('customer')
  const [completed, setCompleted] = useState([])
  const [paused, setPaused] = useState(false)
  const [done, setDone] = useState(false)
  const [typewriterText, setTypewriterText] = useState('')
  const current = MOCK_INTERACTIONS[idx]
  const tier = TIER_INFO[current.tier]

  // Typewriter effect for dialogue
  useEffect(() => {
    if (phase !== 'customer') return
    setTypewriterText('')
    const text = current.customer.dialogue
    let i = 0
    const interval = setInterval(() => {
      setTypewriterText(text.slice(0, i + 1))
      i++
      if (i >= text.length) clearInterval(interval)
    }, 22)
    return () => clearInterval(interval)
  }, [idx, phase, current.customer.dialogue])

  // Typewriter for agent response
  const [agentText, setAgentText] = useState('')
  useEffect(() => {
    if (phase !== 'action') return
    setAgentText('')
    const text = current.agent.response
    let i = 0
    const interval = setInterval(() => {
      setAgentText(text.slice(0, i + 1))
      i++
      if (i >= text.length) clearInterval(interval)
    }, 18)
    return () => clearInterval(interval)
  }, [idx, phase, current.agent.response])

  const advance = useCallback(() => {
    const phaseIdx = PHASE_ORDER.indexOf(phase)
    if (phase === 'result') {
      const newCompleted = [...completed, current]
      setCompleted(newCompleted)
      if (idx < MOCK_INTERACTIONS.length - 1) {
        setIdx(idx + 1)
        setPhase('customer')
      } else {
        setDone(true)
        onFinish(computeFinalScore(newCompleted))
      }
    } else {
      setPhase(PHASE_ORDER[phaseIdx + 1])
    }
  }, [phase, idx, completed, current, onFinish])

  useEffect(() => {
    if (paused || done) return
    const t = setTimeout(advance, PHASE_DELAYS[phase])
    return () => clearTimeout(t)
  }, [advance, paused, done, phase])

  const getDimRate = (dim) => {
    if (!completed.length) return null
    const passes = completed.filter((i) => i.result[dim] === 'pass').length
    return Math.round((passes / completed.length) * 100)
  }

  const cowboyImg = 'https://opengameart.org/sites/default/files/Cowboy4Preview.png'

  return (
    <div className="game-screen">
      {/* Saloon interior background layers */}
      <div className="saloon-bg" />
      <div className="saloon-window saloon-window-left" />
      <div className="saloon-window saloon-window-right" />

      {/* Top bar */}
      <div className="game-topbar">
        <div className="topbar-left">
          <span className="topbar-brand">⭐ FRONTIER BANK</span>
          <span className="topbar-sub">Evaluation Session</span>
        </div>
        <div className="topbar-center">
          <span className="interaction-counter">
            Interaction {idx + 1} <span className="of-total">/ {MOCK_INTERACTIONS.length}</span>
          </span>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${((idx + (phase === 'result' ? 1 : 0)) / MOCK_INTERACTIONS.length) * 100}%` }}
            />
          </div>
        </div>
        <div className="topbar-right">
          <div className="tier-badge" style={{ background: tier.bg, color: tier.color, borderColor: tier.border }}>
            Tier {current.tier}: {tier.name}
          </div>
          <button className="pause-btn" onClick={() => setPaused((p) => !p)}>
            {paused ? '▶ Resume' : '⏸ Pause'}
          </button>
          {paused && (
            <button className="pause-btn" onClick={advance}>
              ⏭ Next
            </button>
          )}
        </div>
      </div>

      {/* Main game area */}
      <div className="game-main">
        {/* Customer panel */}
        <div className="game-panel customer-panel">
          <div className="panel-header customer-header">
            <span>CUSTOMER #{current.id}</span>
            <span className={`type-pill ${current.type}`}>
              {current.type === 'legitimate' ? '✓ Legitimate' : '⚠ Adversarial'}
            </span>
          </div>

          <div className="customer-profile">
            <Avatar customer={current.customer} />
            <div className="customer-info">
              <div className="customer-name">{current.customer.name}</div>
              <div className="customer-request">{current.customer.requestLabel}</div>
            </div>
          </div>

          <div className="dialogue-box">
            <div className="dialogue-label">SAYS:</div>
            <p className="dialogue-text">
              "{typewriterText}
              {phase === 'customer' && typewriterText.length < current.customer.dialogue.length && (
                <span className="cursor">|</span>
              )}"
            </p>
          </div>

          <div className="documents-section">
            <div className="docs-label">Documents presented:</div>
            {current.customer.documents.map((doc, i) => (
              <div key={i} className="doc-tag">📄 {doc}</div>
            ))}
          </div>

          {/* Cowboy sprite decoration */}
          <img
            className="cowboy-sprite"
            src={cowboyImg}
            alt=""
            onError={(e) => { e.target.style.display = 'none' }}
          />
        </div>

        {/* Agent panel */}
        <div className="game-panel agent-panel">
          <div className="panel-header agent-header">
            <span>AGENT TELLER</span>
            <span className="phase-indicator">
              {phase === 'customer' && '⏳ Listening...'}
              {phase === 'thinking' && '🧠 Thinking...'}
              {phase === 'action' && '⚡ Acting'}
              {phase === 'result' && '📋 Result'}
            </span>
          </div>

          {(phase === 'thinking' || phase === 'action' || phase === 'result') && (
            <div className="thinking-box">
              <div className="thinking-label">REASONING:</div>
              <p className="thinking-text">{current.agent.thinking}</p>
            </div>
          )}

          {(phase === 'action' || phase === 'result') && (
            <div className="action-box">
              <div className="action-label">ACTION TAKEN:</div>
              <div
                className="action-chip"
                style={{ background: current.agent.actionColor + '22', borderColor: current.agent.actionColor, color: current.agent.actionColor }}
              >
                {current.agent.actionLabel}
              </div>
              <code className="action-code">{current.agent.action}</code>
              <div className="response-label">RESPONSE TO CUSTOMER:</div>
              <p className="response-text">
                "{agentText}
                {phase === 'action' && agentText.length < current.agent.response.length && (
                  <span className="cursor">|</span>
                )}"
              </p>
            </div>
          )}

          {phase === 'result' && (
            <div className="result-section">
              <div className="result-label">SCORE — INTERACTION #{current.id}</div>
              <div className="result-badges">
                {DIMS.map((dim) => (
                  <ResultBadge key={dim} value={current.result[dim]} label={DIMENSION_LABELS[dim]} />
                ))}
              </div>
              <div className="explanation-box">
                {current.explanation}
              </div>
            </div>
          )}

          {phase === 'customer' && (
            <div className="waiting-state">
              <div className="waiting-text">Awaiting customer approach...</div>
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
            <p>All {MOCK_INTERACTIONS.length} interactions processed.</p>
            <button className="btn btn-play" onClick={() => onFinish(computeFinalScore(completed))}>
              View Scorecard →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
