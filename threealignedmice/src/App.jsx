import './App.css'

function App() {
  return (
    <div className="landing">
      <div className="sky" />
      <div className="sun" />

      <div className="content">
        <div className="title-wrapper">
          <div className="ornament">✦ ✦ ✦</div>
          <h1 className="title">Lasso</h1>
          <div className="ornament">✦ ✦ ✦</div>
          <p className="subtitle">Wrangle Your Agent</p>
        </div>

        <div className="buttons">
          <button className="btn btn-play">
            <span className="btn-icon">▶</span>
            Play
          </button>
          <button className="btn btn-settings">
            <span className="btn-icon">⚙</span>
            Settings
          </button>
          <button className="btn btn-learn">
            <span className="btn-icon">✦</span>
            Learn More
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

export default App
