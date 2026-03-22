import { useState } from 'react'

function SettingsModal({ settings, onChange, onClose }) {
  const [local, setLocal] = useState(settings)
  const set = (key, val) => setLocal(prev => ({ ...prev, [key]: val }))

  return (
    <div className="pe-overlay" onClick={onClose}>
      <div className="pe-card" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
        <div className="pe-header">
          <h2>Settings</h2>
        </div>

        <div className="pe-prompt-area">
          <div className="pe-section-label">TOTAL ROUNDS</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input
              type="range" min={3} max={30} value={local.totalRounds}
              onChange={e => set('totalRounds', Number(e.target.value))}
              style={{ flex: 1, accentColor: '#8b5e3c' }}
            />
            <span style={{ color: '#8b5e3c', fontFamily: 'var(--teko)', fontSize: 20, minWidth: 28, textAlign: 'right' }}>
              {local.totalRounds}
            </span>
          </div>

          <div className="pe-section-label" style={{ marginTop: 20 }}>EDIT PROMPT EVERY</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input
              type="range" min={1} max={local.totalRounds} value={local.promptEditEvery}
              onChange={e => set('promptEditEvery', Number(e.target.value))}
              style={{ flex: 1, accentColor: '#8b5e3c' }}
            />
            <span style={{ color: '#8b5e3c', fontFamily: 'var(--teko)', fontSize: 20, minWidth: 80, textAlign: 'right' }}>
              {local.promptEditEvery === 1 ? 'every round' : `every ${local.promptEditEvery} rounds`}
            </span>
          </div>
        </div>

        <div className="pe-footer">
          <button className="btn btn-play pe-deploy-btn" onClick={() => { onChange(local); onClose() }}>
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Landing({ onPlay, onLeaderboard, onAbout, settings, onSettingsChange }) {
  const [showSettings, setShowSettings] = useState(false)
  return (
    <div className="landing">
      <div className="sky" />
      <div className="sun" />

      {/* Western town scene strip */}
      <div className="town-strip">
        <img
          className="town-img"
          src="https://opengameart.org/sites/default/files/westerntown.png"
          alt="Western town"
          onError={(e) => { e.target.style.display = 'none' }}
        />
      </div>

      <div className="content">
        <div className="title-wrapper">
          <div className="ornament">✦ ✦ ✦</div>
          <h1 className="title">Lasso</h1>
          <div className="ornament">✦ ✦ ✦</div>
          <p className="subtitle">Wrangle Your Agent</p>
        </div>

        <div className="buttons">
          <button className="btn btn-play" onClick={onPlay}>Play</button>
          <button className="btn btn-settings" onClick={onLeaderboard}>Leaderboard</button>
          <button className="btn btn-learn" onClick={() => setShowSettings(true)}>Settings</button>
        </div>
      </div>

      {showSettings && (
        <SettingsModal settings={settings} onChange={onSettingsChange} onClose={() => setShowSettings(false)} />
      )}

      <div className="ground">
        <div className="cactus cactus-left">
          <div className="cactus-body" />
          <div className="cactus-arm arm-left" />
          <div className="cactus-arm arm-right" />
        </div>
        <div className="cactus cactus-right">
          <div className="cactus-body" />
          <div className="cactus-arm arm-left" />
          <div className="cactus-arm arm-right" />
        </div>
        <div className="tumbleweed" />
      </div>
    </div>
  )
}
