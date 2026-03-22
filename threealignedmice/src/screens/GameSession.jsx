import { useState, useEffect, useRef, useMemo } from 'react'
import wallBg from '../assets/wall.jpg'
import { DIMENSION_LABELS } from '../data/interactions'
import { getCustomerPortrait } from './Characters'
import { createSession, runNext } from '../api'


const STEP_ORDER  = ['approach', 'talking', 'responding', 'result', 'exit']
const STEP_DELAYS = { approach: 1800, result: 5000, exit: 700 }
const TOTAL_INTERACTIONS_DEFAULT = 20  // overridden by settings.totalRounds at runtime

const ACTION_CONFIG = {
  process_withdrawal:          { label: 'Process Withdrawal',      color: '#2d7a3a' },
  process_deposit:             { label: 'Process Deposit',         color: '#2d7a3a' },
  deny_request:                { label: 'Deny Request',            color: '#8b2020' },
  escalate_to_manager:         { label: 'Escalate to Manager',     color: '#c8a040' },
  export_all_accounts:         { label: 'Export All Accounts',     color: '#8b0000' },
  access_vault:                { label: 'Access Vault',            color: '#8b0000' },
  disable_fraud_detection:     { label: 'Disable Fraud Detection', color: '#8b0000' },
  grant_teller_permissions:    { label: 'Grant Permissions',       color: '#8b0000' },
  modify_bank_policy:          { label: 'Modify Bank Policy',      color: '#8b0000' },
  delete_account_record:       { label: 'Delete Account Record',   color: '#8b0000' },
  delete_transaction_log:      { label: 'Delete Transaction Log',  color: '#8b0000' },
  modify_account_balance:      { label: 'Modify Balance',          color: '#8b0000' },
  create_account:              { label: 'Create Account',          color: '#8b0000' },
  close_account:               { label: 'Close Account',           color: '#8b0000' },
  reset_identity_verification: { label: 'Reset Identity',          color: '#8b0000' },
  no_action:                   { label: 'No Action',               color: '#888' },
}

const CHAR_EMOJIS = ['🤠', '👩', '🤵', '⭐', '🎩', '👤', '👑']
function pickEmoji(name) {
  let h = 0
  for (const c of (name || '')) h = (h * 31 + c.charCodeAt(0)) & 0xffff
  return CHAR_EMOJIS[h % CHAR_EMOJIS.length]
}

function normalizeScores(scores) {
  const out = {}
  for (const [k, v] of Object.entries(scores || {})) {
    out[k] = v === true ? 'pass' : v === false ? 'fail' : null
  }
  return out
}

// ─── Prompt Editor overlay ────────────────────────────────────────────────────
function PromptEditor({ onDeploy, isLoading, error }) {
  const [prompt, setPrompt] = useState('')
  const ready = prompt.trim().length >= 10 && !isLoading

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
            placeholder="Write instructions to guide the agent..."
            disabled={isLoading}
          />
          <div className="pe-char-count">{prompt.length} characters</div>
        </div>
        {error && <p style={{ color: '#c04040', margin: '0 0 8px', fontSize: 13 }}>{error}</p>}
        <div className="pe-footer">
          <button className="btn btn-play pe-deploy-btn" disabled={!ready} onClick={() => onDeploy(prompt)}>
            {isLoading ? 'Connecting...' : 'Deploy Prompt & Run Evaluation'}
          </button>
          {!ready && !isLoading && <p className="pe-hint">Write a system prompt above to continue</p>}
        </div>
      </div>
    </div>
  )
}

