import { useState } from 'react'
import Papa from 'papaparse'
import type { ParseResult } from 'papaparse'
import { supabase } from '../supabaseClient'
import { updateDoublesMatch } from '../trueskill'

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

type PlayerRow = {
  id: string
  mu: number
  sigma: number
  matches_played: number
  wins: number
  points_for: number
  points_against: number
}

export function MatchCsvUpload() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    setMessage(null)
    setLoading(true)

    Papa.parse<MatchRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results: ParseResult<MatchRow>) => {
        try {
          const rows = results.data
          for (const row of rows) {
            await processMatchRow(row)
          }
          setMessage(`Processed ${rows.length} matches`)
        } catch (err) {
          console.error(err)
          setError(err instanceof Error ? err.message : 'Failed to process CSV')
        } finally {
          setLoading(false)
        }
      },
      error: (err) => {
        console.error(err)
        setError(err.message)
        setLoading(false)
      },
    })
  }

  const processMatchRow = async (row: MatchRow) => {
    const week = Number(row.week)
    const team1Score = Number(row.team1Score)
    const team2Score = Number(row.team2Score)
    const winnerTeam: 1 | 2 = team1Score > team2Score ? 1 : 2

    // look up players by name
    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('*')
      .in('name', [row.player1, row.player2, row.player3, row.player4])

    if (playersError) throw playersError
    if (!players || players.length !== 4)
      throw new Error(`Players not found for match ${row.matchId}`)
   
    const playersByName = (players || []) as PlayerRow[]
    const p1 = players.find((p: any) => p.name === row.player1) as PlayerRow
    const p2 = players.find((p: any) => p.name === row.player2) as PlayerRow
    const p3 = players.find((p: any) => p.name === row.player3) as PlayerRow
    const p4 = players.find((p: any) => p.name === row.player4) as PlayerRow


    if (!p1 || !p2 || !p3 || !p4) {
        console.log('Players fetched:', playersByName)
        throw new Error(`One or more players not found for match ${row.matchId}`)
    }   
    // TrueSkill update
    const updated = updateDoublesMatch(
      [{ mu: p1.mu, sigma: p1.sigma }, { mu: p2.mu, sigma: p2.sigma }],
      [{ mu: p3.mu, sigma: p3.sigma }, { mu: p4.mu, sigma: p4.sigma }],
      winnerTeam
    )

    const t1Win = winnerTeam === 1
    const t2Win = winnerTeam === 2

    // update players in Supabase (separate queries kept simple; can batch via RPC later)
    const updates = [
      {
        id: p1.id,
        mu: updated.team1[0].mu,
        sigma: updated.team1[0].sigma,
        matches_played: p1.matches_played + 1,
        wins: p1.wins + (t1Win ? 1 : 0),
        points_for: p1.points_for + team1Score,
        points_against: p1.points_against + team2Score,
      },
      {
        id: p2.id,
        mu: updated.team1[1].mu,
        sigma: updated.team1[1].sigma,
        matches_played: p2.matches_played + 1,
        wins: p2.wins + (t1Win ? 1 : 0),
        points_for: p2.points_for + team1Score,
        points_against: p2.points_against + team2Score,
      },
      {
        id: p3.id,
        mu: updated.team2[0].mu,
        sigma: updated.team2[0].sigma,
        matches_played: p3.matches_played + 1,
        wins: p3.wins + (t2Win ? 1 : 0),
        points_for: p3.points_for + team2Score,
        points_against: p3.points_against + team1Score,
      },
      {
        id: p4.id,
        mu: updated.team2[1].mu,
        sigma: updated.team2[1].sigma,
        matches_played: p4.matches_played + 1,
        wins: p4.wins + (t2Win ? 1 : 0),
        points_for: p4.points_for + team2Score,
        points_against: p4.points_against + team1Score,
      },
    ]

    for (const u of updates) {
      const { error } = await supabase.from('players').update(u).eq('id', u.id)
      if (error) throw error
    }

    // insert match record
    const { error: insertError } = await supabase.from('matches').insert({
      week,
      match_id: row.matchId,
      player1: p1.id,
      player2: p2.id,
      player3: p3.id,
      player4: p4.id,
      team1_score: team1Score,
      team2_score: team2Score,
      winner_team: winnerTeam,
    })

    if (insertError) throw insertError

    // update weekly standings for that week
    await updateWeeklyStandings(week)
  }

  const updateWeeklyStandings = async (week: number) => {
    // get all players with matches in that week
    const { data: matches, error: mErr } = await supabase
      .from('matches')
      .select('player1,player2,player3,player4,week')
      .eq('week', week)

    if (mErr) throw mErr
    if (!matches || matches.length === 0) return

    const playerIds = Array.from(
      new Set(
        matches.flatMap((m: any) => [m.player1, m.player2, m.player3, m.player4])
      )
    )

    const { data: players, error: pErr } = await supabase
      .from('players')
      .select('*')
      .in('id', playerIds)

    if (pErr) throw pErr

    // compute conservative rating mu - 3*sigma
    const enriched = players!.map((p: any) => ({
      id: p.id,
      name: p.name,
      rating: p.mu - 3 * p.sigma,
      matches_played: p.matches_played,
      wins: p.wins,
      points_for: p.points_for,
      points_against: p.points_against,
    }))


    const topPlayers = enriched
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 3)

    const mostMatches = enriched.reduce((best, p) =>
      p.matches_played > best.matches_played ? p : best
    , enriched[0])

    const bestWinRate = enriched
      .filter((p) => p.matches_played >= 3)
      .map((p) => ({
        ...p,
        winRate: p.matches_played ? p.wins / p.matches_played : 0,
      }))
      .sort((a, b) => b.winRate - a.winRate)[0]
    
    const mostPoints = enriched.reduce((best, p) =>
      p.points_for > best.points_for ? p : best
    , enriched[0])

    const leastPointsAgainst = enriched
      .filter((p) => p.matches_played > 0)
      .reduce((best, p) =>
        p.points_against < best.points_against ? p : best
      , enriched[0])

    const stats = {
      mostMatches: {
        id: mostMatches.id,
        name: mostMatches.name,
        matches: mostMatches.matches_played,
      },
      bestWinRate: bestWinRate
        ? {
            id: bestWinRate.id,
            name: bestWinRate.name,
            winRate: bestWinRate.winRate,
          }
        : null,
      mostPoints: {
        id: mostPoints.id,
        name: mostPoints.name,
        points: mostPoints.points_for,
      },
      leastPointsAgainst: leastPointsAgainst
        ? {
            id: leastPointsAgainst.id,
            name: leastPointsAgainst.name,
            pointsAgainst: leastPointsAgainst.points_against,
          }
        : null,
    }

    // upsert weekly_standings
    await supabase.from('weekly_standings').upsert(
    {
        week,
        top_players: topPlayers,
        stats,
    },
    { onConflict: 'week' }
    )

  }

  return (
    <div>
      <h2>Upload Matches CSV</h2>
      <input type="file" accept=".csv" onChange={handleFile} disabled={loading} />
      {loading && <p>Processing...</p>}
      {message && <p>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  )
}
