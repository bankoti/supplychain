import type { ChangeEvent, FormEvent, JSX } from "react"
import { useMemo, useState } from "react"
import { useMutation } from "@tanstack/react-query"

import { simulateInventory } from "../lib/api"

function zScore(serviceLevel: number): number {
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

const defaultDemandProfile = "40, 60, 80, 100"

export function WhatIfPage(): JSX.Element {
  const [serviceLevel, setServiceLevel] = useState<number>(0.95)
  const [demandRate, setDemandRate] = useState<number>(400)
  const [demandStd, setDemandStd] = useState<number>(35)
  const [leadTime, setLeadTime] = useState<number>(2)

  const [demandProfileInput, setDemandProfileInput] = useState<string>(
    defaultDemandProfile,
  )
  const [initialInventory, setInitialInventory] = useState<string>("120")
  const [reorderPoint, setReorderPoint] = useState<string>("60")
  const [orderQuantity, setOrderQuantity] = useState<string>("100")
  const [simulationLeadTime, setSimulationLeadTime] = useState<string>("2")
  const [seed, setSeed] = useState<string>("42")
  const [simulationError, setSimulationError] = useState<string>("")
  const [lastDemandProfile, setLastDemandProfile] = useState<number[]>([])

  const simulationMutation = useMutation({
    mutationFn: simulateInventory,
  })

  const scenario = useMemo(() => {
    const z = zScore(serviceLevel)
    const safetyStock = z * demandStd * Math.sqrt(leadTime)
    const reorderPointCalc = demandRate * leadTime + safetyStock
    const cycleServiceLevel = serviceLevel
    const fillRate = Math.min(
      0.999,
      cycleServiceLevel - 0.01 + 0.05 * (demandStd / Math.max(demandRate, 1)),
    )

    return {
      z,
      safetyStock,
      reorderPoint: reorderPointCalc,
      cycleServiceLevel,
      fillRate,
    }
  }, [serviceLevel, demandRate, demandStd, leadTime])

  const toNumber = (value: string): number => Number.parseFloat(value) || 0

  const handleSimulate = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    const demandValues = demandProfileInput
      .split(",")
      .map((value) => Number.parseFloat(value.trim()))
      .filter((value) => Number.isFinite(value) && value >= 0)

    if (demandValues.length === 0) {
      setSimulationError("Provide at least one demand value.")
      return
    }

    const inv = toNumber(initialInventory)
    const reorder = toNumber(reorderPoint)
    const orderQty = toNumber(orderQuantity)
    const lt = Number.parseInt(simulationLeadTime, 10)
    const parsedSeed = seed.trim() === "" ? undefined : Number.parseInt(seed, 10)

    if (orderQty <= 0) {
      setSimulationError("Order quantity must be greater than zero.")
      return
    }

    if (!Number.isFinite(inv) || !Number.isFinite(reorder) || Number.isNaN(lt)) {
      setSimulationError("Check inventory, reorder point, and lead time inputs.")
      return
    }

    setLastDemandProfile(demandValues)
    setSimulationError("")
    simulationMutation.mutate({
      demand_profile: demandValues,
      initial_inventory: inv,
      reorder_point: reorder,
      order_quantity: orderQty,
      lead_time: lt,
      seed: parsedSeed,
    })
  }

  const totalDemand = useMemo(
    () => lastDemandProfile.reduce((acc, value) => acc + value, 0),
    [lastDemandProfile],
  )
  const simulationResult = simulationMutation.data
  const achievedServiceLevel = simulationResult
    ? simulationResult.demand_served /
      Math.max(simulationResult.demand_served + simulationResult.demand_lost, 1)
    : undefined

  return (
    <section>
      <h1 className="section-title">What-if Laboratory</h1>
      <p>
        Use analytical heuristics to size safety stock, then stress-test the policy with a
        discrete-event simulation.
      </p>

      <div className="card" style={{ marginTop: "1.5rem" }}>
        <h2 className="card-label">Analytical Safety Stock</h2>
        <div className="form-grid" style={{ marginBottom: "1rem" }}>
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
                setServiceLevel(
                  Math.min(0.999, Math.max(0.5, toNumber(event.target.value))),
                )
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

      <div className="card" style={{ marginTop: "1.5rem" }}>
        <h2 className="card-label">Discrete-Event Simulation</h2>
        <form className="form-grid" onSubmit={handleSimulate}>
          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <label htmlFor="demandProfile">Demand Profile (comma-separated)</label>
            <textarea
              id="demandProfile"
              rows={2}
              value={demandProfileInput}
              onChange={(event: ChangeEvent<HTMLTextAreaElement>) => {
                setDemandProfileInput(event.target.value)
              }}
            />
          </div>
          <div className="field">
            <label htmlFor="initialInventory">Initial Inventory</label>
            <input
              id="initialInventory"
              type="number"
              value={initialInventory}
              onChange={(event: ChangeEvent<HTMLInputElement>) => {
                setInitialInventory(event.target.value)
              }}
            />
          </div>
          <div className="field">
            <label htmlFor="reorderPoint">Reorder Point</label>
            <input
              id="reorderPoint"
              type="number"
              value={reorderPoint}
              onChange={(event: ChangeEvent<HTMLInputElement>) => {
                setReorderPoint(event.target.value)
              }}
            />
          </div>
          <div className="field">
            <label htmlFor="orderQuantity">Order Quantity</label>
            <input
              id="orderQuantity"
              type="number"
              value={orderQuantity}
              onChange={(event: ChangeEvent<HTMLInputElement>) => {
                setOrderQuantity(event.target.value)
              }}
            />
          </div>
          <div className="field">
            <label htmlFor="simulationLeadTime">Lead Time (periods)</label>
            <input
              id="simulationLeadTime"
              type="number"
              min={0}
              value={simulationLeadTime}
              onChange={(event: ChangeEvent<HTMLInputElement>) => {
                setSimulationLeadTime(event.target.value)
              }}
            />
          </div>
          <div className="field">
            <label htmlFor="seed">Random Seed (optional)</label>
            <input
              id="seed"
              type="number"
              value={seed}
              onChange={(event: ChangeEvent<HTMLInputElement>) => {
                setSeed(event.target.value)
              }}
            />
          </div>
          <button disabled={simulationMutation.isPending} type="submit">
            {simulationMutation.isPending ? "Simulating…" : "Run Simulation"}
          </button>
        </form>
        {simulationError !== "" ? <p role="alert">{simulationError}</p> : null}
        {simulationMutation.isError ? (
          <p role="alert">Simulation failed. Check the API logs.</p>
        ) : null}
        {simulationResult ? (
          <div style={{ marginTop: "1rem" }}>
            <h3 className="card-label">Simulation Results</h3>
            <p>
              Demand served: {simulationResult.demand_served.toFixed(1)} units
              {totalDemand > 0
                ? ` of ${totalDemand.toFixed(1)} (${(
                    (simulationResult.demand_served / totalDemand) * 100
                  ).toFixed(1)}% of demand)`
                : ""}
            </p>
            <p>
              Demand lost: {simulationResult.demand_lost.toFixed(1)} units
              {achievedServiceLevel !== undefined
                ? ` | Service level: ${(achievedServiceLevel * 100).toFixed(1)}%`
                : ""}
            </p>
            {simulationResult.stockouts.length > 0 ? (
              <table className="table" style={{ marginTop: "1rem" }}>
                <thead>
                  <tr>
                    <th>Period</th>
                    <th>Shortfall</th>
                  </tr>
                </thead>
                <tbody>
                  {simulationResult.stockouts.map((event) => (
                    <tr key={event.time}>
                      <td>{event.time}</td>
                      <td>{event.shortfall.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ marginTop: "1rem" }}>No stockouts recorded for this run.</p>
            )}
          </div>
        ) : null}
      </div>
    </section>
  )
}