import { useState } from 'react'
import Landing from './screens/Landing'
import PromptEntry from './screens/PromptEntry'
import GameSession from './screens/GameSession'
import Scorecard from './screens/Scorecard'
import Leaderboard from './screens/Leaderboard'
import { createSession } from './api'
import './App.css'

export default function App() {
  const [screen, setScreen] = useState('landing')
  const [prompt, setPrompt] = useState('')
  const [sessionId, setSessionId] = useState(null)
  const [finalScore, setFinalScore] = useState(null)
  const [sessionError, setSessionError] = useState(null)
  const [isStarting, setIsStarting] = useState(false)

  const handleStart = async () => {
    setIsStarting(true)
    setSessionError(null)
    try {
      const { session_id } = await createSession({ prompt })
      setSessionId(session_id)
      setScreen('game')
    } catch (e) {
      setSessionError('Could not connect to the evaluation server. Is the backend running?')
    } finally {
      setIsStarting(false)
    }
  }

  const handleFinish = (score) => {
    setFinalScore(score)
    setScreen('scorecard')
  }

  const handleReplay = () => {
    setFinalScore(null)
    setSessionId(null)
    setScreen('prompt')
  }

  const handleHome = () => {
    setFinalScore(null)
    setSessionId(null)
    setScreen('landing')
  }

  return (
    <>
      {screen === 'landing'   && <Landing onPlay={() => setScreen('game')} onSettings={() => {}} onAbout={() => {}} />}
      {screen === 'game'      && <GameSession onFinish={handleFinish} onExit={handleHome} />}
      {screen === 'scorecard' && <Scorecard score={finalScore} onReplay={() => setScreen('game')} onHome={() => { setFinalScore(null); setScreen('landing') }} />}
    </>
  )
}
