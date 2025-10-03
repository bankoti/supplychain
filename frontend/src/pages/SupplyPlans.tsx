import { useEffect, useMemo, useState } from 'react'
import type { ChangeEvent, FormEvent, JSX } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createSupplyPlan,
  deleteSupplyPlan,
  fetchSupplyPlan,
  fetchSupplyPlans,
  updateSupplyPlan,
} from '../lib/api'
import type {
  SupplyPlanCreatePayload,
  SupplyPlanStatus,
  SupplyPlanUpdatePayload,
} from '../lib/types'

const statusOptions: Array<{ value: SupplyPlanStatus; label: string }> = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'archived', label: 'Archived' },
]

const inventoryPolicyOptions: Array<{ value: string; label: string }> = [
  { value: 'qr', label: 'Reorder point (Q,R)' },
  { value: 'eoq', label: 'Economic order quantity' },
  { value: 'newsvendor', label: 'Newsvendor' },
  { value: 'custom', label: 'Custom' },
]

type SupplyPlanFormState = {
  sku: string
  product_name: string
  planning_horizon_start: string
  planning_horizon_end: string
  lifecycle_stage: string
  review_cadence: string
  owner: string
  notes: string
  status: SupplyPlanStatus
}

const initialFormState: SupplyPlanFormState = {
  sku: '',
  product_name: '',
  planning_horizon_start: '',
  planning_horizon_end: '',
  lifecycle_stage: '',
  review_cadence: '',
  owner: '',
  notes: '',
  status: 'draft',
}

type SupplyNodeFormState = {
  node_id: string
  name: string
  policy_type: string
  reorder_point: string
  safety_stock: string
  order_quantity: string
  service_level: string
  coverage_days: string
  notes: string
}

const initialNodeFormState: SupplyNodeFormState = {
  node_id: '',
  name: '',
  policy_type: 'qr',
  reorder_point: '',
  safety_stock: '',
  order_quantity: '',
  service_level: '',
  coverage_days: '',
  notes: '',
}

