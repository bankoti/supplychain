import type { ChangeEvent, FormEvent, JSX } from 'react'
import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { createPlan, deletePlan, fetchPlans, updatePlan } from '../lib/api'
import type { PlanModel, PlanTask, TaskStatus } from '../lib/types'

interface DraftTask {
  title: string
  description?: string
}

const taskStatusOptions: Array<{ value: TaskStatus; label: string }> = [
  { value: 'todo', label: 'To do' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'done', label: 'Done' },
]

export function PlannerPage(): JSX.Element {
  const queryClient = useQueryClient()
  const plansQuery = useQuery({ queryKey: ['plans'], queryFn: fetchPlans })
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  const [newPlanName, setNewPlanName] = useState<string>('')
  const [newPlanDescription, setNewPlanDescription] = useState<string>('')
  const [draftTask, setDraftTask] = useState<DraftTask>({ title: '' })

  const createPlanMutation = useMutation({
    mutationFn: createPlan,
    onSuccess: (plan) => {
      setNewPlanName('')
      setNewPlanDescription('')
      setSelectedPlanId(plan.id)
      queryClient.invalidateQueries({ queryKey: ['plans'] })
    },
  })

  const updatePlanMutation = useMutation({
    mutationFn: ({ planId, payload }: { planId: string; payload: Partial<PlanModel> }) =>
      updatePlan(planId, payload),
    onSuccess: (plan) => {
      setSelectedPlanId(plan.id)
      queryClient.invalidateQueries({ queryKey: ['plans'] })
    },
  })

  const deletePlanMutation = useMutation({
    mutationFn: deletePlan,
    onSuccess: () => {
      setSelectedPlanId(null)
      queryClient.invalidateQueries({ queryKey: ['plans'] })
    },
  })

  const selectedPlan = useMemo(() => {
    if (!plansQuery.data || plansQuery.data.length === 0) {
      return undefined
    }
    if (selectedPlanId) {
      return plansQuery.data.find((plan) => plan.id === selectedPlanId)
    }
    return plansQuery.data[0]
  }, [plansQuery.data, selectedPlanId])

  if (plansQuery.isLoading) {
    return (
      <section>
        <h1 className="section-title">Supply Chain Planning Control Tower</h1>
        <p>Loading plans…</p>
      </section>
    )
  }

  if (plansQuery.isError) {
    return (
      <section>
        <h1 className="section-title">Supply Chain Planning Control Tower</h1>
        <p role="alert">Unable to load plans. Refresh the page or restart the API.</p>
      </section>
    )
  }

  const handleCreatePlan = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    if (!newPlanName.trim()) {
      return
    }
    createPlanMutation.mutate({
      name: newPlanName.trim(),
      description: newPlanDescription.trim() || undefined,
      tasks: [],
    })
  }

  const handleAddTask = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    if (!selectedPlan || !draftTask.title.trim()) {
      return
    }
    const task: PlanTask = {
      id: `task-${Date.now()}`,
      title: draftTask.title.trim(),
      description: draftTask.description?.trim() || undefined,
      status: 'todo',
    }
    const tasks = [...selectedPlan.tasks, task]
    updatePlanMutation.mutate({ planId: selectedPlan.id, payload: { tasks } })
    setDraftTask({ title: '' })
  }

  const handleTaskStatusChange = (taskId: string, newStatus: TaskStatus): void => {
    if (!selectedPlan) return
    const tasks = selectedPlan.tasks.map((task) =>
      task.id === taskId ? { ...task, status: newStatus } : task,
    )
    updatePlanMutation.mutate({ planId: selectedPlan.id, payload: { tasks } })
  }

  const handleTaskDelete = (taskId: string): void => {
    if (!selectedPlan) return
    const tasks = selectedPlan.tasks.filter((task) => task.id !== taskId)
    updatePlanMutation.mutate({ planId: selectedPlan.id, payload: { tasks } })
  }

  const handlePlanDelete = (planId: string): void => {
    deletePlanMutation.mutate(planId)
  }

  const handlePlanMetaChange = (changes: Partial<Pick<PlanModel, 'name' | 'description'>>): void => {
    if (!selectedPlan) return
    updatePlanMutation.mutate({ planId: selectedPlan.id, payload: { ...changes } })
  }

  const plans = plansQuery.data ?? []

  const selectedPlanProgress = selectedPlan
    ? Math.round(
        selectedPlan.tasks.length === 0
          ? 0
          : (selectedPlan.tasks.filter((task) => task.status === 'done').length /
              selectedPlan.tasks.length) *
              100,
      )
    : 0

  return (
    <section>
      <h1 className="section-title">Supply Chain Planning Control Tower</h1>
      <p>
        Track your end-to-end supply chain roadmap, monitor progress, and spin up new plans as you
        iterate through breadth and depth milestones.
      </p>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h2 className="card-label">Create New Plan</h2>
        <form className="form-grid" onSubmit={handleCreatePlan}>
          <div className="field">
            <label htmlFor="newPlanName">Name</label>
            <input
              id="newPlanName"
              value={newPlanName}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setNewPlanName(event.target.value)}
              required
            />
          </div>
          <div className="field" style={{ gridColumn: '1 / -1' }}>
            <label htmlFor="newPlanDescription">Description</label>
            <textarea
              id="newPlanDescription"
              rows={2}
              value={newPlanDescription}
              onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                setNewPlanDescription(event.target.value)
              }
            />
          </div>
          <button disabled={createPlanMutation.isPending} type="submit">
            {createPlanMutation.isPending ? 'Creating…' : 'Create Plan'}
          </button>
        </form>
      </div>

      <div className="card" style={{ marginTop: '1.5rem', display: 'grid', gap: '1.5rem' }}>
        <div>
          <h2 className="card-label">Plans</h2>
          {plans.length === 0 ? (
            <p>No plans yet. Create a plan to get started.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {plans.map((plan) => {
                const total = plan.tasks.length
                const completed = plan.tasks.filter((task) => task.status === 'done').length
                const percentage = total === 0 ? 0 : Math.round((completed / total) * 100)
                const isSelected = selectedPlan?.id === plan.id
                return (
                  <li key={plan.id} style={{ marginBottom: '0.75rem' }}>
                    <button
                      type="button"
                      onClick={() => setSelectedPlanId(plan.id)}
                      className="nav-link"
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        width: '100%',
                        backgroundColor: isSelected ? '#1e293b' : 'transparent',
                      }}
                    >
                      <span>{plan.name}</span>
                      <span>{percentage}%</span>
                    </button>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => handlePlanDelete(plan.id)}
                        style={{
                          background: '#ef4444',
                          padding: '0.4rem 0.7rem',
                          fontSize: '0.8rem',
                        }}
                        disabled={deletePlanMutation.isPending}
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {selectedPlan ? (
          <div>
            <h2 className="card-label">Plan Details</h2>
            <p style={{ marginBottom: '0.75rem' }}>
              Overall progress: <strong>{selectedPlanProgress}% complete</strong>
            </p>
            <div className="form-grid" style={{ marginBottom: '1rem' }}>
              <div className="field">
                <label htmlFor="planName">Name</label>
                <input
                  id="planName"
                  value={selectedPlan.name}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    handlePlanMetaChange({ name: event.target.value })
                  }
                />
              </div>
              <div className="field" style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="planDescription">Description</label>
                <textarea
                  id="planDescription"
                  rows={2}
                  value={selectedPlan.description ?? ''}
                  onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                    handlePlanMetaChange({ description: event.target.value })
                  }
                />
              </div>
            </div>

            <form className="form-grid" onSubmit={handleAddTask} style={{ marginBottom: '1rem' }}>
              <div className="field">
                <label htmlFor="taskTitle">Add Task</label>
                <input
                  id="taskTitle"
                  value={draftTask.title}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    setDraftTask((prev) => ({ ...prev, title: event.target.value }))
                  }
                  required
                />
              </div>
              <div className="field" style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="taskDescription">Description</label>
                <textarea
                  id="taskDescription"
                  rows={2}
                  value={draftTask.description ?? ''}
                  onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                    setDraftTask((prev) => ({ ...prev, description: event.target.value }))
                  }
                />
              </div>
              <button type="submit">Add Task</button>
            </form>

            {selectedPlan.tasks.length === 0 ? (
              <p>No tasks yet. Capture upcoming work to track progress.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Status</th>
                    <th>Description</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {selectedPlan.tasks.map((task) => (
                    <tr key={task.id}>
                      <td>{task.title}</td>
                      <td>
                        <select
                          value={task.status}
                          onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                            handleTaskStatusChange(task.id, event.target.value as TaskStatus)
                          }
                        >
                          {taskStatusOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>{task.description ?? '—'}</td>
                      <td>
                        <button
                          type="button"
                          onClick={() => handleTaskDelete(task.id)}
                          style={{ background: '#f87171' }}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : null}
      </div>
    </section>
  )
}