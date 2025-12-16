// App.tsx
import { useState } from 'react'
import { Leaderboard } from './components/Leaderboard'
import { MatchCsvUpload } from './components/MatchCsvUpload'
import { WeeklyStandingsTabs } from './components/WeeklyStandingsTabs'

type TabKey = 'leaderboard' | 'weekly' | 'upload'

function App() {
  const [tab, setTab] = useState<TabKey>('leaderboard')

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <h1 className="text-lg font-semibold tracking-tight">
            Badminton Doubles Leaderboard
          </h1>
          <nav className="flex gap-2 rounded-full bg-slate-800/60 p-1 text-sm">
            <button
              onClick={() => setTab('leaderboard')}
              className={`rounded-full px-3 py-1 transition ${
                tab === 'leaderboard'
                  ? 'bg-sky-500 text-slate-950'
                  : 'text-slate-300 hover:bg-slate-700'
              }`}
            >
              Leaderboard
            </button>
            <button
              onClick={() => setTab('weekly')}
              className={`rounded-full px-3 py-1 transition ${
                tab === 'weekly'
                  ? 'bg-sky-500 text-slate-950'
                  : 'text-slate-300 hover:bg-slate-700'
              }`}
            >
              Weekly standings
            </button>
            <button
              onClick={() => setTab('upload')}
              className={`rounded-full px-3 py-1 transition ${
                tab === 'upload'
                  ? 'bg-sky-500 text-slate-950'
                  : 'text-slate-300 hover:bg-slate-700'
              }`}
            >
              Upload CSV
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        {tab === 'leaderboard' && <Leaderboard />}
        {tab === 'weekly' && <WeeklyStandingsTabs />}
        {tab === 'upload' && <MatchCsvUpload />}
      </main>
    </div>
  )
}

export default App
