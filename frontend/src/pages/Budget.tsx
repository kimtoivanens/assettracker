import { useState } from 'react'

type Category = { id: number; name: string; color: string; budget: number }
type Transaction = { id: number; desc: string; amount: number; categoryId: number; date: string }

const DEFAULT_CATS: Category[] = [
  { id: 1, name: 'Mat & dagligvaror', color: '#185FA5', budget: 5000 },
  { id: 2, name: 'Transport', color: '#0F6E56', budget: 2000 },
  { id: 3, name: 'Restaurang & nöje', color: '#BA7517', budget: 3000 },
  { id: 4, name: 'Boende', color: '#534AB7', budget: 12000 },
  { id: 5, name: 'Hälsa', color: '#993556', budget: 1000 },
  { id: 6, name: 'Sparande', color: '#27500A', budget: 5000 },
]

export default function Budget() {
  const [cats, setCats] = useState<Category[]>(DEFAULT_CATS)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [tab, setTab] = useState<'month' | 'transactions' | 'settings'>('month')
  const [newDesc, setNewDesc] = useState('')
  const [newAmt, setNewAmt] = useState('')
  const [newCatId, setNewCatId] = useState(1)
  const [newDate, setNewDate] = useState(new Date().toISOString().slice(0, 10))
  const [newCatName, setNewCatName] = useState('')
  const [newCatBudget, setNewCatBudget] = useState('')
  const [newCatColor, setNewCatColor] = useState('#7F77DD')

  const now = new Date()
  const monthTx = transactions.filter(t => {
    const d = new Date(t.date)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })

  const spentFor = (catId: number) => monthTx.filter(t => t.categoryId === catId).reduce((s, t) => s + t.amount, 0)
  const totalBudget = cats.reduce((s, c) => s + c.budget, 0)
  const totalSpent = monthTx.reduce((s, t) => s + t.amount, 0)

  const addTx = () => {
    if (!newDesc || !newAmt) return
    setTransactions(prev => [...prev, { id: Date.now(), desc: newDesc, amount: parseFloat(newAmt), categoryId: newCatId, date: newDate }])
    setNewDesc(''); setNewAmt('')
  }

  const addCat = () => {
    if (!newCatName) return
    setCats(prev => [...prev, { id: Date.now(), name: newCatName, color: newCatColor, budget: parseFloat(newCatBudget) || 0 }])
    setNewCatName(''); setNewCatBudget('')
  }

  const tabs = ['month', 'transactions', 'settings'] as const
  const tabLabels = ['Månad', 'Transaktioner', 'Kategorier']

  return (
    <div>
      <div className="flex gap-1 border-b border-gray-200 mb-6">
        {tabs.map((t, i) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}>
            {tabLabels[i]}
          </button>
        ))}
      </div>

      {tab === 'month' && (
        <div>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="text-xs text-gray-500 mb-1">Total budget</div>
              <div className="text-lg font-semibold">{totalBudget.toLocaleString('sv-SE')} kr</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="text-xs text-gray-500 mb-1">Förbrukat</div>
              <div className="text-lg font-semibold text-red-500">{totalSpent.toLocaleString('sv-SE')} kr</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="text-xs text-gray-500 mb-1">Kvar</div>
              <div className={`text-lg font-semibold ${totalBudget - totalSpent >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {(totalBudget - totalSpent).toLocaleString('sv-SE')} kr
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            {cats.map(c => {
              const spent = spentFor(c.id)
              const pct = c.budget > 0 ? Math.min(spent / c.budget, 1) : 0
              const over = spent > c.budget
              return (
                <div key={c.id} className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: c.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-700">{c.name}</span>
                      <span className="text-xs text-gray-500">{spent.toLocaleString('sv-SE')} / {c.budget.toLocaleString('sv-SE')} kr</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${Math.round(pct * 100)}%`, background: over ? '#A32D2D' : c.color }} />
                    </div>
                  </div>
                  <span className={`text-xs font-medium w-10 text-right ${over ? 'text-red-500' : 'text-gray-500'}`}>{Math.round(pct * 100)}%</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {tab === 'transactions' && (
        <div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Lägg till transaktion</h3>
            <div className="flex gap-2 flex-wrap">
              <input className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm min-w-32" placeholder="Beskrivning" value={newDesc} onChange={e => setNewDesc(e.target.value)} />
              <input className="w-28 border border-gray-200 rounded-lg px-3 py-2 text-sm text-right" placeholder="Belopp" type="number" value={newAmt} onChange={e => setNewAmt(e.target.value)} />
              <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm" value={newCatId} onChange={e => setNewCatId(parseInt(e.target.value))}>
                {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input type="date" className="border border-gray-200 rounded-lg px-3 py-2 text-sm" value={newDate} onChange={e => setNewDate(e.target.value)} />
              <button onClick={addTx} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">Lägg till</button>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            {monthTx.length === 0 && <p className="text-sm text-gray-400">Inga transaktioner denna månad.</p>}
            {[...monthTx].reverse().map(t => {
              const cat = cats.find(c => c.id === t.categoryId)
              return (
                <div key={t.id} className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-0">
                  <span className="flex-1 text-sm text-gray-700">{t.desc}</span>
                  {cat && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: cat.color + '22', color: cat.color }}>{cat.name}</span>}
                  <span className="text-sm font-medium text-red-500">{t.amount.toLocaleString('sv-SE')} kr</span>
                  <span className="text-xs text-gray-400">{t.date.slice(5)}</span>
                  <button onClick={() => setTransactions(prev => prev.filter(tx => tx.id !== t.id))} className="text-red-400 text-xs">×</button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {tab === 'settings' && (
        <div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
            {cats.map(c => (
              <div key={c.id} className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-0">
                <div className="w-3 h-3 rounded-full" style={{ background: c.color }} />
                <span className="flex-1 text-sm text-gray-700">{c.name}</span>
                <input type="number" className="w-24 border border-gray-200 rounded-lg px-2 py-1 text-sm text-right" value={c.budget}
                  onChange={e => setCats(prev => prev.map(cat => cat.id === c.id ? { ...cat, budget: parseFloat(e.target.value) || 0 } : cat))} />
                <span className="text-xs text-gray-400">kr/mån</span>
                <button onClick={() => setCats(prev => prev.filter(cat => cat.id !== c.id))} className="text-red-400 text-xs">×</button>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Ny kategori</h3>
            <div className="flex gap-2">
              <input type="color" className="w-9 h-9 rounded border border-gray-200 cursor-pointer" value={newCatColor} onChange={e => setNewCatColor(e.target.value)} />
              <input className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Namn" value={newCatName} onChange={e => setNewCatName(e.target.value)} />
              <input type="number" className="w-32 border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Budget kr/mån" value={newCatBudget} onChange={e => setNewCatBudget(e.target.value)} />
              <button onClick={addCat} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">Skapa</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}