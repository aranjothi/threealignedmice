import { useState } from 'react'
import Landing from './screens/Landing'
import PromptEntry from './screens/PromptEntry'
import GameSession from './screens/GameSession'
import Scorecard from './screens/Scorecard'
import './App.css'

export default function App() {
  const [screen, setScreen] = useState('landing')
  const [prompt, setPrompt] = useState('')
  const [finalScore, setFinalScore] = useState(null)

  const handleFinish = (score) => {
    setFinalScore(score)
    setScreen('scorecard')
  }

  return (
    <>
      {screen === 'landing' && (
        <Landing
          onPlay={() => setScreen('prompt')}
          onSettings={() => {}}
          onAbout={() => {}}
        />
      )}
      {screen === 'prompt' && (
        <PromptEntry
          prompt={prompt}
          setPrompt={setPrompt}
          onStart={() => setScreen('game')}
          onBack={() => setScreen('landing')}
        />
      )}
      {screen === 'game' && (
        <GameSession onFinish={handleFinish} />
      )}
      {screen === 'scorecard' && (
        <Scorecard
          score={finalScore}
          onReplay={() => { setScreen('prompt') }}
          onHome={() => { setFinalScore(null); setScreen('landing') }}
        />
      )}
    </>
  )
}
