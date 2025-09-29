import type { ChangeEvent, FormEvent, JSX } from 'react'
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'

import { requestBullwhipDiagnostics } from '../lib/api'

const defaultDemand = '100, 110, 120, 115, 130'
const defaultOrders = '105, 120, 135, 125, 140'

export function BullwhipPage(): JSX.Element {
  const [demand, setDemand] = useState<string>(defaultDemand)
  const [orders, setOrders] = useState<string>(defaultOrders)
  const [error, setError] = useState<string>('')

  const mutation = useMutation({
    mutationFn: requestBullwhipDiagnostics,
  })

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    const demandSeries = demand
      .split(',')
      .map((value) => Number.parseFloat(value.trim()))
      .filter((value) => Number.isFinite(value))

    const orderSeries = orders
      .split(',')
      .map((value) => Number.parseFloat(value.trim()))
      .filter((value) => Number.isFinite(value))

    if (demandSeries.length !== orderSeries.length || demandSeries.length < 2) {
      setError('Demand and orders must contain the same number of values (>= 2).')
      return
    }

    setError('')
    mutation.mutate({ demand: demandSeries, orders: orderSeries })
  }

  return (
    <section>
      <h1 className="section-title">Bullwhip Diagnostics</h1>
      <form className="form-grid" onSubmit={handleSubmit}>
        <div className="field" style={{ gridColumn: '1 / -1' }}>
          <label htmlFor="demand">Demand Series</label>
          <textarea
            id="demand"
            value={demand}
            rows={2}
            onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setDemand(event.target.value)}
          />
        </div>
        <div className="field" style={{ gridColumn: '1 / -1' }}>
          <label htmlFor="orders">Order Series</label>
          <textarea
            id="orders"
            value={orders}
            rows={2}
            onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setOrders(event.target.value)}
          />
        </div>
        <button disabled={mutation.isPending} type="submit">
          {mutation.isPending ? 'Evaluating…' : 'Run Diagnostics'}
        </button>
      </form>
      {error !== '' ? <p role="alert">{error}</p> : null}
      {mutation.data ? (
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <h2 className="card-label">Amplification Index</h2>
          <p className="card-value">{mutation.data.amplification_index.toFixed(2)}</p>
          <p>Demand variance: {mutation.data.demand_variance.toFixed(2)}</p>
          <p>Order variance: {mutation.data.order_variance.toFixed(2)}</p>
        </div>
      ) : null}
    </section>
  )
}