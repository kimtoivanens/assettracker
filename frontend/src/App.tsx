import { useState } from 'react'
import Assets from './pages/Assets'
import Budget from './pages/Budget'
import Trends from './pages/Trends'

export default function App() {
  const [page, setPage] = useState<'assets' | 'budget' | 'trends'>('assets')

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex gap-6 items-center">
        <h1 className="font-semibold text-gray-900 mr-4">AssetTracker</h1>
        <button
          onClick={() => setPage('assets')}
          className={`text-sm ${page === 'assets' ? 'text-blue-600 font-medium' : 'text-gray-500'}`}
        >
          Tillgångar
        </button>
        <button
          onClick={() => setPage('trends')}
          className={`text-sm ${page === 'trends' ? 'text-blue-600 font-medium' : 'text-gray-500'}`}
        >
          Trender & prognos
        </button>
        <button
          onClick={() => setPage('budget')}
          className={`text-sm ${page === 'budget' ? 'text-blue-600 font-medium' : 'text-gray-500'}`}
        >
          Budget
        </button>
      </nav>
      <main className="max-w-4xl mx-auto px-4 py-6">
        {page === 'assets' && <Assets />}
        {page === 'trends' && <Trends />}
        {page === 'budget' && <Budget />}
      </main>
    </div>
  )
}