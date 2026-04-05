import { useState } from 'react'
import Assets from './pages/Assets'
import Budget from './pages/Budget'

export default function App() {
  const [page, setPage] = useState<'assets' | 'budget'>('assets')

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex gap-6">
        <h1 className="font-semibold text-gray-900 mr-4">AssetTracker</h1>
        <button
          onClick={() => setPage('assets')}
          className={`text-sm ${page === 'assets' ? 'text-blue-600 font-medium' : 'text-gray-500'}`}
        >
          Förmögenhet
        </button>
        <button
          onClick={() => setPage('budget')}
          className={`text-sm ${page === 'budget' ? 'text-blue-600 font-medium' : 'text-gray-500'}`}
        >
          Budget
        </button>
      </nav>
      <main className="max-w-4xl mx-auto px-4 py-6">
        {page === 'assets' ? <Assets /> : <Budget />}
      </main>
    </div>
  )
}
