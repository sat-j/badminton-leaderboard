import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

type Player = {
  id: string
  name: string
  skill_level: string
  mu: number
  sigma: number
  matches_played: number
  wins: number
  points_for: number
  points_against: number
}

export function Leaderboard() {
  const [players, setPlayers] = useState<Player[]>([])

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .order('mu', { ascending: false })

      if (error) {
        console.error(error)
        return
      }
      setPlayers(data || [])
    }
    load()
  }, [])

  return (
    <div>
      <h2>Current Leaderboard</h2>
      <table>
        <thead>
          <tr>
            <th>Player</th>
            <th>Matches</th>
            <th>Wins</th>
            <th>PF</th>
            <th>PA</th>
            <th>Rating (mu)</th>
            <th>Uncertainty (sigma)</th>
          </tr>
        </thead>
        <tbody>
          {players.map((p) => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td>{p.matches_played}</td>
              <td>{p.wins}</td>
              <td>{p.points_for}</td>
              <td>{p.points_against}</td>
              <td>{p.mu.toFixed(2)}</td>
              <td>{p.sigma.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
