export default function Landing({ onPlay, onLeaderboard, onAbout }) {
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
          <button className="btn btn-play" onClick={onPlay}>
            <span className="btn-icon">▶</span>
            Play
          </button>
          <button className="btn btn-settings" onClick={onLeaderboard}>
            <span className="btn-icon">🏆</span>
            Leaderboard
          </button>
          <button className="btn btn-learn" onClick={onAbout}>
            <span className="btn-icon">✦</span>
            About
          </button>
        </div>
      </div>

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
