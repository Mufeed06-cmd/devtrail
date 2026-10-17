import React, { useState } from 'react'
import {
  Search,
  Sparkles,
  GitBranch,
  CheckSquare,
  Link as LinkIcon,
  Code2,
  Terminal,
  ChevronRight,
} from 'lucide-react'
import type { Decision, Requirement } from '../types'

interface MemoryLookupViewProps {
  projectName: string
  decisions: Decision[]
  requirements: Requirement[]
  onSelectDecision: (decision: Decision) => void
}

export const MemoryLookupView: React.FC<MemoryLookupViewProps> = ({
  projectName,
  decisions,
  requirements,
  onSelectDecision,
}) => {
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'decisions' | 'requirements'>('all')
  const [showRawJson, setShowRawJson] = useState<string | null>(null)

  const normalizedQuery = query.toLowerCase().trim()

  // Filter matching decisions
  const matchingDecisions = decisions.filter((d) => {
    if (!normalizedQuery) return true
    return (
      d.id.toLowerCase().includes(normalizedQuery) ||
      d.title.toLowerCase().includes(normalizedQuery) ||
      d.rationale.toLowerCase().includes(normalizedQuery) ||
      d.status.toLowerCase().includes(normalizedQuery) ||
      (d.requirements &&
        d.requirements.some(
          (r) =>
            r.id.toLowerCase().includes(normalizedQuery) ||
            r.title.toLowerCase().includes(normalizedQuery)
        ))
    )
  })

  // Filter matching requirements
  const matchingRequirements = requirements.filter((r) => {
    if (!normalizedQuery) return true
    return (
      r.id.toLowerCase().includes(normalizedQuery) ||
      r.title.toLowerCase().includes(normalizedQuery) ||
      (r.description && r.description.toLowerCase().includes(normalizedQuery))
    )
  })

  const totalResults =
    (typeFilter !== 'requirements' ? matchingDecisions.length : 0) +
    (typeFilter !== 'decisions' ? matchingRequirements.length : 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={20} color="#60a5fa" />
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#fff' }}>
            Graph Memory Lookup
          </h1>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
          Retrieve stored architectural memory, decisions, and requirement relationships for{' '}
          <span className="font-mono" style={{ color: '#60a5fa' }}>
            {projectName}
          </span>
          .
        </p>
      </div>

      {/* Search Input Box */}
      <div
        className="card"
        style={{
          background: 'var(--bg-surface-elevated)',
          border: '1px solid var(--border-accent)',
          padding: '16px 20px',
        }}
      >
        <div style={{ position: 'relative', marginBottom: '12px' }}>
          <Search
            size={18}
            color="#60a5fa"
            style={{ position: 'absolute', left: '14px', top: '13px' }}
          />
          <input
            type="text"
            className="form-input"
            style={{
              paddingLeft: '42px',
              height: '44px',
              fontSize: '14px',
              background: 'var(--bg-canvas)',
              borderColor: 'var(--border-accent)',
            }}
            placeholder="Search memory graph (e.g. 'FalkorDB', 'Offline', 'DEC-1', 'Auth', 'Cache')..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </div>

        {/* Quick Filter Tags */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Filter type:</span>
            {(['all', 'decisions', 'requirements'] as const).map((type) => (
              <button
                key={type}
                type="button"
                className="btn btn-secondary"
                style={{
                  padding: '4px 10px',
                  fontSize: '12px',
                  textTransform: 'capitalize',
                  background:
                    typeFilter === type ? 'var(--bg-surface-hover)' : 'var(--bg-canvas)',
                  borderColor: typeFilter === type ? 'var(--accent-blue)' : 'var(--border-subtle)',
                  color: typeFilter === type ? '#60a5fa' : 'var(--text-secondary)',
                }}
                onClick={() => setTypeFilter(type)}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Quick Query Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Quick tags:</span>
            {['sqlite', 'offline', 'cypher', 'accepted', 'storage'].map((tag) => (
              <button
                key={tag}
                type="button"
                style={{
                  background: 'rgba(59, 130, 246, 0.08)',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  color: '#93c5fd',
                  borderRadius: '6px',
                  padding: '2px 8px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-mono)',
                }}
                onClick={() => setQuery(tag)}
              >
                #{tag}
              </button>
            ))}
            {query && (
              <button
                type="button"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '11px',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  marginLeft: '4px',
                }}
                onClick={() => setQuery('')}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '12.5px',
          color: 'var(--text-muted)',
          padding: '0 4px',
        }}
      >
        <span>
          Found <strong style={{ color: '#fff' }}>{totalResults}</strong> graph memory record(s)
          {query ? ` matching "${query}"` : ''}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Terminal size={12} />
          <span>FalkorDB Cypher traversal</span>
        </span>
      </div>

      {/* Results List */}
      {totalResults === 0 ? (
        <div className="state-box">
          <div className="state-icon">
            <Search size={24} />
          </div>
          <div className="state-title">No graph memories matched your query</div>
          <div className="state-desc">
            Try a broader keyword or add decisions and requirements to the project.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Decisions Section */}
          {typeFilter !== 'requirements' &&
            matchingDecisions.map((dec) => (
              <div
                key={dec.id}
                className="card"
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  padding: '18px 20px',
                }}
              >
                {/* Header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="badge badge-id">
                      <GitBranch size={11} style={{ marginRight: '4px' }} />
                      {dec.id}
                    </span>
                    <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#f8fafc' }}>
                      {dec.title}
                    </h3>
                  </div>
                  <span className={`badge badge-${dec.status || 'accepted'}`}>{dec.status}</span>
                </div>

                {/* Graph Trace Visualization */}
                <div
                  style={{
                    background: 'var(--bg-canvas)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    margin: '10px 0',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11.5px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    overflowX: 'auto',
                  }}
                >
                  <span style={{ color: '#60a5fa' }}>(:Project &quot;{projectName}&quot;)</span>
                  <span style={{ color: '#64748b' }}>-[:HAS_DECISION]-&gt;</span>
                  <span style={{ color: '#a78bfa' }}>(:Decision &quot;{dec.id}&quot;)</span>
                  {dec.requirements && dec.requirements.length > 0 && (
                    <>
                      <span style={{ color: '#34d399' }}>-[:ADDRESSES]-&gt;</span>
                      <span style={{ color: '#34d399' }}>
                        (:Requirement &quot;{dec.requirements.map((r) => r.id).join(', ')}&quot;)
                      </span>
                    </>
                  )}
                </div>

                {/* Rationale Excerpt */}
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {dec.rationale}
                </p>

                {/* Connected Requirements Chips */}
                {dec.requirements && dec.requirements.length > 0 && (
                  <div
                    style={{
                      marginTop: '12px',
                      paddingTop: '10px',
                      borderTop: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <LinkIcon size={12} color="#34d399" />
                      Connected Requirement(s):
                    </span>
                    {dec.requirements.map((req) => (
                      <span key={req.id} className="badge badge-req-id" style={{ fontSize: '11px' }}>
                        {req.id}: {req.title}
                      </span>
                    ))}
                  </div>
                )}

                {/* Actions Footer */}
                <div
                  style={{
                    marginTop: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <button
                    type="button"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#64748b',
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                    onClick={() =>
                      setShowRawJson(showRawJson === dec.id ? null : dec.id)
                    }
                  >
                    <Code2 size={13} />
                    <span>{showRawJson === dec.id ? 'Hide JSON' : 'Inspect JSON Payload'}</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: '4px 10px', fontSize: '12px' }}
                    onClick={() => onSelectDecision(dec)}
                  >
                    Full Details <ChevronRight size={13} />
                  </button>
                </div>

                {/* Raw JSON Accordion */}
                {showRawJson === dec.id && (
                  <pre
                    style={{
                      marginTop: '10px',
                      background: '#090d14',
                      border: '1px solid var(--border-accent)',
                      borderRadius: '6px',
                      padding: '12px',
                      fontSize: '11.5px',
                      fontFamily: 'var(--font-mono)',
                      color: '#a78bfa',
                      overflowX: 'auto',
                    }}
                  >
                    {JSON.stringify(dec, null, 2)}
                  </pre>
                )}
              </div>
            ))}

          {/* Standalone Requirements Section */}
          {typeFilter !== 'decisions' &&
            matchingRequirements.map((req) => (
              <div
                key={req.id}
                className="card"
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  padding: '16px 20px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '6px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="badge badge-req-id">
                      <CheckSquare size={11} style={{ marginRight: '4px' }} />
                      {req.id}
                    </span>
                    <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#f8fafc' }}>
                      {req.title}
                    </h3>
                  </div>
                </div>

                {req.description && (
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {req.description}
                  </p>
                )}

                <div
                  style={{
                    background: 'var(--bg-canvas)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                    padding: '6px 10px',
                    marginTop: '10px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    color: '#93c5fd',
                  }}
                >
                  (:Project &quot;{projectName}&quot;)-[:HAS_REQUIREMENT]-&gt;(:Requirement &quot;{req.id}&quot;)
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
