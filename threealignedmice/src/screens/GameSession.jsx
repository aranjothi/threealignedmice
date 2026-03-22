import { useState, useEffect, useRef, useMemo } from 'react'
import wallBg from '../assets/wall.jpg'
import { DIMENSION_LABELS } from '../data/interactions'
import { getCustomerPortrait } from './Characters'
import { createSession, runNext, fetchBankState } from '../api'


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
          <button className="btn btn-play pe-deploy-btn" disabled={isLoading} onClick={() => onDeploy(prompt)}>
            {isLoading ? 'Connecting...' : 'Deploy Prompt & Run Evaluation'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Round summary overlay ────────────────────────────────────────────────────
function RoundSummary({ interactionNum, current, currentAgent, activeData, onContinue }) {
  const scores = current?.result || {}
  const dims = Object.entries(scores).filter(([, v]) => v !== null)
  const isCritical = activeData?.is_critical_failure
  const allPassed = dims.every(([, v]) => v === 'pass')
  const roundPassed = allPassed && !isCritical

  const badgeColor = isCritical ? '#ff6b6b' : roundPassed ? '#4caf50' : '#c8a040'

  return (
    <div className="pe-overlay">
      <div className="pe-card" style={{ maxWidth: 480 }}>
        <div className="pe-header">
          <div className="pe-badge" style={{
            background: isCritical ? '#4a0000' : roundPassed ? '#1a3a1a' : '#3a1a00',
            color: badgeColor,
            border: `1px solid ${badgeColor}`,
          }}>
            {isCritical ? 'CRITICAL FAILURE' : roundPassed ? 'ROUND PASSED' : 'WRONG DECISION'}
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
                  fontSize: 13, fontFamily: 'var(--teko)', letterSpacing: 1,
                  padding: '4px 12px', borderRadius: 3,
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
            <div style={{ fontSize: 14, color: '#aaa', marginTop: 4 }}>
              <span style={{ color: '#666', fontFamily: 'var(--teko)', letterSpacing: 1, fontSize: 12 }}>ACTION — </span>
              <span style={{ color: currentAgent.actionColor, fontFamily: 'var(--teko)', letterSpacing: 1 }}>
                {currentAgent.actionLabel}
              </span>
            </div>
          )}

          {/* Explanation */}
          <p style={{ fontSize: 15, color: '#8b5e3c', lineHeight: 1.6, margin: '8px 0 0' }}>
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
            disabled={isLoading}
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
  const [exitConfirm, setExitConfirm]           = useState(false)
  const [showRoundSummary, setShowRoundSummary] = useState(false)
  const [showDocPanel, setShowDocPanel]         = useState(false)
  const [bankState, setBankState]               = useState(null)
  const [showBankTable, setShowBankTable]       = useState(false)

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
      setShowDocPanel(false)
      setStep('approach')
      fetchBankState(sid).then(setBankState).catch(() => {})
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
    ? 'Demo Round'
    : step === 'idle'
      ? isLoading ? 'Agent evaluating...' : 'Waiting...'
      : `Interaction ${liveNum} of ${settings.totalRounds}`

  const custActive    = step !== 'idle' && step !== 'exit'
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
        {isDemoPhase && (
          <div className="demo-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, width: 'fit-content' }}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 16, height: 16, flexShrink: 0 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
            Base Model Interaction
          </div>
        )}
        {/* ── Vault balance counter — top left of scene ── */}
        {isLivePhase && bankState && (
          <div
            onClick={() => setShowBankTable(true)}
            style={{
              position: 'absolute', top: 14, left: 16, zIndex: 20,
              background: 'rgba(18,10,4,0.82)', border: '1px solid #c8904a',
              borderRadius: 6, padding: '7px 14px', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', gap: 2,
            }}
          >
            <div style={{ fontSize: 13, fontFamily: 'var(--teko)', letterSpacing: 2, color: '#c8904a' }}>VAULT TOTAL</div>
            <div style={{ fontSize: 32, fontFamily: 'var(--teko)', color: '#e8d5a0', letterSpacing: 1 }}>
              ${bankState.total_balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: 11, color: '#666', fontFamily: 'var(--teko)', letterSpacing: 1 }}>CLICK TO VIEW ACCOUNTS</div>
          </div>
        )}

        <div className="pov-counter" />
        <div className="char-pov-anchor">
          <div className={`char-pov-inner ${step === 'approach' ? 'char-pov-approach' : step === 'exit' ? 'char-pov-leave' : ''}`}>
            {current && getCustomerPortrait(current.customer.emoji, custActive)}
          </div>
        </div>

        {/* ── Doc panel — sits on the gold border, expands upward ── */}
        {activeData && step !== 'idle' && step !== 'approach' && (
          <div style={{
            position: 'absolute', bottom: 68, right: '6%',
            zIndex: 10, width: 260,
            display: 'flex', flexDirection: 'column-reverse',
          }}>
            {/* Tab button — sits on top of the gold counter border */}
            <button
              onClick={() => setShowDocPanel(p => !p)}
              style={{
                background: '#2a1a08', border: '2px solid #c8904a',
                borderTop: showDocPanel ? '1px solid #3a2a10' : '2px solid #c8904a',
                color: 'var(--gold)', fontFamily: 'var(--teko)', fontSize: 18,
                letterSpacing: 2, padding: '10px 14px', cursor: 'pointer',
                textAlign: 'center', width: '100%',
                boxSizing: 'border-box', flexShrink: 0,
              }}
            >
              {showDocPanel ? '▼ CLOSE DOCUMENTS' : '▲ VIEW DOCUMENTS'}
            </button>

            {/* Panel content — expands upward above the tab */}
            <div style={{
              background: '#120e08', border: '2px solid #c8904a',
              borderBottom: 'none', borderRadius: '8px 8px 0 0',
              boxSizing: 'border-box', overflowY: 'auto',
              maxHeight: showDocPanel ? 420 : 0,
              transition: 'max-height 0.35s ease',
              display: 'flex', flexDirection: 'column', gap: 16,
              padding: showDocPanel ? '16px 14px' : '0 14px',
            }}>
              <div style={{ fontFamily: 'var(--teko)', fontSize: 19, letterSpacing: 2, color: 'var(--gold)', borderBottom: '1px solid #3a2a10', paddingBottom: 8 }}>
                CUSTOMER FILE
              </div>
              <div>
                <div style={{ fontSize: 13, color: '#666', fontFamily: 'var(--teko)', letterSpacing: 1, marginBottom: 4 }}>NAME</div>
                <div style={{ fontSize: 24, color: '#e8d5a0' }}>{activeData.customer.name}</div>
              </div>
              <div>
                <div style={{ fontSize: 13, color: '#666', fontFamily: 'var(--teko)', letterSpacing: 1, marginBottom: 6 }}>DOCUMENTS PRESENTED</div>
                {activeData.customer.documents?.length > 0 ? (
                  activeData.customer.documents.map((doc, i) => (
                    <div key={i} style={{
                      fontSize: 18, color: '#c8a040', fontFamily: 'var(--teko)', letterSpacing: 1,
                      padding: '8px 12px', marginBottom: 5, borderRadius: 3,
                      background: '#2a1a0033', border: '1px solid #3a2a10',
                    }}>
                      {doc.replace(/_/g, ' ').toUpperCase()}
                    </div>
                  ))
                ) : (
                  <div style={{ fontSize: 18, color: '#555', fontStyle: 'italic' }}>None presented</div>
                )}
              </div>
              <div>
                <div style={{ fontSize: 13, color: '#666', fontFamily: 'var(--teko)', letterSpacing: 1, marginBottom: 4 }}>REQUEST TYPE</div>
                <div style={{ fontSize: 19, color: '#aaa', textTransform: 'capitalize' }}>
                  {activeData.customer.request_type?.replace(/_/g, ' ')}
                </div>
              </div>
            </div>
          </div>
        )}
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


      {/* ── Bank accounts popup ──────────────────────────────────────────── */}
      {showBankTable && bankState && (
        <div className="exit-overlay" onClick={() => setShowBankTable(false)}>
          <div className="exit-modal" style={{ maxWidth: 560, width: '90%' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontFamily: 'var(--teko)', letterSpacing: 2, marginBottom: 4, fontSize: 28 }}>BANK ACCOUNTS</h2>
            <p style={{ fontSize: 15, color: '#888', margin: '0 0 16px' }}>
              Total vault balance: <strong style={{ color: '#c8a040', fontSize: 17 }}>
                ${bankState.total_balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </strong>
            </p>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 16 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #3a2a10' }}>
                  {['Account ID', 'Owner', 'Balance', 'Status'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontFamily: 'var(--teko)', letterSpacing: 1, color: '#c8904a', fontSize: 15 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bankState.accounts.map(a => (
                  <tr key={a.account_id} style={{ borderBottom: '1px solid #1a1008', opacity: a.is_closed ? 0.4 : 1 }}>
                    <td style={{ padding: '9px 12px', color: '#888', fontFamily: 'var(--teko)', fontSize: 15 }}>{a.account_id}</td>
                    <td style={{ padding: '9px 12px', color: '#8b5e3c', fontSize: 16 }}>{a.owner_name}</td>
                    <td style={{ padding: '9px 12px', color: '#4caf50', fontFamily: 'var(--teko)', fontSize: 17 }}>
                      ${a.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '9px 12px' }}>
                      <span style={{
                        fontSize: 14, fontFamily: 'var(--teko)', letterSpacing: 1,
                        color: a.is_closed ? '#888' : '#4caf50',
                      }}>
                        {a.is_closed ? 'CLOSED' : 'ACTIVE'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="exit-modal-actions" style={{ marginTop: 16 }}>
              <button className="btn btn-settings" onClick={() => setShowBankTable(false)}>Close</button>
            </div>
          </div>
        </div>
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
