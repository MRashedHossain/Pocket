import { useEffect, useState } from 'react'
import api from '../api/client'

function StatCard({ label, value, sub }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7))

  useEffect(() => {
    api.get(`/dashboard?month=${month}`).then(r => setData(r.data))
  }, [month])

  const fmt = n => `৳${(n ?? 0).toLocaleString()}`

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <input
          type="month" value={month}
          onChange={e => setMonth(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
        />
      </div>

      {data ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label="Balance" value={fmt(data.balance)} />
            <StatCard label="Income" value={fmt(data.monthIncome)} sub={`${data.incomeCount} entries`} />
            <StatCard label="Expenses" value={fmt(data.monthExpense)} sub={`${data.expenseCount} entries`} />
            <StatCard label="Net" value={fmt(data.monthNet)} sub={`${data.savingsRatePct}% saved`} />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h2 className="text-sm font-semibold mb-3">Expenses by category</h2>
              {data.expenseByCategory.length === 0 ? (
                <p className="text-sm text-gray-400">No expenses this month</p>
              ) : (
                data.expenseByCategory.map(r => (
                  <div key={r.category} className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-700">{r.category}</span>
                    <span className="text-sm font-medium">{fmt(r.amount)} <span className="text-gray-400">({r.pct}%)</span></span>
                  </div>
                ))
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h2 className="text-sm font-semibold mb-3">Debts</h2>
              <div className="space-y-2">
                <div className="flex justify-between text-sm"><span className="text-gray-500">Lent out</span><span>{fmt(data.debts.lent)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Borrowed</span><span>{fmt(data.debts.borrowed)}</span></div>
                <div className="flex justify-between text-sm font-semibold border-t pt-2 mt-2">
                  <span>Net</span><span className={data.debts.net >= 0 ? 'text-green-600' : 'text-red-600'}>{fmt(data.debts.net)}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <p className="text-gray-400">Loading…</p>
      )}
    </div>
  )
}
