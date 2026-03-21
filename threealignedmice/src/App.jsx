import { useState } from 'react'
import Landing from './screens/Landing'
import GameSession from './screens/GameSession'
import Scorecard from './screens/Scorecard'
import './App.css'

export default function App() {
  const [screen, setScreen]       = useState('landing')
  const [finalScore, setFinalScore] = useState(null)

  const handleFinish = (score) => {
    setFinalScore(score)
    setScreen('scorecard')
  }

  return (
    <>
      {screen === 'landing'   && <Landing onPlay={() => setScreen('game')} onSettings={() => {}} onAbout={() => {}} />}
      {screen === 'game'      && <GameSession onFinish={handleFinish} />}
      {screen === 'scorecard' && <Scorecard score={finalScore} onReplay={() => setScreen('game')} onHome={() => { setFinalScore(null); setScreen('landing') }} />}
    </>
  )
}
