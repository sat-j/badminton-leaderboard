// WeeklyStandingsTabs.tsx
import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../supabaseClient'

type WeeklyRow = {
  id: string
  week: number
  top_players: {
    id: string
    name: string
    rating: number
    matches_played: number
    wins: number
  }[]
  stats: {
    mostMatches?: { id: string; name: string; matches: number }
    bestWinRate?: { id: string; name: string; winRate: number }
    mostPoints: { id: string; name: string; points: number }
    leastPointsAgainst: { id: string; name: string; pointsAgainst: number }
      
  }
}

export function WeeklyStandingsTabs() {
  const [weeks, setWeeks] = useState<WeeklyRow[]>([])
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0)

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('weekly_standings')
        .select('*')
        .order('week', { ascending: true })

      if (!error && data) {
        setWeeks(data as WeeklyRow[])
        setCurrentWeekIndex(data.length - 1) // latest week
      }
    }
    load()
  }, [])

  const current = useMemo(
    () => (weeks.length ? weeks[currentWeekIndex] : null),
    [weeks, currentWeekIndex]
  )

  const canPrev = currentWeekIndex > 0
  const canNext = currentWeekIndex < weeks.length - 1

  type MatchRow = {
    id: string
    week: number
    team1_score: number
    team2_score: number
    winner_team: 1 | 2
    player1: { name: string } | null
    player2: { name: string } | null
    player3: { name: string } | null
    player4: { name: string } | null
  }


  const [matches, setMatches] = useState<MatchRow[]>([])

  useEffect(() => {
    if (!weeks.length) return
    const loadMatches = async () => {
      const week = weeks[currentWeekIndex].week
      const { data, error } = await supabase
        .from('matches')
        .select(`
          id,
          week,
          team1_score,
          team2_score,
          winner_team,
          player1:player1(name),
          player2:player2(name),
          player3:player3(name),
          player4:player4(name)
        `)
        .eq('week', week)
        .order('id', { ascending: true })

      if (!error && data) {
        setMatches(data as unknown as MatchRow[])
      } else {
        setMatches([])
      }
    }
    loadMatches()
  }, [weeks, currentWeekIndex])


  if (!current) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <p className="text-sm text-slate-400">
          No weekly standings yet. Upload some matches to generate week data.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Week selector with arrows */}
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900/80 px-2 py-1 text-sm">
          <button
            onClick={() => canPrev && setCurrentWeekIndex((i) => i - 1)}
            disabled={!canPrev}
            className={`rounded-full p-1.5 transition ${
              canPrev
                ? 'text-slate-200 hover:bg-slate-800'
                : 'cursor-not-allowed text-slate-600'
            }`}
          >
            ←
          </button>
          <span className="mx-3 font-medium">
            Week {current.week}
          </span>
          <button
            onClick={() => canNext && setCurrentWeekIndex((i) => i + 1)}
            disabled={!canNext}
            className={`rounded-full p-1.5 transition ${
              canNext
                ? 'text-slate-200 hover:bg-slate-800'
                : 'cursor-not-allowed text-slate-600'
            }`}
          >
            →
          </button>
        </div>

        <div className="flex gap-2 text-xs text-slate-400">
          {weeks.map((w, idx) => (
            <button
              key={w.id}
              onClick={() => setCurrentWeekIndex(idx)}
              className={`rounded-full px-2 py-1 transition ${
                idx === currentWeekIndex
                  ? 'bg-sky-500/90 text-slate-950'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              W{w.week}
            </button>
          ))}
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-sky-500/10 to-sky-400/5 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Most matches
          </p>
          {current.stats.mostMatches ? (
            <>
              <p className="mt-1 text-sm font-semibold">
                {current.stats.mostMatches.name}
              </p>
              <p className="text-xs text-slate-400">
                {current.stats.mostMatches.matches} matches
              </p>
            </>
          ) : (
            <p className="mt-1 text-xs text-slate-500">No data</p>
          )}
        </div>
        <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-emerald-500/10 to-emerald-400/5 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Best win rate
          </p>
          {current.stats.bestWinRate ? (
            <>
              <p className="mt-1 text-sm font-semibold">
                {current.stats.bestWinRate.name}
              </p>
              <p className="text-xs text-slate-400">
                {(current.stats.bestWinRate.winRate * 100).toFixed(0)}%
              </p>
            </>
          ) : (
            <p className="mt-1 text-xs text-slate-500">No data</p>
          )}
        </div>
        {/* Most points scored */}
        <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-amber-500/10 to-amber-400/5 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Most points scored
          </p>
          {current.stats.mostPoints ? (
            <>
              <p className="mt-1 text-sm font-semibold">
                {current.stats.mostPoints.name}
              </p>
              <p className="text-xs text-slate-400">
                {current.stats.mostPoints.points} points
              </p>
            </>
          ) : (
            <p className="mt-1 text-xs text-slate-500">No data</p>
          )}
        </div>

        {/* Least points against */}
        <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-emerald-500/10 to-emerald-400/5 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Least points against
          </p>
          {current.stats.leastPointsAgainst ? (
            <>
              <p className="mt-1 text-sm font-semibold">
                {current.stats.leastPointsAgainst.name}
              </p>
              <p className="text-xs text-slate-400">
                {current.stats.leastPointsAgainst.pointsAgainst} points
              </p>
            </>
          ) : (
            <p className="mt-1 text-xs text-slate-500">No data</p>
          )}
        </div>
      </div>

      {/* Top players table */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-900/90 text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-4 py-3 text-left">Rank</th>
              <th className="px-4 py-3 text-left">Player</th>
              <th className="px-4 py-3 text-right">Rating</th>
              <th className="px-4 py-3 text-right">Matches</th>
              <th className="px-4 py-3 text-right">Wins</th>
            </tr>
          </thead>
          <tbody>
            {current.top_players.map((p, i) => (
              <tr
                key={p.id}
                className={
                  i % 2 === 0 ? 'bg-slate-900/40' : 'bg-slate-900/10'
                }
              >
                <td className="px-4 py-2 text-left text-slate-400">
                  #{i + 1}
                </td>
                <td className="px-4 py-2 text-left font-medium">
                  {p.name}
                </td>
                <td className="px-4 py-2 text-right">
                  {p.rating.toFixed(2)}
                </td>
                <td className="px-4 py-2 text-right text-slate-300">
                  {p.matches_played}
                </td>
                <td className="px-4 py-2 text-right text-slate-300">
                  {p.wins}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Weekly results table */}
      <div className="card mt-4 overflow-hidden">
        <div className="border-b border-slate-800 bg-slate-900/80 px-4 py-3 text-sm font-medium text-slate-200">
          Weekly results
        </div>
        <div className="max-h-80 overflow-auto">
          <table className="min-w-full text-sm table-slim">
            <thead className="table-header">
              <tr>
                <th className="text-left">Team 1</th>
                <th className="text-left">Team 2</th>
                <th className="text-right">Score</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((m) => {
                const team1 = `${m.player1?.name ?? 'Player1'} / ${
                  m.player2?.name ?? 'Player2'
                }`
                const team2 = `${m.player3?.name ?? 'Player3'} / ${
                  m.player4?.name ?? 'Player4'
                }`
                const score = `${m.team1_score}-${m.team2_score}`

                const team1Win = m.winner_team === 1
                const team2Win = m.winner_team === 2

                return (
                  <tr
                    key={m.id}
                    className="border-t border-slate-800/40 hover:bg-slate-800/40"
                  >
                    <td
                      className={`text-left ${
                        team1Win ? 'font-semibold text-emerald-300' : 'text-slate-200'
                      }`}
                    >
                      {team1}
                    </td>
                    <td
                      className={`text-left ${
                        team2Win ? 'font-semibold text-emerald-300' : 'text-slate-200'
                      }`}
                    >
                      {team2}
                    </td>
                    <td className="text-right text-slate-100">
                      {score}
                    </td>
                  </tr>
                )
              })}
              {matches.length === 0 && (
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-4 text-center text-xs text-slate-500"
                  >
                    No matches recorded for this week.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>



    </div>
  )
}

