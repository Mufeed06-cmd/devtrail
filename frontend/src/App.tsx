import React, { useState, useEffect, useCallback } from 'react'
import { Sidebar } from './components/Sidebar'
import { ProjectOverview } from './components/ProjectOverview'
import { RequirementsView } from './components/RequirementsView'
import { DecisionsView } from './components/DecisionsView'
import { DecisionDetailModal } from './components/DecisionDetailModal'
import { MemoryLookupView } from './components/MemoryLookupView'
import { ProjectModal } from './components/ProjectModal'
import { Toast, type ToastMessage } from './components/Toast'
import * as api from './services/api'
import type {
  Project,
  Requirement,
  Decision,
  ActiveTab,
  ProjectCreate,
  RequirementCreate,
  DecisionCreate,
} from './types'
import { RefreshCw, Database } from 'lucide-react'

export const App: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([])
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  const [requirements, setRequirements] = useState<Requirement[]>([])
  const [decisions, setDecisions] = useState<Decision[]>([])
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview')

  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [dbOnline, setDbOnline] = useState(true)
  const [globalError, setGlobalError] = useState<string | null>(null)

  // Modals & form state
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false)
  const [isReqFormOpen, setIsReqFormOpen] = useState(false)
  const [isDecFormOpen, setIsDecFormOpen] = useState(false)
  const [selectedDecision, setSelectedDecision] = useState<Decision | null>(null)

  // Toast notifications
  const [toast, setToast] = useState<ToastMessage | null>(null)

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({
      id: Math.random().toString(36).substring(2, 9),
      message,
      type,
    })
  }, [])

  // Load project data (requirements + decisions)
  const loadProjectData = useCallback(async (projectName: string) => {
    try {
      setIsLoading(true)
      setGlobalError(null)
      const [reqs, decs] = await Promise.all([
        api.listRequirements(projectName),
        api.listDecisions(projectName),
      ])
      setRequirements(reqs)
      setDecisions(decs)
      setDbOnline(true)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch project data'
      setGlobalError(msg)
      showToast(msg, 'error')
    } finally {
      setIsLoading(false)
    }
  }, [showToast])

  // Load all projects
  const loadProjects = useCallback(async (selectProjectName?: string) => {
    try {
      setIsRefreshing(true)
      const projs = await api.listProjects()
      setProjects(projs)
      setDbOnline(true)

      if (projs.length > 0) {
        let target = projs[0]
        if (selectProjectName) {
          const match = projs.find((p) => p.name === selectProjectName)
          if (match) target = match
        } else if (currentProject) {
          const match = projs.find((p) => p.name === currentProject.name)
          if (match) target = match
        } else {
          // Prefer DevTrail if present
          const devtrail = projs.find((p) => p.name.toLowerCase() === 'devtrail')
          if (devtrail) target = devtrail
        }
        setCurrentProject(target)
        await loadProjectData(target.name)
      } else {
        setCurrentProject(null)
        setRequirements([])
        setDecisions([])
      }
    } catch (err: unknown) {
      setDbOnline(false)
      const msg = err instanceof Error ? err.message : 'Cannot connect to DevTrail backend'
      setGlobalError(msg)
    } finally {
      setIsRefreshing(false)
    }
  }, [currentProject, loadProjectData])

  // Initial load
  useEffect(() => {
    loadProjects()
  }, [])

  // Handle switching projects
  const handleSelectProject = (projectName: string) => {
    const match = projects.find((p) => p.name === projectName)
    if (match) {
      setCurrentProject(match)
      loadProjectData(match.name)
      showToast(`Switched to project "${match.name}"`, 'info')
    }
  }

  // Handle Project Creation
  const handleCreateProject = async (payload: ProjectCreate) => {
    const proj = await api.createOrSelectProject(payload)
    showToast(`Project "${proj.name}" selected in FalkorDB`, 'success')
    await loadProjects(proj.name)
  }

  // Handle Requirement Creation
  const handleCreateRequirement = async (payload: RequirementCreate) => {
    if (!currentProject) return
    const created = await api.createRequirement(currentProject.name, payload)
    showToast(`Requirement "${created.id}" saved in graph`, 'success')
    await loadProjectData(currentProject.name)
  }

  // Handle Decision Creation
  const handleCreateDecision = async (payload: DecisionCreate) => {
    if (!currentProject) return
    const created = await api.createDecision(currentProject.name, payload)
    showToast(`Decision "${created.id}" recorded in graph`, 'success')
    await loadProjectData(currentProject.name)
  }

  // Handle Connecting Requirement to Decision
  const handleConnectRequirement = async (decisionId: string, requirementId: string) => {
    if (!currentProject) return
    const updated = await api.connectDecisionToRequirement(
      currentProject.name,
      decisionId,
      requirementId
    )
    showToast(
      `Linked (:Decision ${decisionId})-[:ADDRESSES]->(:Requirement ${requirementId})`,
      'success'
    )
    setSelectedDecision(updated)
    await loadProjectData(currentProject.name)
  }

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar
        currentProject={currentProject}
        projects={projects}
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab)
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }}
        onSelectProject={handleSelectProject}
        onOpenNewProjectModal={() => setIsProjectModalOpen(true)}
        requirementsCount={requirements.length}
        decisionsCount={decisions.length}
        dbOnline={dbOnline}
      />

      {/* Main Workspace Area */}
      <main className="main-content">
        {/* Top Header */}
        <header className="top-header">
          <div className="header-left">
            <h2 className="header-title">
              {activeTab === 'overview' && 'Project Workspace'}
              {activeTab === 'requirements' && 'Requirements Directory'}
              {activeTab === 'decisions' && 'Architecture Decision Records (ADRs)'}
              {activeTab === 'lookup' && 'Memory Graph Explorer'}
            </h2>
            {currentProject && (
              <span className="header-tag font-mono">
                {currentProject.name}
              </span>
            )}
          </div>

          <div className="header-actions">
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '12.5px' }}
              onClick={() => {
                if (currentProject) loadProjectData(currentProject.name)
                else loadProjects()
              }}
              disabled={isRefreshing || isLoading}
              title="Refresh graph data from backend"
            >
              <RefreshCw
                size={14}
                className={isRefreshing || isLoading ? 'spinner' : ''}
              />
              <span>Sync</span>
            </button>
          </div>
        </header>

        {/* Global Error Banner */}
        {globalError && (
          <div style={{ padding: '16px 28px 0' }}>
            <div className="alert-banner alert-error">
              <span>{globalError}</span>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '2px 8px', fontSize: '11px', marginLeft: 'auto' }}
                onClick={() => loadProjects()}
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Screen Content */}
        <div className="workspace-canvas">
          {projects.length === 0 && !isLoading ? (
            <div className="state-box" style={{ padding: '60px 24px' }}>
              <div className="state-icon">
                <Database size={28} />
              </div>
              <div className="state-title">Welcome to DevTrail</div>
              <div className="state-desc">
                No projects are loaded yet. Create your first project to begin storing persistent
                graph memory in FalkorDB.
              </div>
              <button
                type="button"
                className="btn btn-primary"
                style={{ marginTop: '12px' }}
                onClick={() => setIsProjectModalOpen(true)}
              >
                Create First Project
              </button>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <ProjectOverview
                  project={currentProject}
                  requirements={requirements}
                  decisions={decisions}
                  onNavigateTab={setActiveTab}
                  onOpenNewRequirement={() => {
                    setActiveTab('requirements')
                    setIsReqFormOpen(true)
                  }}
                  onOpenNewDecision={() => {
                    setActiveTab('decisions')
                    setIsDecFormOpen(true)
                  }}
                  onSelectDecision={(dec) => setSelectedDecision(dec)}
                />
              )}

              {activeTab === 'requirements' && (
                <RequirementsView
                  projectName={currentProject?.name || ''}
                  requirements={requirements}
                  decisions={decisions}
                  isLoading={isLoading}
                  isCreateOpen={isReqFormOpen}
                  setIsCreateOpen={setIsReqFormOpen}
                  onCreateRequirement={handleCreateRequirement}
                />
              )}

              {activeTab === 'decisions' && (
                <DecisionsView
                  projectName={currentProject?.name || ''}
                  decisions={decisions}
                  requirements={requirements}
                  isLoading={isLoading}
                  isCreateOpen={isDecFormOpen}
                  setIsCreateOpen={setIsDecFormOpen}
                  onCreateDecision={handleCreateDecision}
                  onSelectDecision={(dec) => setSelectedDecision(dec)}
                />
              )}

              {activeTab === 'lookup' && (
                <MemoryLookupView
                  projectName={currentProject?.name || ''}
                  decisions={decisions}
                  requirements={requirements}
                  onSelectDecision={(dec) => setSelectedDecision(dec)}
                />
              )}
            </>
          )}
        </div>
      </main>

      {/* Decision Details Modal */}
      <DecisionDetailModal
        decision={selectedDecision}
        projectName={currentProject?.name || ''}
        availableRequirements={requirements}
        isOpen={Boolean(selectedDecision)}
        onClose={() => setSelectedDecision(null)}
        onConnectRequirement={handleConnectRequirement}
      />

      {/* New Project Modal */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onSubmit={handleCreateProject}
      />

      {/* Notification Toast */}
      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  )
}

export default App
