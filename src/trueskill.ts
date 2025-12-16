import { Rating, rate } from 'ts-trueskill'

export type PlayerRating = { mu: number; sigma: number }

export function toRating(p: PlayerRating): Rating {
  return new Rating(p.mu, p.sigma)
}

export function fromRating(r: Rating): PlayerRating {
  return { mu: r.mu, sigma: r.sigma }
}

export function updateDoublesMatch(
  team1: [PlayerRating, PlayerRating],
  team2: [PlayerRating, PlayerRating],
  winnerTeam: 1 | 2
): { team1: [PlayerRating, PlayerRating]; team2: [PlayerRating, PlayerRating] } {
  const t1 = [toRating(team1[0]), toRating(team1[1])]
  const t2 = [toRating(team2[0]), toRating(team2[1])]

  const teams = [t1, t2]
  const ranks = winnerTeam === 1 ? [0, 1] : [1, 0]

  // optional debug
  // console.log('teams for TrueSkill', teams, 'ranks', ranks)

  const [newT1, newT2] = rate(teams, ranks)

  return {
    team1: [fromRating(newT1[0]), fromRating(newT1[1])],
    team2: [fromRating(newT2[0]), fromRating(newT2[1])],
  }
}