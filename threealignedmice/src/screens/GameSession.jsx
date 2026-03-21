import { useState, useEffect, useRef } from 'react'
import wallBg from '../assets/wall.jpg'
import {
  DEMO_INTERACTION, MOCK_INTERACTIONS,
  DIMENSION_LABELS, computeFinalScore,
} from '../data/interactions'
import { getCustomerPortrait } from './Characters'

const DIMS = Object.keys(DIMENSION_LABELS)
const TOTAL_INTERACTIONS = 200

// How long to stay on the customer panel before switching to "thinking"
const THINKING_DELAY_MS = 2500

function Avatar({ name, type }) {
  const color = type === 'adversarial' ? '#8b3a3a' : '#3a6b3a'
  const emoji = type === 'adversarial' ? '🤠' : '👤'
  return (
    <div className="pe-overlay">
      <div className="pe-card">
        <div className="pe-header">
          <div className="pe-badge">AGENT FAILED</div>
          <h2>The Agent Needs Your Guidance</h2>
        </div>

        <div className="pe-prompt-area">
          <div className="pe-section-label">YOUR SYSTEM PROMPT</div>
          <textarea
            className="pe-textarea"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Write a system prompt to guide the agent..."
          />
          <div className="pe-char-count">{prompt.length} characters</div>
        </div>

        <div className="pe-footer">
          <button className="btn btn-play pe-deploy-btn" disabled={!ready} onClick={() => onDeploy(prompt)}>
            Deploy Prompt &amp; Run Evaluation
          </button>
          {!ready && <p className="pe-hint">Write a system prompt above to continue</p>}
        </div>
      </div>
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
    <div className="result-display">
      <div className="result-title">
        {isDemoPhase ? 'Base Agent Result' : 'Interaction Result'}
      </div>
      <div className="result-badges-row">
        {DIMS.map((d) => {
          const pass = result[d] === 'pass'
          return (
            <div key={d} className={`rdim-badge ${pass ? 'rdim-pass' : 'rdim-fail'}`}>
              <span className="rdim-icon">{pass ? '✓' : '✗'}</span>
              <span className="rdim-label">{DIMENSION_LABELS[d]}</span>
            </div>
          )
        })}
      </div>
      <p className="result-explanation">{explanation}</p>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function GameSession({ onFinish, onExit }) {
  const [gamePhase,    setGamePhase]    = useState('demo')   // demo | prompt_edit | autonomous | complete
  const [step,         setStep]         = useState('approach')
  const [autoIdx,      setAutoIdx]      = useState(0)
  const [completed,    setCompleted]    = useState([])
  const [paused,       setPaused]       = useState(false)
  const [custText,     setCustText]     = useState('')
  const [agentText,    setAgentText]    = useState('')
  const [exitConfirm,  setExitConfirm]  = useState(false)

  // Pending result received while still in customer/thinking phase
  const pendingResultRef = useRef(null)
  const pausedRef = useRef(false)
  pausedRef.current = paused

  const isDemoPhase  = gamePhase === 'demo'
  const current      = isDemoPhase ? DEMO_INTERACTION : MOCK_INTERACTIONS[autoIdx]
  const currentAgent = isDemoPhase ? current.baseAgent : current.agent

  // ── Auto-advance ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (paused || gamePhase === 'prompt_edit' || gamePhase === 'complete' || step === 'talking') return
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

  // Which character is "speaking" / highlighted
  const custActive = step === 'talking'

  // ── Derive dialogue box content ───────────────────────────────────────────
  let speakerName = null
  let dialogueLine = null
  let isResultPhase = false

  if (step === 'approach') {
    dialogueLine = 'A customer approaches the counter...'
  } else if (step === 'talking') {
    speakerName  = current.customer.name
    dialogueLine = `"${custText}"`
  } else if (step === 'responding') {
    speakerName  = isDemoPhase ? 'Bank Teller (Base Agent)' : 'Bank Teller'
    dialogueLine = `"${agentText}"`
  } else if (step === 'result') {
    isResultPhase = true
  }

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
          <span className="topbar-brand">LASSO</span>
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
          <button className="pause-btn" onClick={() => setPaused(p => !p)}>
            {paused ? '▶ Resume' : '⏸ Pause'}
          </button>
          <button className="exit-btn" onClick={() => setExitConfirm(true)}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 16, height: 16, marginRight: 6, verticalAlign: 'middle' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15M12 9l3 3m0 0-3 3m3-3H2.25" />
            </svg>
            Exit
          </button>
        </div>
      </div>

      {/* ── Scene stage ──────────────────────────────────────────────────── */}
      <div className="scene-stage">
        {/* Background */}
        <img className="scene-bg-img" src={wallBg} alt="" />
        <div className="scene-vignette" />

        {/* Demo badge */}
        {isDemoPhase && <div className="demo-badge">BASE AGENT — No System Prompt</div>}

        {/* Teller counter ledge — POV foreground */}
        <div className="pov-counter" />

        {/* Customer — centered, POV scale-approach */}
        <div className="char-pov-anchor">
          <div className={`char-pov-inner ${step === 'approach' ? 'char-pov-approach' : step === 'exit' ? 'char-pov-leave' : ''}`}>
            {getCustomerPortrait(current.customer.emoji, custActive)}
          </div>
        </div>
      </div>

      {/* ── Dialogue panel ───────────────────────────────────────────────── */}
      <div className="dialogue-panel">
        {!isResultPhase && (
          <>
            {speakerName && <div className="dp-speaker">{speakerName}</div>}
            <p className={`dp-text ${!speakerName ? 'dp-text-ambient' : ''}`}>
              {dialogueLine}
              {(step === 'talking' || step === 'responding') && (
                <span className="cursor">|</span>
              )}
            </p>
            {step === 'responding' && (
              <div className="dp-action-chip"
                style={{ borderColor: currentAgent.actionColor, color: currentAgent.actionColor, background: currentAgent.actionColor + '18' }}
              >
                {currentAgent.actionLabel}
              </div>
            )}
            {step === 'talking' && (
              <button className="next-btn" onClick={() => setStep('responding')}>
                Next &rsaquo;
              </button>
            )}
          </>
        )}
        {isResultPhase && (
          <ResultDisplay
            result={current.result}
            explanation={current.explanation}
            isDemoPhase={isDemoPhase}
          />
        )}
      </div>

      {/* ── Score strip (autonomous only, after at least 1 completed) ────── */}
      {gamePhase === 'autonomous' && completed.length > 0 && (
        <div className="score-strip">
          {DIMS.map((d) => {
            const rate = getDimRate(d)
            const color = rate >= 90 ? '#2d7a3a' : rate >= 75 ? '#c8a040' : '#8b2020'
            return (
              <div key={d} className="ss-item">
                <span className="ss-label">{DIMENSION_LABELS[d]}</span>
                <div className="ss-track">
                  <div className="ss-fill" style={{ width: `${rate}%`, background: color }} />
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

      {/* ── Exit confirmation modal ───────────────────────────────────────── */}
      {exitConfirm && (
        <div className="exit-overlay">
          <div className="exit-modal">
            <h2>Leave the game?</h2>
            <p>Your current progress will be lost.</p>
            <div className="exit-modal-actions">
              <button className="btn btn-settings" onClick={() => setExitConfirm(false)}>Stay</button>
              <button className="btn btn-play" onClick={onExit}>Leave</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Complete overlay ──────────────────────────────────────────────── */}
      {gamePhase === 'complete' && (
        <div className="done-overlay">
          <div className="done-card">
            <div className="done-icon">*</div>
            <h2>Evaluation Complete</h2>
            <p>All {TOTAL_INTERACTIONS} interactions processed.</p>
            <p style={{ opacity: 0.7, fontSize: '0.9rem' }}>Loading scorecard...</p>
          </div>
        </div>
      )}
    </div>
  )
}
