import type { ChangeEvent, FormEvent, JSX } from 'react'
import { useMemo, useState } from 'react'
import { useMutation } from '@tanstack/react-query'

import { requestInventoryPolicy } from '../lib/api'

interface FormState {
  annualDemand: string
  orderingCost: string
  holdingCost: string
  demandRate: string
  demandStd: string
  leadTime: string
  serviceLevel: string
  underageCost: string
  overageCost: string
}

const initialState: FormState = {
  annualDemand: '12000',
  orderingCost: '150',
  holdingCost: '3',
  demandRate: '400',
  demandStd: '35',
  leadTime: '2',
  serviceLevel: '0.95',
  underageCost: '10',
  overageCost: '2',
}

export function InventoryPage(): JSX.Element {
  const [method, setMethod] = useState<'eoq' | 'qr' | 'newsvendor'>('eoq')
  const [state, setState] = useState<FormState>(initialState)

  const mutation = useMutation({
    mutationFn: requestInventoryPolicy,
  })

  const update = (event: ChangeEvent<HTMLInputElement>) => {
    const { id, value } = event.target
    setState((prev) => ({ ...prev, [id]: value }))
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    const payload = {
      method,
      annual_demand: Number.parseFloat(state.annualDemand) || undefined,
      ordering_cost: Number.parseFloat(state.orderingCost) || undefined,
      holding_cost: Number.parseFloat(state.holdingCost) || undefined,
      demand_rate: Number.parseFloat(state.demandRate) || undefined,
      demand_std: Number.parseFloat(state.demandStd) || undefined,
      lead_time: Number.parseFloat(state.leadTime) || undefined,
      service_level: Number.parseFloat(state.serviceLevel) || undefined,
      underage_cost: Number.parseFloat(state.underageCost) || undefined,
      overage_cost: Number.parseFloat(state.overageCost) || undefined,
    }
    mutation.mutate(payload)
  }

  const fields = useMemo((): JSX.Element => {
    if (method === 'eoq') {
      return (
        <>
          <div className="field">
            <label htmlFor="annualDemand">Annual Demand</label>
            <input id="annualDemand" value={state.annualDemand} onChange={update} />
          </div>
          <div className="field">
            <label htmlFor="orderingCost">Ordering Cost</label>
            <input id="orderingCost" value={state.orderingCost} onChange={update} />
          </div>
          <div className="field">
            <label htmlFor="holdingCost">Holding Cost</label>
            <input id="holdingCost" value={state.holdingCost} onChange={update} />
          </div>
        </>
      )
    }

    if (method === 'qr') {
      return (
        <>
          <div className="field">
            <label htmlFor="demandRate">Demand Rate (units/week)</label>
            <input id="demandRate" value={state.demandRate} onChange={update} />
          </div>
          <div className="field">
            <label htmlFor="demandStd">Demand Std Dev</label>
            <input id="demandStd" value={state.demandStd} onChange={update} />
          </div>
          <div className="field">
            <label htmlFor="leadTime">Lead Time (weeks)</label>
            <input id="leadTime" value={state.leadTime} onChange={update} />
          </div>
          <div className="field">
            <label htmlFor="serviceLevel">Service Level Target</label>
            <input id="serviceLevel" value={state.serviceLevel} onChange={update} />
          </div>
        </>
      )
    }

    return (
      <>
        <div className="field">
          <label htmlFor="demandRate">Demand Mean</label>
          <input id="demandRate" value={state.demandRate} onChange={update} />
        </div>
        <div className="field">
          <label htmlFor="demandStd">Demand Std Dev</label>
          <input id="demandStd" value={state.demandStd} onChange={update} />
        </div>
        <div className="field">
          <label htmlFor="underageCost">Underage Cost</label>
          <input id="underageCost" value={state.underageCost} onChange={update} />
        </div>
        <div className="field">
          <label htmlFor="overageCost">Overage Cost</label>
          <input id="overageCost" value={state.overageCost} onChange={update} />
        </div>
      </>
    )
  }, [method, state])

  return (
    <section>
      <h1 className="section-title">Inventory Policy Advisor</h1>
      <form className="form-grid" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="method">Method</label>
          <select
            id="method"
            value={method}
            onChange={(event: ChangeEvent<HTMLSelectElement>) => {
              setMethod(event.target.value as typeof method)
            }}
          >
            <option value="eoq">EOQ</option>
            <option value="qr">(Q,R)</option>
            <option value="newsvendor">Newsvendor</option>
          </select>
        </div>
        {fields}
        <button disabled={mutation.isPending} type="submit">
          {mutation.isPending ? 'Calculating…' : 'Compute Policy'}
        </button>
      </form>
      {mutation.data ? (
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <h2 className="card-label">Recommended Parameters</h2>
          <ul>
            {Object.entries(mutation.data.policy).map(([key, value]) => (
              <li key={key}>
                <strong>{key}:</strong> {value.toFixed(2)}
              </li>
            ))}
          </ul>
          <p style={{ marginTop: '0.75rem', color: '#94a3b8' }}>{mutation.data.notes}</p>
        </div>
      ) : null}
    </section>
  )
}