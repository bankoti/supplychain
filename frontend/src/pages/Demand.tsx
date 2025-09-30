import type { ChangeEvent, FormEvent, JSX } from "react"
import { useMemo, useState } from "react"
import { useMutation } from "@tanstack/react-query"
import {
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { runForecast } from "../lib/api"

type ForecastMethodOption = "naive" | "ets" | "croston" | "arima"

const defaultSeries = [
  120, 130, 125, 140, 150, 145, 160, 170, 165, 175, 180, 185,
]

export function DemandPage(): JSX.Element {
  const [seriesInput, setSeriesInput] = useState<string>(defaultSeries.join(", "))
  const [method, setMethod] = useState<ForecastMethodOption>("naive")
  const [horizon, setHorizon] = useState<number>(4)
  const [error, setError] = useState<string>("")

  const mutation = useMutation({
    mutationFn: runForecast,
  })

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    const parsed = seriesInput
      .split(",")
      .map((value) => Number.parseFloat(value.trim()))
      .filter((value) => Number.isFinite(value))

    if (parsed.length <= horizon) {
      setError("Series must include more observations than the forecast horizon.")
      return
    }

    if (method === "arima" && parsed.length < 8) {
      setError("ARIMA needs at least 8 observations for a stable fit.")
      return
    }

    setError("")
    mutation.mutate({ method, series: parsed, horizon })
  }

  const chartData = useMemo(() => {
    if (!mutation.data) {
      return defaultSeries.map((value, index) => ({
        period: `T${index + 1}`,
        actual: value,
      }))
    }

    const { forecast } = mutation.data
    const base = seriesInput
      .split(",")
      .map((value) => Number.parseFloat(value.trim()))
      .filter((value) => Number.isFinite(value))

    const combined = [...base, ...forecast]

    return combined.map((value, index) => ({
      period: `T${index + 1}`,
      actual: index < base.length ? base[index] : null,
      forecast: index >= base.length ? value : null,
    }))
  }, [mutation.data, seriesInput])

  const modelSummaryEntries = useMemo(() => {
    if (!mutation.data) return []
    return Object.entries(mutation.data.model_summary ?? {})
  }, [mutation.data])

  return (
    <section>
      <h1 className="section-title">Demand Forecasting Sandbox</h1>
      <form className="form-grid" onSubmit={handleSubmit}>
        <div className="field" style={{ gridColumn: "1 / -1" }}>
          <label htmlFor="series">Demand History (comma-separated)</label>
          <textarea
            id="series"
            value={seriesInput}
            onChange={(event: ChangeEvent<HTMLTextAreaElement>) => {
              setSeriesInput(event.target.value)
            }}
            rows={3}
          />
        </div>
        <div className="field">
          <label htmlFor="method">Method</label>
          <select
            id="method"
            value={method}
            onChange={(event: ChangeEvent<HTMLSelectElement>) => {
              setMethod(event.target.value as ForecastMethodOption)
            }}
          >
            <option value="naive">Naive</option>
            <option value="ets">Exponential Smoothing</option>
            <option value="croston">Croston (intermittent)</option>
            <option value="arima">ARIMA (1,1,1)</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="horizon">Horizon</label>
          <input
            id="horizon"
            type="number"
            min={1}
            max={12}
            value={horizon}
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              setHorizon(Number.parseInt(event.target.value, 10))
            }}
          />
        </div>
        <button disabled={mutation.isPending} type="submit">
          {mutation.isPending ? "Running…" : "Run Forecast"}
        </button>
      </form>
      {error !== "" ? <p role="alert">{error}</p> : null}
      {mutation.data ? (
        <>
          <div className="card" style={{ marginTop: "1.5rem" }}>
            <h2 className="card-label">Accuracy Metrics</h2>
            <p>MAPE: {mutation.data.metrics.mape.toFixed(2)}%</p>
            <p>MASE: {mutation.data.metrics.mase.toFixed(2)}</p>
            <p>Bias: {mutation.data.metrics.bias.toFixed(2)}</p>
          </div>
          {modelSummaryEntries.length > 0 ? (
            <div className="card" style={{ marginTop: "1rem" }}>
              <h2 className="card-label">Model Summary</h2>
              <ul>
                {modelSummaryEntries.map(([key, value]) => (
                  <li key={key}>
                    <strong>{key}:</strong> {typeof value === "number" ? value.toFixed(4) : String(value)}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      ) : null}
      <div style={{ height: 320 }}>
        <ResponsiveContainer>
          <LineChart data={chartData}>
            <XAxis dataKey="period" stroke="#cbd5f5" />
            <YAxis stroke="#cbd5f5" />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="actual" stroke="#38bdf8" dot={false} />
            <Line type="monotone" dataKey="forecast" stroke="#f97316" strokeDasharray="4 4" dot />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}