export function SupplyPlansPage(): JSX.Element {
  const queryClient = useQueryClient()
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  const [formState, setFormState] = useState<SupplyPlanFormState>(initialFormState)
  const [nodeFormState, setNodeFormState] = useState<SupplyNodeFormState>(initialNodeFormState)

  const supplyPlansQuery = useQuery({
    queryKey: ['supply-plans'],
    queryFn: fetchSupplyPlans,
  })

  const plans = supplyPlansQuery.data ?? []

  useEffect(() => {
    if (plans.length > 0 && selectedPlanId === null) {
      setSelectedPlanId(plans[0].id)
    }
  }, [plans, selectedPlanId])

  useEffect(() => {
    setNodeFormState(initialNodeFormState)
  }, [selectedPlanId])

  const selectedPlanQuery = useQuery({
    queryKey: ['supply-plan', selectedPlanId],
    queryFn: () => fetchSupplyPlan(selectedPlanId ?? ''),
    enabled: Boolean(selectedPlanId),
  })

  const selectedPlan = selectedPlanQuery.data

  const duplicateNodeId = (selectedPlan?.nodes ?? []).some(
    (node) => node.node_id === nodeFormState.node_id.trim(),
  )
  const canAddNode = Boolean(
    selectedPlanId &&
      selectedPlan &&
      nodeFormState.node_id.trim() &&
      nodeFormState.name.trim() &&
      !duplicateNodeId,
  )
  const isNodeFormDisabled = !selectedPlanId || !selectedPlan

  const createMutation = useMutation({
    mutationFn: createSupplyPlan,
    onSuccess: (plan) => {
      queryClient.invalidateQueries({ queryKey: ['supply-plans'] })
      setFormState(initialFormState)
      setSelectedPlanId(plan.id)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ planId, payload }: { planId: string; payload: SupplyPlanUpdatePayload }) =>
      updateSupplyPlan(planId, payload),
    onSuccess: (plan) => {
      queryClient.setQueryData(['supply-plan', plan.id], plan)
      queryClient.invalidateQueries({ queryKey: ['supply-plans'] })
      setNodeFormState(initialNodeFormState)
      setSelectedPlanId(plan.id)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteSupplyPlan,
    onSuccess: (_, planId) => {
      queryClient.invalidateQueries({ queryKey: ['supply-plans'] })
      if (selectedPlanId === planId) {
        setSelectedPlanId(null)
      }
    },
  })

  const isCreating = createMutation.isPending
  const isUpdating = updateMutation.isPending
  const isDeleting = deleteMutation.isPending

  const handleInputChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target
    setFormState((prev) => ({ ...prev, [name]: value }))
  }

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!formState.sku || !formState.product_name || !formState.planning_horizon_start || !formState.planning_horizon_end) {
      return
    }

    const payload: SupplyPlanCreatePayload = {
      sku: formState.sku,
      product_name: formState.product_name,
      planning_horizon_start: formState.planning_horizon_start,
      planning_horizon_end: formState.planning_horizon_end,
      lifecycle_stage: formState.lifecycle_stage || undefined,
      review_cadence: formState.review_cadence || undefined,
      owner: formState.owner || undefined,
      notes: formState.notes || undefined,
      status: formState.status,
      nodes: [],
      risks: [],
      kpi_targets: [],
    }

    createMutation.mutate(payload)
  }

  const canSubmit = useMemo(() => {
    return (
      formState.sku.trim().length > 0 &&
      formState.product_name.trim().length > 0 &&
      formState.planning_horizon_start.trim().length > 0 &&
      formState.planning_horizon_end.trim().length > 0
    )
  }, [formState])

  const handleNodeInputChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target
    setNodeFormState((prev) => ({ ...prev, [name]: value }))
  }

  const handleAddNode = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedPlanId || !selectedPlan) {
      return
    }

    const nodeId = nodeFormState.node_id.trim()
    const nodeName = nodeFormState.name.trim()

    if (!nodeId || !nodeName || duplicateNodeId) {
      return
    }

    const inventoryPolicy = {
      policy_type: nodeFormState.policy_type.trim() || 'qr',
      reorder_point: toNumber(nodeFormState.reorder_point),
      safety_stock: toNumber(nodeFormState.safety_stock),
      order_quantity: toNumber(nodeFormState.order_quantity),
      service_level: toNumber(nodeFormState.service_level),
      coverage_days: toNumber(nodeFormState.coverage_days),
      notes: nodeFormState.notes.trim() || undefined,
    }

    const newNode = {
      node_id: nodeId,
      name: nodeName,
      demand_profile: [],
      inventory_policy: inventoryPolicy,
      supply_sources: [],
      schedule: [],
    }

    const payload: SupplyPlanUpdatePayload = {
      nodes: [...(selectedPlan.nodes ?? []), newNode],
    }

    updateMutation.mutate({ planId: selectedPlanId, payload })
  }


  const deleteSelectedPlan = () => {
    if (!selectedPlanId) {
      return
    }
    deleteMutation.mutate(selectedPlanId)
  }

  return (
    <div>
      <h1 className="section-title">Supply Plans</h1>
      <p className="section-subtitle">
        Manage SKU-specific supply strategies, review forecasts, inventory policies, and sourcing risks.
      </p>

      <div className="split-layout">
        <section className="panel list-panel">
          <header className="panel-header">
            <h2>Plans</h2>
            <span className="panel-hint">{plans.length} total</span>
          </header>

          {supplyPlansQuery.isLoading ? (
            <p>Loading supply plans…</p>
          ) : plans.length === 0 ? (
            <p>No supply plans yet. Create one below.</p>
          ) : (
            <div className="supply-plan-list">
              {plans.map((plan) => {
                const isActive = plan.id === selectedPlanId
                return (
                  <button
                    key={plan.id}
                    type="button"
                    className={`list-button${isActive ? ' list-button--active' : ''}`}
                    onClick={() => setSelectedPlanId(plan.id)}
                  >
                    <span className="list-button-title">{plan.product_name}</span>
                    <span className="list-button-subtitle">{plan.sku}</span>
                    <span className="list-button-meta">Status: {plan.status}</span>
                  </button>
                )
              })}
            </div>
          )}

          <form className="panel-form" onSubmit={handleCreate}>
            <h3>Create a supply plan</h3>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="sku">SKU *</label>
                <input
                  id="sku"
                  name="sku"
                  value={formState.sku}
                  onChange={handleInputChange}
                  placeholder="PROD-A"
                />
              </div>
              <div className="field">
                <label htmlFor="product_name">Product name *</label>
                <input
                  id="product_name"
                  name="product_name"
                  value={formState.product_name}
                  onChange={handleInputChange}
                  placeholder="Product A"
                />
              </div>
              <div className="field">
                <label htmlFor="planning_horizon_start">Planning horizon start *</label>
                <input
                  id="planning_horizon_start"
                  name="planning_horizon_start"
                  value={formState.planning_horizon_start}
                  onChange={handleInputChange}
                  type="date"
                />
              </div>
              <div className="field">
                <label htmlFor="planning_horizon_end">Planning horizon end *</label>
                <input
                  id="planning_horizon_end"
                  name="planning_horizon_end"
                  value={formState.planning_horizon_end}
                  onChange={handleInputChange}
                  type="date"
                />
              </div>
              <div className="field">
                <label htmlFor="lifecycle_stage">Lifecycle stage</label>
                <input
                  id="lifecycle_stage"
                  name="lifecycle_stage"
                  value={formState.lifecycle_stage}
                  onChange={handleInputChange}
                  placeholder="growth"
                />
              </div>
              <div className="field">
                <label htmlFor="review_cadence">Review cadence</label>
                <input
                  id="review_cadence"
                  name="review_cadence"
                  value={formState.review_cadence}
                  onChange={handleInputChange}
                  placeholder="monthly"
                />
              </div>
              <div className="field">
                <label htmlFor="owner">Owner</label>
                <input
                  id="owner"
                  name="owner"
                  value={formState.owner}
                  onChange={handleInputChange}
                  placeholder="Supply Planning"
                />
              </div>
              <div className="field">
                <label htmlFor="status">Status</label>
                <select id="status" name="status" value={formState.status} onChange={handleInputChange}>
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field field--full">
                <label htmlFor="notes">Notes</label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  value={formState.notes}
                  onChange={handleInputChange}
                  placeholder="Context, assumptions, or links"
                />
              </div>
            </div>
            <button type="submit" disabled={!canSubmit || isCreating}>
              {isCreating ? 'Creating...' : 'Create plan'}
            </button>
          </form>
        </section>

        <section className="panel detail-panel">
          <header className="panel-header">
            <h2>Plan details</h2>
            {selectedPlanId && (
              <button
                type="button"
                className="danger-button"
                onClick={deleteSelectedPlan}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete plan'}
              </button>
            )}
          </header>

          {selectedPlanId && selectedPlanQuery.isLoading && <p>Loading plan…</p>}
          {!selectedPlanId && <p>Select a supply plan to see the full breakdown.</p>}

          {selectedPlan && !selectedPlanQuery.isLoading && (
            <div className="plan-detail">
              <div className="metadata-grid">
                <MetadataItem label="SKU" value={selectedPlan.sku} />
                <MetadataItem label="Product" value={selectedPlan.product_name} />
                <MetadataItem label="Lifecycle" value={selectedPlan.lifecycle_stage ?? '—'} />
                <MetadataItem label="Status" value={selectedPlan.status} />
                <MetadataItem label="Owner" value={selectedPlan.owner ?? '—'} />
                <MetadataItem
                  label="Planning horizon"
                  value={`${formatDate(selectedPlan.planning_horizon_start)} → ${formatDate(selectedPlan.planning_horizon_end)}`}
                />
                <MetadataItem label="Review cadence" value={selectedPlan.review_cadence ?? '—'} />
                <MetadataItem label="Version" value={`v${selectedPlan.version}`} />
                <MetadataItem label="Updated" value={formatDate(selectedPlan.updated_at)} />
              </div>

              {selectedPlan.notes && (
                <div className="notes-block">
                  <h3>Notes</h3>
                  <p>{selectedPlan.notes}</p>
                </div>
              )}

              <section className="detail-section">
                <h3>Supply nodes</h3>
                {selectedPlan.nodes.length === 0 ? (
                  <p className="muted">No nodes captured yet.</p>
                ) : (
                  <div className="node-grid">
                    {selectedPlan.nodes.map((node) => (
                      <div key={node.node_id} className="node-card">
                        <header className="node-card-header">
                          <div>
                            <h4>{node.name}</h4>
                            <span className="muted">{node.node_id}</span>
                          </div>
                          <div className="muted">Policy: {node.inventory_policy.policy_type}</div>
                        </header>

                        {node.demand_profile.length > 0 && (
                          <table className="mini-table">
                            <thead>
                              <tr>
                                <th>Period</th>
                                <th>Forecast</th>
                                <th>Confidence</th>
                              </tr>
                            </thead>
                            <tbody>
                              {node.demand_profile.map((period) => (
                                <tr key={period.period}>
                                  <td>{period.period}</td>
                                  <td>{formatNumber(period.forecast_units)}</td>
                                  <td>{period.confidence ? `${Math.round(period.confidence * 100)}%` : '—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}

                        <div className="policy-grid">
                          {Object.entries(node.inventory_policy).map(([key, value]) => {
                            if (value === undefined || value === null) {
                              return null
                            }
                            return (
                              <div key={key} className="policy-item">
                                <span className="policy-label">{formatKey(key)}</span>
                                <span className="policy-value">{typeof value === 'number' ? formatNumber(value) : String(value)}</span>
                              </div>
                            )
                          })}
                        </div>

                        {node.supply_sources.length > 0 && (
                          <div className="subsection">
                            <h5>Sources</h5>
                            <ul>
                              {node.supply_sources.map((source) => (
                                <li key={source.supplier_id}>
                                  <strong>{source.name ?? source.supplier_id}</strong> · lead time {source.lead_time_days ?? '—'} days · cost {source.unit_cost ?? '—'}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {node.schedule.length > 0 && (
                          <div className="subsection">
                            <h5>Replenishment schedule</h5>
                            <table className="mini-table">
                              <thead>
                                <tr>
                                  <th>Period</th>
                                  <th>Planned</th>
                                  <th>Receipt</th>
                                  <th>On hand</th>
                                </tr>
                              </thead>
                              <tbody>
                                {node.schedule.map((event) => (
                                  <tr key={`${event.period}-${event.planned_order_units}`}>
                                    <td>{event.period}</td>
                                    <td>{formatNumber(event.planned_order_units)}</td>
                                    <td>{event.expected_receipt_units ? formatNumber(event.expected_receipt_units) : '—'}</td>
                                    <td>{event.projected_on_hand ? formatNumber(event.projected_on_hand) : '—'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {selectedPlanId && selectedPlan ? (
                <form className="inline-form" onSubmit={handleAddNode}>
                  <h3>Add supply node</h3>
                  <div className="form-grid">
                    <div className="field">
                      <label htmlFor="node_id">Node ID *</label>
                      <input
                        id="node_id"
                        name="node_id"
                        value={nodeFormState.node_id}
                        onChange={handleNodeInputChange}
                        placeholder="dc-north"
                        disabled={isNodeFormDisabled || isUpdating}
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="node_name">Node name *</label>
                      <input
                        id="node_name"
                        name="name"
                        value={nodeFormState.name}
                        onChange={handleNodeInputChange}
                        placeholder="North Distribution Center"
                        disabled={isNodeFormDisabled || isUpdating}
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="policy_type">Policy type</label>
                      <select
                        id="policy_type"
                        name="policy_type"
                        value={nodeFormState.policy_type}
                        onChange={handleNodeInputChange}
                        disabled={isNodeFormDisabled || isUpdating}
                      >
                        {inventoryPolicyOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="field">
                      <label htmlFor="reorder_point">Reorder point</label>
                      <input
                        id="reorder_point"
                        name="reorder_point"
                        value={nodeFormState.reorder_point}
                        onChange={handleNodeInputChange}
                        placeholder="850"
                        disabled={isNodeFormDisabled || isUpdating}
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="safety_stock">Safety stock</label>
                      <input
                        id="safety_stock"
                        name="safety_stock"
                        value={nodeFormState.safety_stock}
                        onChange={handleNodeInputChange}
                        placeholder="300"
                        disabled={isNodeFormDisabled || isUpdating}
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="order_quantity">Order quantity</label>
                      <input
                        id="order_quantity"
                        name="order_quantity"
                        value={nodeFormState.order_quantity}
                        onChange={handleNodeInputChange}
                        placeholder="950"
                        disabled={isNodeFormDisabled || isUpdating}
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="service_level">Service level</label>
                      <input
                        id="service_level"
                        name="service_level"
                        value={nodeFormState.service_level}
                        onChange={handleNodeInputChange}
                        placeholder="0.95"
                        disabled={isNodeFormDisabled || isUpdating}
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="coverage_days">Coverage days</label>
                      <input
                        id="coverage_days"
                        name="coverage_days"
                        value={nodeFormState.coverage_days}
                        onChange={handleNodeInputChange}
                        placeholder="21"
                        disabled={isNodeFormDisabled || isUpdating}
                      />
                    </div>
                    <div className="field field--full">
                      <label htmlFor="node_notes">Policy notes</label>
                      <textarea
                        id="node_notes"
                        name="notes"
                        rows={2}
                        value={nodeFormState.notes}
                        onChange={handleNodeInputChange}
                        placeholder="Context or assumptions"
                        disabled={isNodeFormDisabled || isUpdating}
                      />
                    </div>
                  </div>
                  {duplicateNodeId && (<p className="form-hint form-hint--error">Node ID already exists on this plan.</p>)}
                  <div className="form-actions">
                    <button type="submit" disabled={!canAddNode || isUpdating || isNodeFormDisabled}>
                      {isUpdating ? 'Adding�' : 'Add node'}
                    </button>
                  </div>
                </form>
              ) : (
                <p className="muted">Select a plan to add supply nodes.</p>
              )}

              <section className="detail-section">
                <h3>Risks</h3>
                {selectedPlan.risks.length === 0 ? (
                  <p className="muted">No risks logged.</p>
                ) : (
                  <ul className="bullet-list">
                    {selectedPlan.risks.map((risk) => (
                      <li key={risk.risk_id}>
                        <strong>{risk.category}</strong>: {risk.mitigation ?? risk.impact ?? 'Tracked'} (owner: {risk.owner ?? 'unassigned'})
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="detail-section">
                <h3>KPI targets</h3>
                {selectedPlan.kpi_targets.length === 0 ? (
                  <p className="muted">No KPI targets set.</p>
                ) : (
                  <div className="kpi-grid">
                    {selectedPlan.kpi_targets.map((kpi) => (
                      <div key={kpi.metric} className="kpi-card">
                        <span className="kpi-label">{kpi.metric}</span>
                        <span className="kpi-value">
                          {kpi.target_value !== undefined ? formatNumber(kpi.target_value) : '—'} {kpi.unit ?? ''}
                        </span>
                        {kpi.notes && <span className="muted">{kpi.notes}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

type MetadataProps = {
  label: string
  value: string
}

function MetadataItem({ label, value }: MetadataProps): JSX.Element {
  return (
    <div className="metadata-item">
      <span className="metadata-label">{label}</span>
      <span className="metadata-value">{value}</span>
    </div>
  )
}

function formatDate(value: string): string {
  if (!value) {
    return '—'
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return date.toLocaleDateString()
}

function toNumber(value: string): number | undefined {
  if (!value.trim()) {
    return undefined
  }
  const parsed = Number(value)
  if (Number.isNaN(parsed)) {
    return undefined
  }
  return parsed
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value)
}

function formatKey(key: string): string {
  return key.replace(/_/g, ' ')
}


















