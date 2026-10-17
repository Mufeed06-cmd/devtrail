import React, { useState } from 'react'
import {
  GitBranch,
  Plus,
  Search,
  Calendar,
  X,
  Link as LinkIcon,
  Filter,
} from 'lucide-react'
import type { Decision, DecisionCreate, Requirement } from '../types'

interface DecisionsViewProps {
  projectName: string
  decisions: Decision[]
  requirements: Requirement[]
  isLoading: boolean
  isCreateOpen: boolean
  setIsCreateOpen: (open: boolean) => void
  onCreateDecision: (payload: DecisionCreate) => Promise<void>
  onSelectDecision: (decision: Decision) => void
}

export const DecisionsView: React.FC<DecisionsViewProps> = ({
  projectName,
  decisions,
  requirements,
  isLoading,
  isCreateOpen,
  setIsCreateOpen,
  onCreateDecision,
  onSelectDecision,
}) => {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const [decId, setDecId] = useState('')
  const [title, setTitle] = useState('')
  const [rationale, setRationale] = useState('')
  const [status, setStatus] = useState('accepted')
  const [requirementId, setRequirementId] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const filteredDecisions = decisions.filter((d) => {
    const matchesSearch =
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.id.toLowerCase().includes(search.toLowerCase()) ||
      d.rationale.toLowerCase().includes(search.toLowerCase())

    const matchesStatus = statusFilter === 'all' || d.status.toLowerCase() === statusFilter.toLowerCase()
    return matchesSearch && matchesStatus
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setFormError('Decision title is required')
      return
    }
    if (!rationale.trim()) {
      setFormError('Decision rationale is required')
      return
    }

    try {
      setIsSubmitting(true)
      setFormError(null)
      await onCreateDecision({
        id: decId.trim() || undefined,
        title: title.trim(),
        rationale: rationale.trim(),
        status,
        requirement_id: requirementId || undefined,
      })
      setDecId('')
      setTitle('')
      setRationale('')
      setStatus('accepted')
      setRequirementId('')
      setIsCreateOpen(false)
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to record decision')
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
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#fff' }}>
              Architecture Decisions
            </h1>
            <span className="badge badge-id" style={{ fontSize: '11px' }}>
              {decisions.length} {decisions.length === 1 ? 'Node' : 'Nodes'}
            </span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Documenting architectural rationale and requirement satisfaction for{' '}
            <span className="font-mono" style={{ color: '#60a5fa' }}>
              {projectName}
            </span>
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
              <Plus size={15} /> Record Decision
            </>
          )}
        </button>
      </div>

      {/* Decision Creation Form */}
      {isCreateOpen && (
        <div
          className="card"
          style={{
            borderColor: 'var(--accent-violet)',
            boxShadow: '0 0 20px rgba(139, 92, 246, 0.1)',
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
              <GitBranch size={16} color="#a78bfa" />
              <h3 style={{ fontSize: '15px', fontWeight: 600 }}>Record Decision Node</h3>
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="dec-id">
                  Decision ID (Optional)
                </label>
                <input
                  id="dec-id"
                  type="text"
                  className="form-input font-mono"
                  placeholder="e.g. DEC-FALKOR-01"
                  value={decId}
                  onChange={(e) => setDecId(e.target.value)}
                />
                <div className="form-hint">Auto-slugified if left empty</div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="dec-title">
                  Decision Title <span className="required">*</span>
                </label>
                <input
                  id="dec-title"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Adopt Cypher MERGE for Graph Memory Idempotency"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="dec-status">
                  Status
                </label>
                <select
                  id="dec-status"
                  className="form-select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="accepted">Accepted</option>
                  <option value="proposed">Proposed</option>
                  <option value="deprecated">Deprecated</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="connect-req">
                Connect to Requirement (Optional)
              </label>
              <select
                id="connect-req"
                className="form-select font-mono"
                value={requirementId}
                onChange={(e) => setRequirementId(e.target.value)}
              >
                <option value="">-- No immediate requirement connection --</option>
                {requirements.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.id}: {r.title}
                  </option>
                ))}
              </select>
              <div className="form-hint">
                Creates an immediate <code style={{ color: '#34d399' }}>[:ADDRESSES]</code> graph edge
                in FalkorDB.
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="dec-rationale">
                Rationale & Architectural Justification <span className="required">*</span>
              </label>
              <textarea
                id="dec-rationale"
                className="form-textarea"
                placeholder="Explain the technical motivation, trade-offs considered, and why this alternative was selected..."
                value={rationale}
                onChange={(e) => setRationale(e.target.value)}
                rows={4}
                required
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
                Recorded with persistent timestamps and graph relationships.
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
                      <span className="spinner" /> Recording...
                    </>
                  ) : (
                    'Record Decision'
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Search and Status Filters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search
            size={16}
            color="#64748b"
            style={{ position: 'absolute', left: '12px', top: '11px' }}
          />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '36px' }}
            placeholder="Search decisions by ID, title, or rationale..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Filter size={15} color="#94a3b8" />
          <div style={{ display: 'flex', gap: '4px' }}>
            {['all', 'accepted', 'proposed', 'deprecated'].map((st) => (
              <button
                key={st}
                type="button"
                className={`btn btn-secondary`}
                style={{
                  padding: '5px 10px',
                  fontSize: '12px',
                  textTransform: 'capitalize',
                  background:
                    statusFilter === st ? 'var(--bg-surface-hover)' : 'var(--bg-surface)',
                  borderColor: statusFilter === st ? 'var(--accent-blue)' : 'var(--border-subtle)',
                  color: statusFilter === st ? '#60a5fa' : 'var(--text-secondary)',
                }}
                onClick={() => setStatusFilter(st)}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Decisions List */}
      {isLoading ? (
        <div className="state-box">
          <span className="spinner" style={{ width: '28px', height: '28px' }} />
          <div className="state-title">Loading Architecture Decisions...</div>
        </div>
      ) : filteredDecisions.length === 0 ? (
        <div className="state-box">
          <div className="state-icon">
            <GitBranch size={24} />
          </div>
          <div className="state-title">
            {search || statusFilter !== 'all'
              ? 'No matching decisions'
              : 'No decisions recorded yet'}
          </div>
          <div className="state-desc">
            {search || statusFilter !== 'all'
              ? 'Try adjusting your search query or status filter.'
              : `Record the first architecture decision for ${projectName} to preserve graph memory.`}
          </div>
          {!search && statusFilter === 'all' && (
            <button
              type="button"
              className="btn btn-primary"
              style={{ marginTop: '8px' }}
              onClick={() => setIsCreateOpen(true)}
            >
              <Plus size={15} /> Record First Decision
            </button>
          )}
        </div>
      ) : (
        <div className="items-list">
          {filteredDecisions.map((dec) => (
            <div
              key={dec.id}
              className="item-card"
              onClick={() => onSelectDecision(dec)}
            >
              <div className="item-card-header">
                <div className="item-card-title">
                  <span className="badge badge-id">{dec.id}</span>
                  <span>{dec.title}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className={`badge badge-${dec.status || 'accepted'}`}>{dec.status}</span>
                  {dec.created_at && (
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
                      <span>{new Date(dec.created_at).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="item-card-desc">
                <p style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {dec.rationale}
                </p>
              </div>

              <div className="item-card-footer">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <LinkIcon size={13} color="#34d399" />
                  <span style={{ fontSize: '12px' }}>
                    {dec.requirements && dec.requirements.length > 0 ? (
                      <span style={{ color: '#34d399' }}>
                        Addresses {dec.requirements.length} requirement(s):
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>No requirement linked</span>
                    )}
                  </span>
                  {dec.requirements?.map((req) => (
                    <span key={req.id} className="badge badge-req-id" style={{ fontSize: '10.5px' }}>
                      {req.id}: {req.title}
                    </span>
                  ))}
                </div>

                <span style={{ fontSize: '12px', color: '#60a5fa' }}>View details →</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
