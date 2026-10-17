import React, { useState } from 'react'
import {
  X,
  GitBranch,
  Calendar,
  Link as LinkIcon,
  Plus,
} from 'lucide-react'
import type { Decision, Requirement } from '../types'

interface DecisionDetailModalProps {
  decision: Decision | null
  projectName: string
  availableRequirements: Requirement[]
  isOpen: boolean
  onClose: () => void
  onConnectRequirement: (decisionId: string, requirementId: string) => Promise<void>
}

export const DecisionDetailModal: React.FC<DecisionDetailModalProps> = ({
  decision,
  projectName,
  availableRequirements,
  isOpen,
  onClose,
  onConnectRequirement,
}) => {
  const [selectedReqId, setSelectedReqId] = useState('')
  const [isLinking, setIsLinking] = useState(false)
  const [linkError, setLinkError] = useState<string | null>(null)

  if (!isOpen || !decision) return null

  // Requirements that are not already linked to this decision
  const unlinkedRequirements = availableRequirements.filter(
    (ar) => !(decision.requirements || []).some((dr) => dr.id === ar.id)
  )

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedReqId) return

    try {
      setIsLinking(true)
      setLinkError(null)
      await onConnectRequirement(decision.id, selectedReqId)
      setSelectedReqId('')
    } catch (err: unknown) {
      setLinkError(err instanceof Error ? err.message : 'Failed to connect requirement')
    } finally {
      setIsLinking(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '680px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(139, 92, 246, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#a78bfa',
              }}
            >
              <GitBranch size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="badge badge-id">{decision.id}</span>
                <span className={`badge badge-${decision.status || 'accepted'}`}>
                  {decision.status}
                </span>
              </div>
              <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#fff', marginTop: '4px' }}>
                {decision.title}
              </h2>
            </div>
          </div>

          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {linkError && <div className="alert-banner alert-error">{linkError}</div>}

          {/* Meta Information */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              fontSize: '12px',
              color: 'var(--text-muted)',
              paddingBottom: '12px',
              borderBottom: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Calendar size={13} />
              <span>
                {decision.created_at
                  ? new Date(decision.created_at).toLocaleString()
                  : 'Timestamp recorded'}
              </span>
            </div>
            <span>•</span>
            <div>
              Project: <span className="font-mono" style={{ color: '#60a5fa' }}>{projectName}</span>
            </div>
          </div>

          {/* Rationale Section */}
          <div>
            <div
              style={{
                fontSize: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                fontWeight: 600,
                color: 'var(--text-muted)',
                marginBottom: '8px',
              }}
            >
              Architectural Rationale
            </div>
            <div
              style={{
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-accent)',
                borderRadius: '8px',
                padding: '16px',
                color: '#f8fafc',
                fontSize: '13.5px',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
              }}
            >
              {decision.rationale}
            </div>
          </div>

          {/* Connected Requirements Section */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '10px',
              }}
            >
              <div
                style={{
                  fontSize: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <LinkIcon size={14} color="#34d399" />
                <span>Connected Requirements (:ADDRESSES)</span>
              </div>
              <span className="badge badge-id" style={{ fontSize: '10.5px' }}>
                {decision.requirements?.length || 0} Connected
              </span>
            </div>

            {(!decision.requirements || decision.requirements.length === 0) ? (
              <div
                style={{
                  padding: '16px',
                  background: 'rgba(19, 27, 46, 0.4)',
                  border: '1px dashed var(--border-subtle)',
                  borderRadius: '8px',
                  textAlign: 'center',
                  fontSize: '13px',
                  color: 'var(--text-muted)',
                }}
              >
                This decision is not currently connected to any requirements.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {decision.requirements.map((req) => (
                  <div
                    key={req.id}
                    style={{
                      background: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      padding: '12px 14px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span className="badge badge-req-id">{req.id}</span>
                      <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#f8fafc' }}>
                        {req.title}
                      </span>
                    </div>
                    {req.description && (
                      <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                        {req.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Connect Another Requirement Action */}
          {unlinkedRequirements.length > 0 && (
            <div
              style={{
                background: 'rgba(59, 130, 246, 0.05)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                borderRadius: '8px',
                padding: '14px 16px',
              }}
            >
              <div
                style={{
                  fontSize: '12.5px',
                  fontWeight: 600,
                  color: '#93c5fd',
                  marginBottom: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Plus size={14} /> Connect Another Requirement to this Decision
              </div>

              <form onSubmit={handleLink} style={{ display: 'flex', gap: '10px' }}>
                <select
                  className="form-select font-mono"
                  style={{ flex: 1, fontSize: '12.5px' }}
                  value={selectedReqId}
                  onChange={(e) => setSelectedReqId(e.target.value)}
                  required
                >
                  <option value="">-- Choose requirement to link --</option>
                  {unlinkedRequirements.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.id}: {r.title}
                    </option>
                  ))}
                </select>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!selectedReqId || isLinking}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  {isLinking ? (
                    <>
                      <span className="spinner" /> Linking...
                    </>
                  ) : (
                    'Link in Graph'
                  )}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
