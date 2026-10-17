import React, { useState } from 'react'
import {
  Database,
  LayoutDashboard,
  CheckSquare,
  GitBranch,
  Search,
  ChevronDown,
  Plus,
  Server,
  Layers,
} from 'lucide-react'
import type { ActiveTab, Project } from '../types'

interface SidebarProps {
  currentProject: Project | null
  projects: Project[]
  activeTab: ActiveTab
  onSelectTab: (tab: ActiveTab) => void
  onSelectProject: (projectName: string) => void
  onOpenNewProjectModal: () => void
  requirementsCount: number
  decisionsCount: number
  dbOnline: boolean
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentProject,
  projects,
  activeTab,
  onSelectTab,
  onSelectProject,
  onOpenNewProjectModal,
  requirementsCount,
  decisionsCount,
  dbOnline,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false)

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-header">
        <div className="logo-container">
          <div className="logo-badge">
            <Layers size={18} strokeWidth={2.5} />
          </div>
          <div>
            <div className="logo-text">DevTrail</div>
            <div className="logo-sub">Graph Memory</div>
          </div>
        </div>

        {/* Project Selector */}
        <div className="project-selector-wrapper">
          <button
            type="button"
            className="project-selector-btn"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            title="Switch project"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
              <Database size={15} color="#60a5fa" />
              <span
                style={{
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '160px',
                }}
              >
                {currentProject ? currentProject.name : 'Select Project...'}
              </span>
            </div>
            <ChevronDown size={14} color="#94a3b8" />
          </button>

          {dropdownOpen && (
            <div className="project-dropdown-menu">
              <div
                style={{
                  padding: '4px 8px',
                  fontSize: '10.5px',
                  textTransform: 'uppercase',
                  color: '#64748b',
                  letterSpacing: '0.05em',
                  fontWeight: 600,
                }}
              >
                Available Projects
              </div>
              {projects.length === 0 ? (
                <div style={{ padding: '8px 10px', fontSize: '12px', color: '#94a3b8' }}>
                  No projects found
                </div>
              ) : (
                projects.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    className={`dropdown-item ${currentProject?.name === p.name ? 'active' : ''}`}
                    onClick={() => {
                      onSelectProject(p.name)
                      setDropdownOpen(false)
                    }}
                  >
                    <span>{p.name}</span>
                    {currentProject?.name === p.name && (
                      <span style={{ fontSize: '11px', color: '#60a5fa' }}>●</span>
                    )}
                  </button>
                ))
              )}
              <div className="dropdown-divider" />
              <button
                type="button"
                className="dropdown-item dropdown-create-btn"
                onClick={() => {
                  setDropdownOpen(false)
                  onOpenNewProjectModal()
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Plus size={14} /> Create or Select Project
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <button
          type="button"
          className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => onSelectTab('overview')}
        >
          <div className="nav-link-left">
            <LayoutDashboard size={17} />
            <span>Overview</span>
          </div>
        </button>

        <button
          type="button"
          className={`nav-link ${activeTab === 'requirements' ? 'active' : ''}`}
          onClick={() => onSelectTab('requirements')}
        >
          <div className="nav-link-left">
            <CheckSquare size={17} />
            <span>Requirements</span>
          </div>
          <span className="nav-badge">{requirementsCount}</span>
        </button>

        <button
          type="button"
          className={`nav-link ${activeTab === 'decisions' ? 'active' : ''}`}
          onClick={() => onSelectTab('decisions')}
        >
          <div className="nav-link-left">
            <GitBranch size={17} />
            <span>Decisions</span>
          </div>
          <span className="nav-badge">{decisionsCount}</span>
        </button>

        <button
          type="button"
          className={`nav-link ${activeTab === 'lookup' ? 'active' : ''}`}
          onClick={() => onSelectTab('lookup')}
        >
          <div className="nav-link-left">
            <Search size={17} />
            <span>Memory Lookup</span>
          </div>
        </button>
      </nav>

      {/* Footer / Database Status */}
      <div className="sidebar-footer">
        <div className="db-status-pill">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span className={`status-dot ${dbOnline ? 'online' : 'offline'}`} />
            <span>FalkorDB Graph</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Server size={12} color="#64748b" />
            <span className="font-mono" style={{ fontSize: '11px' }}>
              :6379
            </span>
          </div>
        </div>
      </div>
    </aside>
  )
}
