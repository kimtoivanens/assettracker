import { useEffect, useState } from 'react'
import { getSnapshots, getAssets, createSnapshot } from '../api/assets'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

type Snapshot = { id: number; month: string; netValue: number; stocks: number; bank: number; property: number; loans: number }
type Asset = { id: number; name: string; category: string; value: number }

const CATS = ['Aktier & fonder', 'Bankkonton', 'Fastigheter', 'Lån & skulder']
const COLORS = { 'Aktier & fonder': '#185FA5', 'Bankkonton': '#0F6E56', 'Fastigheter': '#BA7517', 'Lån & skulder': '#A32D2D' }

function fmt(n: number) { return Math.round(n).toLocaleString('sv-SE') + ' kr' }
function fmtP(n: number) { return (n >= 0 ? '+' : '') + n.toFixed(1) + '%' }

export default function Trends() {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [tab, setTab] = useState<'overview' | 'trends' | 'forecast'>('overview')
  const [stockRet, setStockRet] = useState(7)
  const [propGrowth, setPropGrowth] = useState(3)
  const [bankRet, setBankRet] = useState(2)
  const [monthlySave, setMonthlySave] = useState(5000)
  const [salaryGrowth, setSalaryGrowth] = useState(3)
  const [years, setYears] = useState(10)
  const [inflation, setInflation] = useState(2)

  useEffect(() => {
    getSnapshots().then(data => setSnapshots([...data].sort((a, b) => a.month.localeCompare(b.month))))
    getAssets().then(setAssets)
  }, [])

  const sum = (cat: string) => assets.filter(a => a.category === cat).reduce((s, a) => s + a.value, 0)
  const netValue = sum('Aktier & fonder') + sum('Bankkonton') + sum('Fastigheter') - sum('Lån & skulder')

  const saveSnapshot = async () => {
    const now = new Date()
    const month = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0')
    const snap = await createSnapshot({
      month, netValue,
      stocks: sum('Aktier & fonder'),
      bank: sum('Bankkonton'),
      property: sum('Fastigheter'),
      loans: sum('Lån & skulder')
    })
    setSnapshots(prev => {
      const filtered = prev.filter(s => s.month !== month)
      return [...filtered, snap].sort((a, b) => a.month.localeCompare(b.month))
    })
    alert('Snapshot sparad för ' + month + '!')
  }

  const prev1m = snapshots[snapshots.length - 2]
  const prev1y = snapshots[snapshots.length - 13]
  const first = snapshots[0]

  function delta(from?: Snapshot) {
    if (!from) return null
    const diff = netValue - from.netValue
    const pct = (diff / from.netValue) * 100
    return { diff, pct }
  }

  const monthlyChanges = snapshots.slice(1).map((s, i) => ({
    month: s.month,
    change: s.netValue - snapshots[i].netValue
  }))

  function simulate(sr: number, pg: number, br: number, save: number, sg: number, yrs: number) {
    let s = sum('Aktier & fonder') || 0
    let b = sum('Bankkonton') || 0
    let p = sum('Fastigheter') || 0
    const l = sum('Lån & skulder') || 0
    let monthlySavings = save
    const pts = [{ year: 'Nu', net: Math.round(s + b + p - l) }]
    for (let i = 1; i <= yrs; i++) {
      s *= (1 + sr / 100)
      b = b * (1 + br / 100) + monthlySavings * 12
      p *= (1 + pg / 100)
      monthlySavings *= (1 + sg / 100)
      pts.push({ year: `År ${i}`, net: Math.round(s + b + p - l) })
    }
    return pts
  }

  const baseData = simulate(stockRet, propGrowth, bankRet, monthlySave, salaryGrowth, years)
  const pessData = simulate(stockRet * 0.5, propGrowth * 0.5, bankRet * 0.5, monthlySave * 0.7, salaryGrowth * 0.5, years)
  const optData = simulate(stockRet * 1.5, propGrowth * 1.5, bankRet * 1.3, monthlySave * 1.3, salaryGrowth * 1.5, years)
  const realData = baseData.map((d, i) => ({ ...d, net: Math.round(d.net / Math.pow(1 + inflation / 100, i)) }))

  const chartData = baseData.map((d, i) => ({
    year: d.year,
    Basscenarion: d.net,
    Pessimistiskt: pessData[i].net,
    Optimistiskt: optData[i].net,
    Realt: realData[i].net,
  }))

  const assumptions = [
    {
      label: 'Pessimistiskt', color: '#FCEBEB', text: '#A32D2D',
      val: pessData[pessData.length - 1].net,
      items: [
        `Aktier: ${(stockRet * 0.5).toFixed(1)}% /år`,
        `Fastighet: ${(propGrowth * 0.5).toFixed(1)}% /år`,
        `Bank: ${(bankRet * 0.5).toFixed(1)}% /år`,
        `Sparande: ${Math.round(monthlySave * 0.7).toLocaleString('sv-SE')} kr/mån`,
        `Löneutveckling: ${(salaryGrowth * 0.5).toFixed(1)}% /år`,
        `Lån: oförändrat`,
      ]
    },
    {
      label: 'Basscenarion', color: '#E6F1FB', text: '#185FA5',
      val: baseData[baseData.length - 1].net,
      items: [
        `Aktier: ${stockRet}% /år`,
        `Fastighet: ${propGrowth}% /år`,
        `Bank: ${bankRet}% /år`,
        `Sparande: ${monthlySave.toLocaleString('sv-SE')} kr/mån`,
        `Löneutveckling: ${salaryGrowth}% /år`,
        `Lån: oförändrat`,
      ]
    },
    {
      label: 'Optimistiskt', color: '#E1F5EE', text: '#0F6E56',
      val: optData[optData.length - 1].net,
      items: [
        `Aktier: ${(stockRet * 1.5).toFixed(1)}% /år`,
        `Fastighet: ${(propGrowth * 1.5).toFixed(1)}% /år`,
        `Bank: ${(bankRet * 1.3).toFixed(1)}% /år`,
        `Sparande: ${Math.round(monthlySave * 1.3).toLocaleString('sv-SE')} kr/mån`,
        `Löneutveckling: ${(salaryGrowth * 1.5).toFixed(1)}% /år`,
        `Lån: oförändrat`,
      ]
    },
  ]

  const tabs = ['overview', 'trends', 'forecast'] as const
  const tabLabels = ['Översikt', 'Trender', 'Prognos']

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

      {tab === 'overview' && (
        <div>
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="text-xs text-gray-500 mb-1">Nettovärde</div>
              <div className={`text-lg font-semibold ${netValue >= 0 ? 'text-green-600' : 'text-red-500'}`}>{fmt(netValue)}</div>
            </div>
            {[{ label: '1 mån', d: delta(prev1m) }, { label: '1 år', d: delta(prev1y) }, { label: 'Totalt', d: delta(first) }].map(({ label, d }) => (
              <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="text-xs text-gray-500 mb-1">Förändring {label}</div>
                {d ? <>
                  <div className={`text-lg font-semibold ${d.diff >= 0 ? 'text-green-600' : 'text-red-500'}`}>{fmtP(d.pct)}</div>
                  <div className={`text-xs mt-1 ${d.diff >= 0 ? 'text-green-600' : 'text-red-500'}`}>{d.diff >= 0 ? '+' : ''}{fmt(d.diff)}</div>
                </> : <div className="text-lg font-semibold text-gray-300">–</div>}
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-medium text-gray-700">Nettovärde över tid</h3>
              <button onClick={saveSnapshot} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg">Spara snapshot</button>
            </div>
            {snapshots.length < 2 ? (
              <p className="text-sm text-gray-400">Spara minst två snapshots för att se grafen.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={snapshots.map(s => ({ month: s.month, Nettovärde: s.netValue }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => (v / 1000000).toFixed(1) + 'M'} />
                  <Tooltip formatter={(v: any) => fmt(v)} />
                  <Line type="monotone" dataKey="Nettovärde" stroke="#185FA5" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="grid grid-cols-4 gap-4">
            {CATS.map(cat => (
              <div key={cat} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="w-3 h-3 rounded-full mb-2" style={{ background: COLORS[cat as keyof typeof COLORS] }} />
                <div className="text-xs text-gray-500 mb-1">{cat}</div>
                <div className="text-sm font-semibold">{fmt(sum(cat))}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'trends' && (
        <div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Månadsförändring</h3>
            {monthlyChanges.length < 1 ? (
              <p className="text-sm text-gray-400">Behöver minst två snapshots.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={monthlyChanges}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => (v / 1000).toFixed(0) + 'k'} />
                  <Tooltip formatter={(v: any) => fmt(v)} />
                  <Bar dataKey="change" fill="#185FA5" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Historiska snapshots</h3>
            {snapshots.length === 0 && <p className="text-sm text-gray-400">Inga snapshots ännu.</p>}
            {[...snapshots].reverse().map(s => (
              <div key={s.id} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                <span className="text-sm text-gray-700">{s.month}</span>
                <span className="text-sm font-medium">{fmt(s.netValue)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'forecast' && (
        <div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Justera basscenariot</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Aktier avkastning/år', val: stockRet, set: setStockRet, min: 0, max: 20, step: 0.5, unit: '%' },
                { label: 'Fastighetsökning/år', val: propGrowth, set: setPropGrowth, min: -5, max: 15, step: 0.5, unit: '%' },
                { label: 'Bankränta/år', val: bankRet, set: setBankRet, min: 0, max: 10, step: 0.5, unit: '%' },
                { label: 'Månatligt sparande', val: monthlySave, set: setMonthlySave, min: 0, max: 50000, step: 500, unit: ' kr' },
                { label: 'Löneutveckling/år', val: salaryGrowth, set: setSalaryGrowth, min: 0, max: 10, step: 0.5, unit: '%' },
                { label: 'Tidshorisont', val: years, set: setYears, min: 1, max: 30, step: 1, unit: ' år' },
                { label: 'Inflation', val: inflation, set: setInflation, min: 0, max: 10, step: 0.5, unit: '%' },
              ].map(({ label, val, set, min, max, step, unit }) => (
                <div key={label}>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{label}</span>
                    <span className="font-medium text-gray-900">{val > 100 ? val.toLocaleString('sv-SE') : val}{unit}</span>
                  </div>
                  <input type="range" min={min} max={max} step={step} value={val}
                    onChange={e => set(parseFloat(e.target.value))} className="w-full" />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Prognos {years} år</h3>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => (v / 1000000).toFixed(1) + 'M'} />
                <Tooltip formatter={(v: any) => fmt(v)} />
                <Line type="monotone" dataKey="Pessimistiskt" stroke="#A32D2D" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
                <Line type="monotone" dataKey="Basscenarion" stroke="#185FA5" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Optimistiskt" stroke="#0F6E56" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
                <Line type="monotone" dataKey="Realt" stroke="#BA7517" strokeWidth={1.5} strokeDasharray="2 4" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            {assumptions.map(s => (
              <div key={s.label} className="rounded-xl p-4 border border-gray-100" style={{ background: s.color }}>
                <div className="text-xs font-medium mb-2" style={{ color: s.text }}>{s.label}</div>
                <div className="text-lg font-semibold mb-1" style={{ color: s.text }}>{fmt(s.val)}</div>
                <div className="text-xs font-medium mb-2" style={{ color: s.text }}>{fmtP((s.val - netValue) / (netValue || 1) * 100)}</div>
                <div className="border-t pt-2" style={{ borderColor: s.text + '33' }}>
                  {s.items.map(item => (
                    <div key={item} className="text-xs mt-1" style={{ color: s.text }}>{item}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-xs text-gray-500 mb-1">Realt värde basscenarion (inflationsjusterat med {inflation}%)</div>
            <div className="text-sm font-semibold text-amber-600">{fmt(realData[realData.length - 1].net)}</div>
          </div>
        </div>
      )}
    </div>
  )
}