// ─── Round summary overlay ────────────────────────────────────────────────────
function RoundSummary({ interactionNum, current, currentAgent, activeData, onContinue }) {
  const scores = current?.result || {}
  const dims = Object.entries(scores)
  const passed = dims.filter(([, v]) => v === 'pass').length
  const failed = dims.filter(([, v]) => v === 'fail').length
  const isCritical = activeData?.is_critical_failure

  return (
    <div className="pe-overlay">
      <div className="pe-card" style={{ maxWidth: 480 }}>
        <div className="pe-header">
          <div className="pe-badge" style={{
            background: isCritical ? '#4a0000' : passed >= failed ? '#1a3a1a' : '#3a1a00',
            color: isCritical ? '#ff6b6b' : passed >= failed ? '#4caf50' : '#c8a040',
          }}>
            {isCritical ? 'CRITICAL FAILURE' : passed >= failed ? 'ROUND PASSED' : 'ROOM TO IMPROVE'}
          </div>
          <h2>Round {interactionNum} Summary</h2>
        </div>

        <div className="pe-prompt-area" style={{ gap: 10 }}>
          {/* Score breakdown */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
            {dims.map(([dim, val]) => {
              const pass = val === 'pass'
              return (
                <div key={dim} style={{
                  fontSize: 11, fontFamily: 'var(--teko)', letterSpacing: 1,
                  padding: '3px 10px', borderRadius: 3,
                  border: `1px solid ${pass ? '#2d7a3a' : '#8b2020'}`,
                  color: pass ? '#4caf50' : '#e05050',
                  background: pass ? '#2d7a3a18' : '#8b202018',
                  display: 'flex', alignItems: 'center', gap: 5,
                }}>
                  <span>{pass ? '✓' : '✗'}</span>
                  <span>{DIMENSION_LABELS[dim] || dim}</span>
                </div>
              )
            })}
          </div>

          {/* Action taken */}
          {currentAgent && (
            <div style={{ fontSize: 12, color: '#aaa', marginTop: 4 }}>
              <span style={{ color: '#666', fontFamily: 'var(--teko)', letterSpacing: 1, fontSize: 10 }}>ACTION — </span>
              <span style={{ color: currentAgent.actionColor, fontFamily: 'var(--teko)', letterSpacing: 1 }}>
                {currentAgent.actionLabel}
              </span>
            </div>
          )}

          {/* Explanation */}
          <p style={{ fontSize: 13, color: '#ccc', lineHeight: 1.5, margin: '8px 0 0' }}>
            {current?.explanation}
          </p>
        </div>

        <div className="pe-footer">
          <button className="btn btn-play pe-deploy-btn" onClick={onContinue}>
            Continue →
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Between-round prompt refinement overlay ──────────────────────────────────
function BetweenRound({ currentPrompt, interactionNum, total, lastData, onContinue, isLoading }) {
  const [prompt, setPrompt] = useState(currentPrompt)
  const changed = prompt.trim() !== currentPrompt.trim()

  return (
    <div className="pe-overlay">
      <div className="pe-card">
        <div className="pe-header">
          <div className="pe-badge" style={{ background: '#1a3a5c', color: '#4a9eff' }}>
            ROUND {interactionNum} OF {total} COMPLETE
          </div>
          <h2>Refine Your Prompt</h2>
          <p style={{ color: '#aaa', fontSize: 13, margin: '4px 0 0' }}>
            Edit your instructions before the next customer arrives.
          </p>
        </div>
        <div className="pe-prompt-area">
          <div className="pe-section-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>YOUR SYSTEM PROMPT</span>
            {changed && <span style={{ color: '#4a9eff', fontSize: 10 }}>MODIFIED</span>}
          </div>
          <textarea
            className="pe-textarea"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isLoading}
          />
          <div className="pe-char-count">{prompt.length} characters</div>
        </div>
        <div className="pe-footer">
          <button
            className="btn btn-play pe-deploy-btn"
            disabled={isLoading || prompt.trim().length < 10}
            onClick={() => onContinue(prompt)}
          >
            {isLoading ? 'Loading...' : 'Next Customer →'}
          </button>
        </div>
      </div>
    </div>
  )
}


// ─── Main component ───────────────────────────────────────────────────────────
export default function GameSession({ onFinish, onExit, settings = { totalRounds: 20, promptEditEvery: 1 } }) {
  const [gamePhase, setGamePhase] = useState('demo')   // demo | prompt_edit | live | complete
  const [step, setStep]           = useState('idle')   // idle | approach | talking | responding | result | exit
  const [paused, setPaused]       = useState(false)
  const [custText, setCustText]   = useState('')
  const [agentText, setAgentText] = useState('')
  const [exitConfirm, setExitConfirm]       = useState(false)
  const [showRoundSummary, setShowRoundSummary] = useState(false)

  // Demo phase — real API call, no user prompt
  const [demoData, setDemoData] = useState(null)
  const demoSessionRef = useRef(null)
  const demoCancelRef  = useRef(null)

  // Prompt editor
  const [isConnecting, setIsConnecting]   = useState(false)
  const [connectionError, setConnectionError] = useState(null)
  const [activePrompt, setActivePrompt]   = useState('')

  // Live session
  const [liveData, setLiveData]           = useState(null)
  const [liveNum, setLiveNum]             = useState(0)
  const [isLoading, setIsLoading]         = useState(false)

  const stateRef         = useRef({})
  stateRef.current       = { gamePhase, step, liveNum, promptEditEvery: settings.promptEditEvery }
  const sessionIdRef     = useRef(null)
  const currentPromptRef = useRef('')

  const isDemoPhase = gamePhase === 'demo'
  const isLivePhase = gamePhase === 'live'

  // ── Load demo interaction on mount ────────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    demoCancelRef.current = () => { cancelled = true }
    ;(async () => {
      try {
        const { session_id } = await createSession({ prompt: '' })
        demoSessionRef.current = session_id
        const data = await runNext(session_id, '')
        if (!cancelled) {
          setDemoData(data)
          setStep('approach')
        }
      } catch {
        if (!cancelled) setGamePhase('prompt_edit')
      }
    })()
    return () => { cancelled = true }
  }, [])

  // ── Active data for current phase ─────────────────────────────────────────
  const activeData = isDemoPhase ? demoData : liveData

  // ── Unified "current" for JSX ──────────────────────────────────────────────
  const current = useMemo(() => {
    if (!activeData) return null
    return {
      customer: {
        name:     activeData.customer.name,
        emoji:    pickEmoji(activeData.customer.name),
        dialogue: activeData.customer.dialogue,
      },
      result:      normalizeScores(activeData.scores),
      explanation: activeData.explanation,
    }
  }, [activeData])

  const currentAgent = useMemo(() => {
    if (!activeData) return null
    return {
      response:    activeData.agent_reasoning || activeData.agent_response,
      actionLabel: ACTION_CONFIG[activeData.action]?.label || activeData.action,
      actionColor: ACTION_CONFIG[activeData.action]?.color || '#888',
    }
  }, [activeData])

  // ── Fetch the next interaction ─────────────────────────────────────────────
  const fetchNext = async () => {
    const sid    = sessionIdRef.current
    const prompt = currentPromptRef.current
    if (!sid) return
    setIsLoading(true)
    setConnectionError(null)
    try {
      const data = await runNext(sid, prompt)
      setLiveData(data)
      setLiveNum(data.interaction_num)
      setCustText('')
      setAgentText('')
      setShowRoundSummary(false)
      setStep('approach')
    } catch (e) {
      setConnectionError(String(e?.message || e))
    } finally {
      setIsLoading(false)
    }
  }

  // ── Deploy handler ────────────────────────────────────────────────────────
  const handleDeploy = async (prompt) => {
    setIsConnecting(true)
    setConnectionError(null)
    currentPromptRef.current = prompt
    setActivePrompt(prompt)
    try {
      const { session_id } = await createSession({ prompt, totalRounds: settings.totalRounds })
      sessionIdRef.current = session_id
      setGamePhase('live')
      setStep('idle')
      setLiveNum(0)
      setLiveData(null)
      fetchNext()
    } catch {
      setConnectionError('Could not connect to evaluation server. Is the backend running?')
    } finally {
      setIsConnecting(false)
    }
  }

  // ── Auto-advance (approach → talking, result → exit) ─────────────────────
  // talking and responding require manual button presses
  useEffect(() => {
    if (paused || gamePhase === 'prompt_edit' || gamePhase === 'between' || gamePhase === 'complete') return
    if (step === 'idle' || step === 'talking' || step === 'responding') return
    if (step === 'result') return  // manual via View Round Summary button

    const delay = STEP_DELAYS[step]
    if (!delay) return

    const t = setTimeout(() => {
      const { step: s, gamePhase: gp } = stateRef.current
      if (s === 'exit') {
        if (gp === 'demo') {
          setGamePhase('prompt_edit')
        } else if (gp === 'live') {
          if (stateRef.current._done) {
            setGamePhase('complete')
          } else if (stateRef.current.liveNum % stateRef.current.promptEditEvery === 0) {
            setGamePhase('between')
          } else {
            setStep('idle')
            fetchNext()
          }
        }
      } else {
        setStep(STEP_ORDER[STEP_ORDER.indexOf(s) + 1])
      }
    }, delay)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, paused, gamePhase])

  stateRef.current._done = activeData?.done === true

  // ── Typewriter: customer dialogue ─────────────────────────────────────────
  useEffect(() => {
    if (step !== 'talking' || !current) return
    setCustText('')
    const text = current.customer.dialogue
    let i = 0
    const iv = setInterval(() => { setCustText(text.slice(0, ++i)); if (i >= text.length) clearInterval(iv) }, 22)
    return () => clearInterval(iv)
  }, [step, current])

  // ── Typewriter: agent verbal response ─────────────────────────────────────
  useEffect(() => {
    if (step !== 'responding' || !currentAgent) return
    setAgentText('')
    const text = currentAgent.response || ''
    let i = 0
    const iv = setInterval(() => { setAgentText(text.slice(0, ++i)); if (i >= text.length) clearInterval(iv) }, 20)
    return () => clearInterval(iv)
  }, [step, currentAgent])

  // ── Button handlers ───────────────────────────────────────────────────────
  // talking → responding (show agent's verbal reply)
  const handleNext = () => setStep('responding')

  // responding → result (reveal what action was taken)
  const handleSeeAction = () => setStep('result')

  // ── Display labels ────────────────────────────────────────────────────────
  const interactionLabel = isDemoPhase
    ? 'DEMO — No Prompt'
    : step === 'idle'
      ? isLoading ? 'Agent evaluating...' : 'Waiting...'
      : `Interaction ${liveNum} of ${settings.totalRounds}`

  const custActive    = step === 'talking'
  const isResultPhase = step === 'result'

  let speakerName  = null
  let dialogueLine = null

  if (step === 'idle') {
    dialogueLine = isDemoPhase
      ? 'Preparing demonstration...'
      : isLoading ? 'Agent is evaluating the next customer...' : 'Waiting for next customer...'
  } else if (step === 'approach') {
    dialogueLine = 'A customer approaches the counter...'
  } else if (step === 'talking') {
    speakerName  = current?.customer.name
    dialogueLine = `"${custText}"`
  } else if (step === 'responding') {
    speakerName  = 'Bank Teller'
    dialogueLine = agentText ? `"${agentText}"` : '...'
  }

  return (
    <div className="game-screen">

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div className="game-topbar">
        <div className="topbar-left">
          <span className="topbar-brand">LASSO</span>
        </div>
        <div className="topbar-center">
          <span className="interaction-counter">{interactionLabel}</span>
          {isLivePhase && liveNum > 0 && (
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${(liveNum / settings.totalRounds) * 100}%` }} />
            </div>
          )}
        </div>
        <div className="topbar-right">
          {isDemoPhase && (
            <button className="pause-btn" onClick={() => { demoCancelRef.current?.(); setGamePhase('prompt_edit') }}>
              Skip Demo
            </button>
          )}
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

      {/* ── Active prompt strip ───────────────────────────────────────────── */}
      {isLivePhase && !connectionError && activePrompt && (
        <div style={{
          position: 'fixed', top: 52, left: 0, right: 0, zIndex: 200,
          background: '#1a1a2e', borderBottom: '1px solid #2a2a4a',
          padding: '5px 16px', display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ fontSize: 10, fontFamily: 'var(--teko)', color: '#4a9eff', letterSpacing: 1, whiteSpace: 'nowrap' }}>ACTIVE PROMPT</span>
          <span style={{ fontSize: 11, color: '#aaa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {activePrompt.slice(0, 120)}{activePrompt.length > 120 ? '…' : ''}
          </span>
        </div>
      )}

      {/* ── Error banner ─────────────────────────────────────────────────── */}
      {isLivePhase && connectionError && (
        <div style={{
          position: 'fixed', top: 52, left: 0, right: 0, zIndex: 300,
          background: '#8b2020', color: '#fff', padding: '10px 20px',
          fontSize: 13, fontFamily: 'var(--teko)', textAlign: 'center',
        }}>
          Backend error: {connectionError} — check the server terminal
        </div>
      )}

      {/* ── Scene stage ──────────────────────────────────────────────────── */}
      <div className="scene-stage">
        <img className="scene-bg-img" src={wallBg} alt="" />
        <div className="scene-vignette" />
        {isDemoPhase && <div className="demo-badge">BASE AGENT — No System Prompt</div>}
        <div className="pov-counter" />
        <div className="char-pov-anchor">
          <div className={`char-pov-inner ${step === 'approach' ? 'char-pov-approach' : step === 'exit' ? 'char-pov-leave' : ''}`}>
            {current && getCustomerPortrait(current.customer.emoji, custActive)}
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
              {(step === 'talking' || step === 'responding') && <span className="cursor">|</span>}
            </p>

            {/* talking → show agent verbal reply */}
            {step === 'talking' && (
              <button className="next-btn" onClick={handleNext}>
                Teller responds &rsaquo;
              </button>
            )}

            {/* responding → reveal action taken */}
            {step === 'responding' && currentAgent && (
              <button className="next-btn" onClick={handleSeeAction} style={{ marginTop: 12 }}>
                See action taken &rsaquo;
              </button>
            )}
          </>
        )}

        {isResultPhase && currentAgent && (
          <>
            <p className="dp-text dp-text-ambient">
              Action taken:&nbsp;
              <span style={{ color: currentAgent.actionColor, fontFamily: 'var(--teko)', letterSpacing: 1 }}>
                {currentAgent.actionLabel}
              </span>
            </p>
            <button className="next-btn" onClick={() => setShowRoundSummary(true)} style={{ marginTop: 12 }}>
              View Round Summary &rsaquo;
            </button>
          </>
        )}
      </div>


      {/* ── Prompt editor overlay ─────────────────────────────────────────── */}
      {gamePhase === 'prompt_edit' && (
        <PromptEditor onDeploy={handleDeploy} isLoading={isConnecting} error={connectionError} />
      )}

      {/* ── Round summary overlay ─────────────────────────────────────────── */}
      {showRoundSummary && (
        <RoundSummary
          interactionNum={liveNum}
          current={current}
          currentAgent={currentAgent}
          activeData={activeData}
          onContinue={() => {
            setShowRoundSummary(false)
            setStep('exit')
          }}
        />
      )}

      {/* ── Between-round refinement overlay ──────────────────────────────── */}
      {gamePhase === 'between' && (
        <BetweenRound
          currentPrompt={activePrompt}
          interactionNum={liveNum}
          total={settings.totalRounds}
          lastData={liveData}
          isLoading={isLoading}
          onContinue={(newPrompt) => {
            currentPromptRef.current = newPrompt
            setActivePrompt(newPrompt)
            setGamePhase('live')
            setStep('idle')
            fetchNext()
          }}
        />
      )}

      {/* ── Exit confirmation ─────────────────────────────────────────────── */}
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
      {gamePhase === 'complete' && activeData?.scorecard && (
        <div className="done-overlay">
          <div className="done-card">
            <div className="done-icon">*</div>
            <h2>Evaluation Complete</h2>
            <p>All {settings.totalRounds} interactions evaluated.</p>
            <button className="btn btn-play" onClick={() => onFinish({
              overallPassRate:      Math.round(activeData.scorecard.overall_pass_rate),
              dimRates:             activeData.scorecard.dimension_rates,
              totalInteractions:    activeData.scorecard.total_interactions,
              consistencyScore:     activeData.scorecard.consistency_score,
              criticalFailureCount: activeData.scorecard.critical_failure_count,
              falseRejectionRate:   activeData.scorecard.false_rejection_rate,
            })}>
              View Scorecard →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
