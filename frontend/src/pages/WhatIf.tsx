import type { ChangeEvent, JSX } from 'react'
import { useMemo, useState } from 'react'

function zScore(serviceLevel: number): number {
  // Approximation to avoid bringing an extra dependency client-side.
  const a1 = -39.6968302866538
  const a2 = 220.946098424521
  const a3 = -275.928510446969
  const a4 = 138.357751867269
  const a5 = -30.6647980661472
  const a6 = 2.50662827745924

  const b1 = -54.4760987982241
  const b2 = 161.585836858041
  const b3 = -155.698979859887
  const b4 = 66.8013118877197
  const b5 = -13.2806815528857

  const c1 = -7.78489400243029e-03
  const c2 = -0.322396458041136
  const c3 = -2.40075827716184
  const c4 = -2.54973253934373
  const c5 = 4.37466414146497
  const c6 = 2.93816398269878

  const d1 = 7.78469570904146e-03
  const d2 = 0.32246712907004
  const d3 = 2.445134137143
  const d4 = 3.75440866190742

  const pLow = 0.02425
  const pHigh = 1 - pLow
  let q: number
  let r: number

  if (serviceLevel < pLow) {
    q = Math.sqrt(-2 * Math.log(serviceLevel))
    return (
      (((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) /
        ((((d1 * q + d2) * q + d3) * q + d4) * q + 1)
    )
  }

  if (serviceLevel > pHigh) {
    q = Math.sqrt(-2 * Math.log(1 - serviceLevel))
    return -(
      (((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) /
        ((((d1 * q + d2) * q + d3) * q + d4) * q + 1)
    )
  }

  q = serviceLevel - 0.5
  r = q * q

  return (
    (((((a1 * r + a2) * r + a3) * r + a4) * r + a5) * r + a6) * q /
      (((((b1 * r + b2) * r + b3) * r + b4) * r + b5) * r + 1)
  )
}

export function WhatIfPage(): JSX.Element {
  const [serviceLevel, setServiceLevel] = useState<number>(0.95)
  const [demandRate, setDemandRate] = useState<number>(400)
  const [demandStd, setDemandStd] = useState<number>(35)
  const [leadTime, setLeadTime] = useState<number>(2)

  const scenario = useMemo(() => {
    const z = zScore(serviceLevel)
    const safetyStock = z * demandStd * Math.sqrt(leadTime)
    const reorderPoint = demandRate * leadTime + safetyStock
    const cycleServiceLevel = serviceLevel
    const fillRate = Math.min(0.999, cycleServiceLevel - 0.01 + 0.05 * (demandStd / Math.max(demandRate, 1)))

    return {
      z,
      safetyStock,
      reorderPoint,
      cycleServiceLevel,
      fillRate,
    }
  }, [serviceLevel, demandRate, demandStd, leadTime])

  const toNumber = (value: string): number => Number.parseFloat(value) || 0

  return (
    <section>
      <h1 className="section-title">What-if Scenario Builder</h1>
      <p>
        Explore the sensitivity between demand variability, service level targets, and
        safety stock recommendations. Tweak the inputs to see how policy targets shift.
      </p>
      <div className="form-grid" style={{ marginTop: '1.5rem' }}>
        <div className="field">
          <label htmlFor="serviceLevel">Service Level</label>
          <input
            id="serviceLevel"
            type="number"
            min={0.5}
            max={0.999}
            step={0.01}
            value={serviceLevel.toString()}
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              setServiceLevel(Math.min(0.999, Math.max(0.5, toNumber(event.target.value))))
            }}
          />
        </div>
        <div className="field">
          <label htmlFor="demandRate">Demand Rate (units/week)</label>
          <input
            id="demandRate"
            type="number"
            min={1}
            value={demandRate.toString()}
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              setDemandRate(Math.max(1, toNumber(event.target.value)))
            }}
          />
        </div>
        <div className="field">
          <label htmlFor="demandStd">Demand Std Dev</label>
          <input
            id="demandStd"
            type="number"
            min={1}
            value={demandStd.toString()}
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              setDemandStd(Math.max(1, toNumber(event.target.value)))
            }}
          />
        </div>
        <div className="field">
          <label htmlFor="leadTime">Lead Time (weeks)</label>
          <input
            id="leadTime"
            type="number"
            min={0.5}
            step={0.5}
            value={leadTime.toString()}
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              setLeadTime(Math.max(0.5, toNumber(event.target.value)))
            }}
          />
        </div>
      </div>
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h2 className="card-label">Scenario Outputs</h2>
        <table className="table">
          <tbody>
            <tr>
              <th>Z-score</th>
              <td>{scenario.z.toFixed(2)}</td>
            </tr>
            <tr>
              <th>Safety Stock</th>
              <td>{scenario.safetyStock.toFixed(1)} units</td>
            </tr>
            <tr>
              <th>Reorder Point</th>
              <td>{scenario.reorderPoint.toFixed(1)} units</td>
            </tr>
            <tr>
              <th>Cycle Service Level</th>
              <td>{(scenario.cycleServiceLevel * 100).toFixed(1)}%</td>
            </tr>
            <tr>
              <th>Estimated Fill Rate</th>
              <td>{(scenario.fillRate * 100).toFixed(1)}%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  )
}