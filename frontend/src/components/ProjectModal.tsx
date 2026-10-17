import React, { useState } from 'react'
import { X, FolderPlus } from 'lucide-react'
import type { ProjectCreate } from '../types'

interface ProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (payload: ProjectCreate) => Promise<void>
}

export const ProjectModal: React.FC<ProjectModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Project name is required')
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)
      await onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
      })
      setName('')
      setDescription('')
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create or select project')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FolderPlus size={18} color="#60a5fa" />
            <span className="modal-title">Create or Select Project</span>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="alert-banner alert-error">{error}</div>}

            <div className="form-group">
              <label className="form-label" htmlFor="project-name">
                Project Name <span className="required">*</span>
              </label>
              <input
                id="project-name"
                type="text"
                className="form-input font-mono"
                placeholder="e.g. AuthService, DevTrail, PaymentGateway"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                required
              />
              <div className="form-hint">
                DevTrail uses Cypher <code style={{ color: '#a78bfa' }}>MERGE</code>. If this
                project already exists in FalkorDB, it will be selected without duplication.
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="project-desc">
                Description (Optional)
              </label>
              <textarea
                id="project-desc"
                className="form-textarea"
                placeholder="Summarize the project's purpose and scope..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
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
                'Create or Select'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
