import React from 'react'
import {
  CheckSquare,
  GitBranch,
  Link as LinkIcon,
  Plus,
  ArrowRight,
  Database,
  Calendar,
  Sparkles,
} from 'lucide-react'
import type { Project, Requirement, Decision, ActiveTab } from '../types'

interface ProjectOverviewProps {
  project: Project | null
  requirements: Requirement[]
  decisions: Decision[]
  onNavigateTab: (tab: ActiveTab) => void
  onOpenNewRequirement: () => void
  onOpenNewDecision: () => void
  onSelectDecision: (decision: Decision) => void
}

export const ProjectOverview: React.FC<ProjectOverviewProps> = ({
  project,
  requirements,
  decisions,
  onNavigateTab,
  onOpenNewRequirement,
  onOpenNewDecision,
  onSelectDecision,
}) => {
  if (!project) {
    return (
      <div className="state-box">
        <div className="state-icon">
          <Database size={24} />
        </div>
        <div className="state-title">No Project Selected</div>
        <div className="state-desc">
          Select an existing project from the sidebar or create a new one to start tracking graph
          memory.
        </div>
      </div>
    )
  }

  // Calculate total ADDRESSES linkages
  const totalLinkages = decisions.reduce((acc, dec) => acc + (dec.requirements?.length || 0), 0)

  // Recent 3 requirements and decisions
  const recentReqs = requirements.slice(-3).reverse()
  const recentDecs = decisions.slice(-3).reverse()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Project Banner Card */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, rgba(19, 27, 46, 0.95), rgba(26, 36, 61, 0.8))',
          border: '1px solid var(--border-accent)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '240px',
            height: '100%',
            background:
              'radial-gradient(circle at 80% 20%, rgba(59, 130, 246, 0.12), transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span className="badge badge-id" style={{ fontSize: '12px' }}>
                PROJECT NODE
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                FalkorDB Graph: DevTrail
              </span>
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>
              {project.name}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '640px' }}>
              {project.description ||
                'Persistent graph memory repository tracking engineering requirements and decisions.'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onOpenNewRequirement}
            >
              <Plus size={15} /> Add Requirement
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={onOpenNewDecision}
            >
              <Plus size={15} /> Record Decision
            </button>
          </div>
        </div>

        {project.created_at && (
          <div
            style={{
              marginTop: '16px',
              paddingTop: '12px',
              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              color: 'var(--text-muted)',
            }}
          >
            <Calendar size={13} />
            <span>Created on {new Date(project.created_at).toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* Graph Metrics Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ color: '#60a5fa' }}>
            <CheckSquare size={20} />
          </div>
          <div>
            <div className="stat-val">{requirements.length}</div>
            <div className="stat-label">Requirements</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ color: '#a78bfa' }}>
            <GitBranch size={20} />
          </div>
          <div>
            <div className="stat-val">{decisions.length}</div>
            <div className="stat-label">Architecture Decisions</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ color: '#34d399' }}>
            <LinkIcon size={20} />
          </div>
          <div>
            <div className="stat-val">{totalLinkages}</div>
            <div className="stat-label">Graph Links (:ADDRESSES)</div>
          </div>
        </div>

        <div
          className="stat-card"
          style={{ cursor: 'pointer' }}
          onClick={() => onNavigateTab('lookup')}
        >
          <div className="stat-icon-wrapper" style={{ color: '#f59e0b' }}>
            <Sparkles size={20} />
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#f3f4f6' }}>
              Memory Lookup
            </div>
            <div className="stat-label" style={{ color: '#60a5fa', textTransform: 'none' }}>
              Query Graph →
            </div>
          </div>
        </div>
      </div>

      {/* Two-Column Section: Recent Requirements & Decisions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Recent Requirements */}
        <div className="card">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckSquare size={17} color="#60a5fa" />
              <h2 style={{ fontSize: '15px', fontWeight: 600 }}>Recent Requirements</h2>
            </div>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '4px 10px', fontSize: '12px' }}
              onClick={() => onNavigateTab('requirements')}
            >
              View all <ArrowRight size={13} />
            </button>
          </div>

          {recentReqs.length === 0 ? (
            <div className="state-box" style={{ padding: '24px' }}>
              <div className="state-desc">No requirements added yet.</div>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ marginTop: '8px' }}
                onClick={onOpenNewRequirement}
              >
                + Add First Requirement
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {recentReqs.map((req) => (
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
                    <span className="badge badge-id">{req.id}</span>
                    <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#f8fafc' }}>
                      {req.title}
                    </span>
                  </div>
                  {req.description && (
                    <p
                      style={{
                        fontSize: '12.5px',
                        color: 'var(--text-secondary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {req.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Decisions */}
        <div className="card">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <GitBranch size={17} color="#a78bfa" />
              <h2 style={{ fontSize: '15px', fontWeight: 600 }}>Architecture Decisions</h2>
            </div>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '4px 10px', fontSize: '12px' }}
              onClick={() => onNavigateTab('decisions')}
            >
              View all <ArrowRight size={13} />
            </button>
          </div>

          {recentDecs.length === 0 ? (
            <div className="state-box" style={{ padding: '24px' }}>
              <div className="state-desc">No decisions recorded yet.</div>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ marginTop: '8px' }}
                onClick={onOpenNewDecision}
              >
                + Record First Decision
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {recentDecs.map((dec) => (
                <div
                  key={dec.id}
                  onClick={() => onSelectDecision(dec)}
                  style={{
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s ease',
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.borderColor = 'var(--border-accent)')
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.borderColor = 'var(--border-subtle)')
                  }
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '4px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="badge badge-id">{dec.id}</span>
                      <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#f8fafc' }}>
                        {dec.title}
                      </span>
                    </div>
                    <span className={`badge badge-${dec.status || 'accepted'}`}>{dec.status}</span>
                  </div>
                  <p
                    style={{
                      fontSize: '12.5px',
                      color: 'var(--text-secondary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      marginBottom: '6px',
                    }}
                  >
                    {dec.rationale}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Addresses {dec.requirements?.length || 0} requirement(s)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
