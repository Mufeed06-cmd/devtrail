import React, { useState } from 'react'
import {
  CheckSquare,
  Plus,
  Search,
  Calendar,
  X,
  Layers,
  GitBranch,
} from 'lucide-react'
import type { Requirement, RequirementCreate, Decision } from '../types'

interface RequirementsViewProps {
  projectName: string
  requirements: Requirement[]
  decisions: Decision[]
  isLoading: boolean
  isCreateOpen: boolean
  setIsCreateOpen: (open: boolean) => void
  onCreateRequirement: (payload: RequirementCreate) => Promise<void>
}

export const RequirementsView: React.FC<RequirementsViewProps> = ({
  projectName,
  requirements,
  decisions,
  isLoading,
  isCreateOpen,
  setIsCreateOpen,
  onCreateRequirement,
}) => {
  const [search, setSearch] = useState('')
  const [reqId, setReqId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Map each requirement ID to decisions that address it
  const reqDecisionMap = React.useMemo(() => {
    const map: Record<string, Decision[]> = {}
    for (const d of decisions) {
      if (d.requirements) {
        for (const r of d.requirements) {
          if (!map[r.id]) map[r.id] = []
          map[r.id].push(d)
        }
      }
    }
    return map
  }, [decisions])

  const filteredRequirements = requirements.filter(
    (r) =>
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      (r.description && r.description.toLowerCase().includes(search.toLowerCase()))
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setFormError('Requirement title is required')
      return
    }

    try {
      setIsSubmitting(true)
      setFormError(null)
      await onCreateRequirement({
        id: reqId.trim() || undefined,
        title: title.trim(),
        description: description.trim() || undefined,
      })
      setReqId('')
      setTitle('')
      setDescription('')
      setIsCreateOpen(false)
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to save requirement')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#fff' }}>Requirements</h1>
            <span className="badge badge-id" style={{ fontSize: '11px' }}>
              {requirements.length} {requirements.length === 1 ? 'Node' : 'Nodes'}
            </span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Scoped to project: <span className="font-mono" style={{ color: '#60a5fa' }}>{projectName}</span>
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setIsCreateOpen(!isCreateOpen)}
        >
          {isCreateOpen ? (
            <>
              <X size={15} /> Close Form
            </>
          ) : (
            <>
              <Plus size={15} /> New Requirement
            </>
          )}
        </button>
      </div>

      {/* Creation Form Panel */}
      {isCreateOpen && (
        <div
          className="card"
          style={{
            borderColor: 'var(--accent-blue)',
            boxShadow: '0 0 20px rgba(59, 130, 246, 0.1)',
            background: 'var(--bg-surface-elevated)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={16} color="#60a5fa" />
              <h3 style={{ fontSize: '15px', fontWeight: 600 }}>Record Requirement Node</h3>
            </div>
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setIsCreateOpen(false)}
            >
              <X size={16} />
            </button>
          </div>

          {formError && <div className="alert-banner alert-error">{formError}</div>}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="req-id">
                  Requirement ID (Optional)
                </label>
                <input
                  id="req-id"
                  type="text"
                  className="form-input font-mono"
                  placeholder="e.g. REQ-AUTH-01"
                  value={reqId}
                  onChange={(e) => setReqId(e.target.value)}
                />
                <div className="form-hint">
                  Auto-slugified from title if left empty (e.g. req-user-auth).
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="req-title">
                  Title <span className="required">*</span>
                </label>
                <input
                  id="req-title"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Offline-first local data synchronization"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="req-desc">
                Description & Specifications (Optional)
              </label>
              <textarea
                id="req-desc"
                className="form-textarea"
                placeholder="Details of the requirement, functional criteria, or constraints..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '12px',
                borderTop: '1px solid var(--border-subtle)',
              }}
            >
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                FalkorDB uses Cypher <code style={{ color: '#a78bfa' }}>MERGE</code> to prevent
                duplicates upon repetition.
              </span>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsCreateOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <span className="spinner" /> Saving...
                    </>
                  ) : (
                    'Save Requirement'
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search
            size={16}
            color="#64748b"
            style={{ position: 'absolute', left: '12px', top: '11px' }}
          />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '36px' }}
            placeholder="Search requirements by ID, title, or keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* List / Empty State */}
      {isLoading ? (
        <div className="state-box">
          <span className="spinner" style={{ width: '28px', height: '28px' }} />
          <div className="state-title">Loading Requirements...</div>
        </div>
      ) : filteredRequirements.length === 0 ? (
        <div className="state-box">
          <div className="state-icon">
            <CheckSquare size={24} />
          </div>
          <div className="state-title">
            {search ? 'No matching requirements' : 'No requirements recorded yet'}
          </div>
          <div className="state-desc">
            {search
              ? `No requirements match "${search}". Try another search term.`
              : `Create the first requirement node for ${projectName} to connect architecture decisions.`}
          </div>
          {!search && (
            <button
              type="button"
              className="btn btn-primary"
              style={{ marginTop: '8px' }}
              onClick={() => setIsCreateOpen(true)}
            >
              <Plus size={15} /> Add First Requirement
            </button>
          )}
        </div>
      ) : (
        <div className="items-list">
          {filteredRequirements.map((req) => {
            const linkedDecisions = reqDecisionMap[req.id] || []

            return (
              <div key={req.id} className="item-card">
                <div className="item-card-header">
                  <div className="item-card-title">
                    <span className="badge badge-req-id">{req.id}</span>
                    <span>{req.title}</span>
                  </div>

                  {req.created_at && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontSize: '11.5px',
                        color: 'var(--text-muted)',
                      }}
                    >
                      <Calendar size={12} />
                      <span>{new Date(req.created_at).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                {req.description && <div className="item-card-desc">{req.description}</div>}

                <div className="item-card-footer">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Layers size={13} color="#8b5cf6" />
                    <span>
                      {linkedDecisions.length === 0 ? (
                        <span style={{ color: 'var(--text-muted)' }}>No decisions connected yet</span>
                      ) : (
                        <span style={{ color: '#a78bfa' }}>
                          Addressed by {linkedDecisions.length} decision(s)
                        </span>
                      )}
                    </span>
                  </div>

                  {linkedDecisions.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {linkedDecisions.map((dec) => (
                        <span
                          key={dec.id}
                          className="badge badge-id"
                          title={dec.title}
                          style={{ fontSize: '10px' }}
                        >
                          <GitBranch size={10} style={{ marginRight: '3px' }} />
                          {dec.id}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
