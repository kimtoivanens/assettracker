import { useEffect, useState } from 'react'
import { getAssets, createAsset, deleteAsset } from '../api/assets'

type Asset = { id: number; name: string; category: string; value: number }

const CATEGORIES = ['Aktier & fonder', 'Bankkonton', 'Fastigheter', 'Lån & skulder']

export default function Assets() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [name, setName] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [value, setValue] = useState('')

  useEffect(() => {
    getAssets().then(setAssets)
  }, [])

  const add = async () => {
    if (!name || !value) return
    const asset = await createAsset({ name, category, value: parseFloat(value) })
    setAssets(prev => [asset, ...prev])
    setName(''); setValue('')
  }

  const remove = async (id: number) => {
    await deleteAsset(id)
    setAssets(prev => prev.filter(a => a.id !== id))
  }

  const totals = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = assets.filter(a => a.category === cat).reduce((s, a) => s + a.value, 0)
    return acc
  }, {} as Record<string, number>)

  const netValue = totals['Aktier & fonder'] + totals['Bankkonton'] + totals['Fastigheter'] - totals['Lån & skulder']

  return (
    <div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-xs text-gray-500 mb-1">Tillgångar</div>
          <div className="text-lg font-semibold text-green-600">
            {(totals['Aktier & fonder'] + totals['Bankkonton'] + totals['Fastigheter']).toLocaleString('sv-SE')} kr
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-xs text-gray-500 mb-1">Skulder</div>
          <div className="text-lg font-semibold text-red-500">
            {totals['Lån & skulder'].toLocaleString('sv-SE')} kr
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-xs text-gray-500 mb-1">Nettovärde</div>
          <div className={`text-lg font-semibold ${netValue >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {netValue.toLocaleString('sv-SE')} kr
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Lägg till tillgång</h3>
        <div className="flex gap-3">
          <input className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Namn" value={name} onChange={e => setName(e.target.value)} />
          <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm" value={category} onChange={e => setCategory(e.target.value)}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <input className="w-32 border border-gray-200 rounded-lg px-3 py-2 text-sm text-right" placeholder="Värde" type="number" value={value} onChange={e => setValue(e.target.value)} />
          <button onClick={add} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">Lägg till</button>
        </div>
      </div>

      {CATEGORIES.map(cat => {
        const catAssets = assets.filter(a => a.category === cat)
        if (!catAssets.length) return null
        return (
          <div key={cat} className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
            <div className="flex justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700">{cat}</h3>
              <span className="text-sm font-semibold text-gray-900">{totals[cat].toLocaleString('sv-SE')} kr</span>
            </div>
            {catAssets.map(a => (
              <div key={a.id} className="flex items-center justify-between py-2 border-t border-gray-100">
                <span className="text-sm text-gray-700">{a.name}</span>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">{a.value.toLocaleString('sv-SE')} kr</span>
                  <button onClick={() => remove(a.id)} className="text-red-400 text-xs hover:text-red-600">Ta bort</button>
                </div>
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}