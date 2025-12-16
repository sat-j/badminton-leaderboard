import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

type Weekly = {
  id: string
  week: number
  top_players: {
    id: string
    name: string
    rating: number
    matches_played: number
    wins: number
  }[]
  stats: any
}

export function WeeklyStandings() {
  const [weeks, setWeeks] = useState<Weekly[]>([])

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('weekly_standings')
        .select('*')
        .order('week', { ascending: false })

      if (error) {
        console.error(error)
        return
      }
      setWeeks((data || []) as Weekly[])
    }
    load()
  }, [])

  return (
    <div>
      <h2>Weekly Standings</h2>
      {weeks.map((w) => (
        <div key={w.id} style={{ marginBottom: '1rem' }}>
          <h3>Week {w.week}</h3>
          <p>
            Most matches: {w.stats.mostMatches?.name} (
            {w.stats.mostMatches?.matches})
          </p>
          {w.stats.bestWinRate && (
            <p>
              Best win rate: {w.stats.bestWinRate.name} (
              {(w.stats.bestWinRate.winRate * 100).toFixed(0)}%)
            </p>
          )}
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Player</th>
                <th>Rating</th>
                <th>Matches</th>
                <th>Wins</th>
              </tr>
            </thead>
            <tbody>
              {w.top_players.map((p, idx) => (
                <tr key={p.id}>
                  <td>{idx + 1}</td>
                  <td>{p.name}</td>
                  <td>{p.rating.toFixed(2)}</td>
                  <td>{p.matches_played}</td>
                  <td>{p.wins}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  )
}
