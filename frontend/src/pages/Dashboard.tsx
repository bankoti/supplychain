import type { JSX } from 'react'
import { useQuery } from '@tanstack/react-query'

import { fetchKpiSummary } from '../lib/api'

export function DashboardPage(): JSX.Element {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['kpi-summary'],
    queryFn: fetchKpiSummary,
  })

  if (isLoading) {
    return <p>Loading KPI summary.</p>
  }

  if (isError || data === undefined) {
    return <p>Unable to load KPI summary. Start the API and try again.</p>
  }

  const entries = [
    { label: 'Customer Service Level', value: `${(data.customer_service_level * 100).toFixed(1)}%` },
    { label: 'Fill Rate', value: `${(data.fill_rate * 100).toFixed(1)}%` },
    { label: 'Inventory Turns', value: data.inventory_turns.toFixed(2) },
    { label: 'Holding Cost', value: `$${data.holding_cost.toFixed(2)}` },
  ]

  return (
    <section>
      <h1 className="section-title">Supply Chain Pulse</h1>
      <div className="card-grid">
        {entries.map((item) => (
          <article key={item.label} className="card">
            <p className="card-label">{item.label}</p>
            <p className="card-value">{item.value}</p>
          </article>
        ))}
      </div>
    </section>
  )
}