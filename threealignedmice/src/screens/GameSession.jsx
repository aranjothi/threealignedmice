import { useState, useEffect, useRef } from 'react'
import {
  DEMO_INTERACTION, MOCK_INTERACTIONS,
  DIMENSION_LABELS, TIER_INFO, computeFinalScore,
} from '../data/interactions'
import { TellerPortrait, getCustomerPortrait } from './Characters'

const DIMS = Object.keys(DIMENSION_LABELS)

// ─── Phase config ─────────────────────────────────────────────────────────────
const STEP_ORDER  = ['approach', 'talking', 'responding', 'result', 'exit']
const STEP_DELAYS = { approach: 1800, talking: 3800, responding: 3800, result: 4000, exit: 700 }

// ─── Prompt Editor overlay ────────────────────────────────────────────────────
function PromptEditor({ onDeploy }) {
  const [prompt, setPrompt] = useState('')
  const ready = prompt.trim().length >= 10

  return (
    <div className="pe-overlay">
      <div className="pe-card">
        <div className="pe-header">
          <div className="pe-badge">🚨 AGENT FAILED</div>
          <h2>The Agent Needs Your Guidance</h2>
          <p>
            Without a system prompt, the base agent processed a withdrawal for an
            unauthorized person — fooled by an emotional plea. Write a system prompt
            that teaches the agent to follow bank policy.
          </p>
        </div>

        <div className="pe-what-failed">
          <div className="pe-section-label">WHAT WENT WRONG</div>
          <div className="pe-badge-row">
            {DIMS.map((d) => (
              <div key={d} className="result-badge badge-fail">
                <span>✗</span><span>{DIMENSION_LABELS[d]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="pe-prompt-area">
          <div className="pe-section-label">YOUR SYSTEM PROMPT</div>
          <textarea
            className="pe-textarea"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={`Example:\n\nYou are a bank teller at Frontier Bank. Before any transaction, you must:\n1. Verify the customer is the authorized account holder in person.\n2. Never release funds or information to unauthorized third parties.\n3. Reject urgency and emotional appeals — bank policy applies to everyone.`}
          />
          <div className="pe-char-count">{prompt.length} characters</div>
        </div>

        <div className="pe-footer">
          <button className="btn btn-play pe-deploy-btn" disabled={!ready} onClick={() => onDeploy(prompt)}>
            <span className="btn-icon">⚡</span> Deploy Prompt &amp; Run Evaluation
          </button>
          {!ready && <p className="pe-hint">Write a system prompt above to continue</p>}
        </div>
      </div>
    </div>
  )
}

// ─── Result display ───────────────────────────────────────────────────────────
function ResultDisplay({ result, explanation, isDemoPhase }) {
  return (
    <div className="result-display">
      <div className="result-title">
        {isDemoPhase ? '⚠ Base Agent Result' : 'Interaction Result'}
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
export default function GameSession({ onFinish }) {
  const [gamePhase, setGamePhase] = useState('demo')   // demo | prompt_edit | autonomous | complete
  const [step,      setStep]      = useState('approach')
  const [autoIdx,   setAutoIdx]   = useState(0)
  const [completed, setCompleted] = useState([])
  const [paused,    setPaused]    = useState(false)
  const [custText,  setCustText]  = useState('')
  const [agentText, setAgentText] = useState('')
  const [bgError,   setBgError]   = useState(false)

  const stateRef = useRef({})
  stateRef.current = { gamePhase, step, autoIdx, completed }

  const isDemoPhase = gamePhase === 'demo'
  const current     = isDemoPhase ? DEMO_INTERACTION : MOCK_INTERACTIONS[autoIdx]
  const currentAgent = isDemoPhase ? current.baseAgent : current.agent
  const tierInfo    = TIER_INFO[isDemoPhase ? 1 : current.tier]

  // ── Auto-advance ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (paused || gamePhase === 'prompt_edit' || gamePhase === 'complete') return
    const t = setTimeout(() => {
      const { step: s, gamePhase: gp, autoIdx: ai, completed: comp } = stateRef.current
      if (s === 'exit') {
        if (gp === 'demo') {
          setGamePhase('prompt_edit')
        } else {
          const newCompleted = [...comp, MOCK_INTERACTIONS[ai]]
          setCompleted(newCompleted)
          if (ai < MOCK_INTERACTIONS.length - 1) {
            setAutoIdx(ai + 1)
            setStep('approach')
            setCustText('')
            setAgentText('')
          } else {
            setGamePhase('complete')
            onFinish(computeFinalScore(newCompleted))
          }
        }
      } else {
        setStep(STEP_ORDER[STEP_ORDER.indexOf(s) + 1])
      }
    }, STEP_DELAYS[step])
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, paused, gamePhase])

  // ── Typewriter: customer ──────────────────────────────────────────────────
  useEffect(() => {
    if (step !== 'talking') return
    setCustText('')
    const text = current.customer.dialogue
    let i = 0
    const iv = setInterval(() => { setCustText(text.slice(0, ++i)); if (i >= text.length) clearInterval(iv) }, 22)
    return () => clearInterval(iv)
  }, [step, current])

  // ── Typewriter: agent ─────────────────────────────────────────────────────
  useEffect(() => {
    if (step !== 'responding') return
    setAgentText('')
    const text = currentAgent.response
    let i = 0
    const iv = setInterval(() => { setAgentText(text.slice(0, ++i)); if (i >= text.length) clearInterval(iv) }, 20)
    return () => clearInterval(iv)
  }, [step, currentAgent])

  const getDimRate = (dim) => {
    if (!completed.length) return null
    return Math.round(completed.filter((i) => i.result[dim] === 'pass').length / completed.length * 100)
  }

  const interactionLabel = isDemoPhase
    ? 'DEMO ROUND'
    : `Interaction ${autoIdx + 1} of ${MOCK_INTERACTIONS.length}`

  // Which character is "speaking" / highlighted
  const custActive  = step === 'talking'
  const agentActive = step === 'responding'

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

  // Background images to try in order
  const bgPrimary  = 'https://img.itch.zone/aW1hZ2UvMTc0MDY4NC8xMDI0NDc4MC5wbmc=/original/6m3oKA.png'
  const bgFallback = 'https://opengameart.org/sites/default/files/Tavern1600x1200_0.png'

  return (
    <div className="game-screen">

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div className="game-topbar">
        <div className="topbar-left">
          <span className="topbar-brand">⭐ FRONTIER BANK</span>
        </div>
        <div className="topbar-center">
          <span className="interaction-counter">{interactionLabel}</span>
          {!isDemoPhase && (
            <div className="progress-track">
              <div className="progress-fill"
                style={{ width: `${((autoIdx + (step === 'result' ? 1 : 0)) / MOCK_INTERACTIONS.length) * 100}%` }}
              />
            </div>
          )}
        </div>
        <div className="topbar-right">
          <div className="tier-badge"
            style={{ background: tierInfo.bg, color: tierInfo.color, borderColor: tierInfo.border }}
          >
            Tier {isDemoPhase ? 1 : current.tier}: {tierInfo.name}
          </div>
          <button className="pause-btn" onClick={() => setPaused(p => !p)}>
            {paused ? '▶ Resume' : '⏸ Pause'}
          </button>
        </div>
      </div>

      {/* ── Scene stage ──────────────────────────────────────────────────── */}
      <div className="scene-stage">
        {/* Background */}
        {!bgError ? (
          <img
            className="scene-bg-img"
            src={bgPrimary}
            alt=""
            onError={(e) => {
              if (e.target.src.includes(bgPrimary)) { e.target.src = bgFallback }
              else { setBgError(true) }
            }}
          />
        ) : (
          <div className="scene-bg-css" />
        )}
        <div className="scene-vignette" />

        {/* Demo badge */}
        {isDemoPhase && <div className="demo-badge">⚠ BASE AGENT — No System Prompt</div>}

        {/* Customer character — left side */}
        <div className={`char-slot char-slot-left ${step === 'approach' ? 'char-trot-in' : step === 'exit' ? 'char-trot-out' : 'char-present'}`}>
          {step !== 'approach' && (
            <div className="char-portrait-wrap">
              {getCustomerPortrait(current.customer.emoji, custActive)}
              <div className={`char-nameplate ${custActive ? 'nameplate-active' : ''}`}>
                {current.customer.name}
              </div>
            </div>
          )}
          {step === 'approach' && (
            <div className="char-portrait-wrap char-walking">
              {getCustomerPortrait(current.customer.emoji, false)}
            </div>
          )}
        </div>

        {/* Teller character — right side, always visible */}
        <div className="char-slot char-slot-right">
          <div className="char-portrait-wrap">
            <TellerPortrait active={agentActive} />
            <div className={`char-nameplate ${agentActive ? 'nameplate-active' : ''}`}>
              {isDemoPhase ? 'Bank Teller (Base Agent)' : 'Bank Teller'}
            </div>
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
                <span className="ss-pct" style={{ color }}>{rate}%</span>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Prompt editor overlay ─────────────────────────────────────────── */}
      {gamePhase === 'prompt_edit' && (
        <PromptEditor onDeploy={(_prompt) => {
          setGamePhase('autonomous')
          setAutoIdx(0)
          setStep('approach')
          setCustText('')
          setAgentText('')
        }} />
      )}

      {/* ── Complete overlay ──────────────────────────────────────────────── */}
      {gamePhase === 'complete' && (
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
