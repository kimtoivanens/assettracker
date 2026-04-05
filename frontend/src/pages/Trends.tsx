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
  const [tab, setTab] = useState<'overview' | 'trends' | 'forecast' | 'sim'>('overview')
  const [simRet, setSimRet] = useState(7)
  const [simSave, setSimSave] = useState(5000)
  const [simInt, setSimInt] = useState(3)
  const [simProp, setSimProp] = useState(2)
  const [simYears, setSimYears] = useState(10)
  const [simInf, setSimInf] = useState(2)

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

  function simulate(sr: number, save: number, lr: number, pg: number, yrs: number) {
    let s = sum('Aktier & fonder') || netValue * 0.4
    let b = sum('Bankkonton') || netValue * 0.2
    let p = sum('Fastigheter') || netValue * 0.5
    let l = sum('Lån & skulder') || 0
    const pts = [{ year: 'Nu', value: Math.round(s + b + p - l) }]
    for (let i = 1; i <= yrs; i++) {
      s *= (1 + sr / 100); b += save * 12; p *= (1 + pg / 100)
      l = Math.max(0, l * (1 + lr / 100) - save * 3)
      pts.push({ year: `År ${i}`, value: Math.round(s + b + p - l) })
    }
    return pts
  }

  const baseData = simulate(simRet, simSave, simInt, simProp, simYears)
  const pessData = simulate(simRet * 0.4, simSave * 0.7, simInt * 1.3, simProp * 0.3, simYears)
  const optData = simulate(simRet * 1.5, simSave * 1.3, simInt * 0.7, simProp * 2, simYears)
  const realData = baseData.map((d, i) => ({ ...d, value: Math.round(d.value / Math.pow(1 + simInf / 100, i)) }))

  const simChartData = baseData.map((d, i) => ({
    year: d.year,
    Basscenarion: d.value,
    Pessimistiskt: pessData[i].value,
    Optimistiskt: optData[i].value,
    Realt: realData[i].value,
  }))

  const forecastData = [0, 1, 2, 3, 4, 5].map(y => ({
    year: y === 0 ? 'Nu' : `${y} år`,
    'Pessimistiskt (4%)': Math.round(netValue * Math.pow(1.04, y)),
    'Bas (7%)': Math.round(netValue * Math.pow(1.07, y)),
    'Optimistiskt (10%)': Math.round(netValue * Math.pow(1.10, y)),
  }))

  const tabs = ['overview', 'trends', 'forecast', 'sim'] as const
  const tabLabels = ['Översikt', 'Trender', 'Prognos', 'Simulering']

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
            {[{label:'1 mån', d: delta(prev1m)}, {label:'1 år', d: delta(prev1y)}, {label:'Totalt', d: delta(first)}].map(({label, d}) => (
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
            <h3 className="text-sm font-medium text-gray-700 mb-3">Snapshots</h3>
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
            <h3 className="text-sm font-medium text-gray-700 mb-4">Prognos 5 år</h3>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={forecastData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => (v / 1000000).toFixed(1) + 'M'} />
                <Tooltip formatter={(v: any) => fmt(v)} />
                <Line type="monotone" dataKey="Pessimistiskt (4%)" stroke="#A32D2D" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
                <Line type="monotone" dataKey="Bas (7%)" stroke="#185FA5" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Optimistiskt (10%)" stroke="#0F6E56" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Pessimistiskt (4%)', val: forecastData[5]['Pessimistiskt (4%)'], color: '#FCEBEB', text: '#A32D2D' },
              { label: 'Basscenarion (7%)', val: forecastData[5]['Bas (7%)'], color: '#E6F1FB', text: '#185FA5' },
              { label: 'Optimistiskt (10%)', val: forecastData[5]['Optimistiskt (10%)'], color: '#E1F5EE', text: '#0F6E56' },
            ].map(s => (
              <div key={s.label} className="rounded-xl p-4 border border-gray-100" style={{ background: s.color }}>
                <div className="text-xs font-medium mb-1" style={{ color: s.text }}>{s.label}</div>
                <div className="text-lg font-semibold" style={{ color: s.text }}>{fmt(s.val)}</div>
                <div className="text-xs mt-1" style={{ color: s.text }}>{fmtP((s.val - netValue) / (netValue || 1) * 100)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'sim' && (
        <div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Parametrar</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Avkastning aktier/år', val: simRet, set: setSimRet, min: 0, max: 20, unit: '%' },
                { label: 'Månatligt sparande', val: simSave, set: setSimSave, min: 0, max: 50000, step: 500, unit: ' kr' },
                { label: 'Räntekostnad lån', val: simInt, set: setSimInt, min: 0, max: 10, step: 0.5, unit: '%' },
                { label: 'Fastighetsökning/år', val: simProp, set: setSimProp, min: -5, max: 15, unit: '%' },
                { label: 'Tidshorisont', val: simYears, set: setSimYears, min: 1, max: 30, unit: ' år' },
                { label: 'Inflation', val: simInf, set: setSimInf, min: 0, max: 10, step: 0.5, unit: '%' },
              ].map(({ label, val, set, min, max, step, unit }) => (
                <div key={label}>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{label}</span>
                    <span className="font-medium text-gray-900">{typeof val === 'number' && val > 100 ? val.toLocaleString('sv-SE') : val}{unit}</span>
                  </div>
                  <input type="range" min={min} max={max} step={step || 1} value={val}
                    onChange={e => set(parseFloat(e.target.value))}
                    className="w-full" />
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Simulerad utveckling</h3>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={simChartData}>
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
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Pessimistiskt', val: pessData[pessData.length - 1].value, color: 'text-red-500' },
              { label: 'Basscenarion', val: baseData[baseData.length - 1].value, color: 'text-green-600' },
              { label: 'Optimistiskt', val: optData[optData.length - 1].value, color: 'text-green-600' },
              { label: 'Realt', val: realData[realData.length - 1].value, color: 'text-amber-600' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="text-xs text-gray-500 mb-1">{s.label}</div>
                <div className={`text-sm font-semibold ${s.color}`}>{fmt(s.val)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
