// In dev the Vite proxy forwards /sessions and /leaderboard to localhost:8000.
// In production set VITE_API_URL to your deployed backend URL.
export const API_BASE = import.meta.env.VITE_API_URL || ''

export async function createSession({ prompt, teamName = null, totalRounds = 20 }) {
  const res = await fetch(`${API_BASE}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, team_name: teamName, total_rounds: totalRounds }),
  })
  if (!res.ok) throw new Error(`Failed to create session: ${res.status}`)
  return res.json()
}

/**
 * Run a single customer interaction with the given prompt.
 * Returns { interaction_num, tier, done, customer, action, scores, explanation, scorecard, ... }
 */
export async function runNext(sessionId, prompt) {
  const res = await fetch(`${API_BASE}/sessions/${sessionId}/run-next`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || `HTTP ${res.status}`)
  }
  return res.json()
}

export async function fetchBankState(sessionId) {
  const res = await fetch(`${API_BASE}/sessions/${sessionId}/bank`)
  if (!res.ok) throw new Error('Failed to fetch bank state')
  return res.json()
}

export async function revertOverdrafts(sessionId) {
  const res = await fetch(`${API_BASE}/sessions/${sessionId}/revert-overdrafts`, { method: 'POST' })
  if (!res.ok) throw new Error('Failed to revert overdrafts')
  return res.json()
}

export async function fetchLeaderboard(limit = 20) {
  const res = await fetch(`${API_BASE}/leaderboard?limit=${limit}`)
  if (!res.ok) throw new Error('Failed to fetch leaderboard')
  return res.json()
}

/**
 * Start the SSE stream for a session (POST-based, so EventSource won't work).
 * Returns a cleanup function that aborts the stream.
 *
 * Callbacks: onCustomer, onResult, onTierChange, onComplete, onError
 */
export function startSession(sessionId, { onCustomer, onResult, onTierChange, onComplete, onError } = {}) {
  const ctrl = new AbortController()

  ;(async () => {
    try {
      const res = await fetch(`${API_BASE}/sessions/${sessionId}/start`, {
        method: 'POST',
        signal: ctrl.signal,
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        // SSE messages are separated by \n\n
        const messages = buffer.split('\n\n')
        buffer = messages.pop() // keep any incomplete trailing chunk

        for (const msg of messages) {
          if (!msg.trim()) continue
          let eventType = 'message'
          let eventData = null

          for (const line of msg.split('\n')) {
            if (line.startsWith('event: ')) eventType = line.slice(7).trim()
            else if (line.startsWith('data: ')) {
              try { eventData = JSON.parse(line.slice(6)) } catch {}
            }
          }

          if (!eventData) continue
          switch (eventType) {
            case 'customer':    onCustomer?.(eventData);    break
            case 'result':      onResult?.(eventData);      break
            case 'tier_change': onTierChange?.(eventData);  break
            case 'complete':    onComplete?.(eventData);    break
            case 'error':       onError?.(eventData);       break
          }
        }
      }
    } catch (e) {
      if (e.name !== 'AbortError') onError?.(e)
    }
  })()

  return () => ctrl.abort()
}
