// In dev the Vite proxy forwards /sessions and /leaderboard to localhost:8000.
// In production set VITE_API_URL to your deployed backend URL.
export const API_BASE = import.meta.env.VITE_API_URL || ''

export async function createSession({ prompt, seed = 42, teamName = null }) {
  const res = await fetch(`${API_BASE}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, seed, team_name: teamName }),
  })
  if (!res.ok) throw new Error(`Failed to create session: ${res.status}`)
  return res.json()
}

export async function fetchLeaderboard(limit = 20) {
  const res = await fetch(`${API_BASE}/leaderboard?limit=${limit}`)
  if (!res.ok) throw new Error('Failed to fetch leaderboard')
  return res.json()
}

export function openSessionStream(sessionId) {
  return new EventSource(`${API_BASE}/sessions/${sessionId}/start`)
}
