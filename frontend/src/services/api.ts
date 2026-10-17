import type {
  Project,
  ProjectCreate,
  Requirement,
  RequirementCreate,
  Decision,
  DecisionCreate,
} from '../types'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers || {}),
  }

  try {
    const response = await fetch(url, { ...options, headers })

    if (!response.ok) {
      let errorMessage = `Request failed with status ${response.status}`
      try {
        const errorData = await response.json()
        if (typeof errorData.detail === 'string') {
          errorMessage = errorData.detail
        } else if (Array.isArray(errorData.detail)) {
          // Pydantic validation error list
          errorMessage = errorData.detail.map((d: { msg?: string }) => d.msg || JSON.stringify(d)).join(', ')
        } else if (errorData.message) {
          errorMessage = errorData.message
        }
      } catch {
        // Fallback to text status
      }
      throw new ApiError(errorMessage, response.status)
    }

    return (await response.json()) as T
  } catch (err: unknown) {
    if (err instanceof ApiError) {
      throw err
    }
    const message = err instanceof Error ? err.message : 'Network connection failed'
    throw new ApiError(`Backend connection error: ${message}`, 0)
  }
}

// ---------------------------------------------------------------------------
// Project Service
// ---------------------------------------------------------------------------

export async function listProjects(): Promise<Project[]> {
  return request<Project[]>('/projects')
}

export async function getProject(projectName: string): Promise<Project> {
  return request<Project>(`/projects/${encodeURIComponent(projectName)}`)
}

export async function createOrSelectProject(payload: ProjectCreate): Promise<Project> {
  return request<Project>('/projects', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

// ---------------------------------------------------------------------------
// Requirement Service
// ---------------------------------------------------------------------------

export async function listRequirements(projectName: string): Promise<Requirement[]> {
  return request<Requirement[]>(`/projects/${encodeURIComponent(projectName)}/requirements`)
}

export async function getRequirement(
  projectName: string,
  requirementId: string
): Promise<Requirement> {
  return request<Requirement>(
    `/projects/${encodeURIComponent(projectName)}/requirements/${encodeURIComponent(requirementId)}`
  )
}

export async function createRequirement(
  projectName: string,
  payload: RequirementCreate
): Promise<Requirement> {
  return request<Requirement>(`/projects/${encodeURIComponent(projectName)}/requirements`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

// ---------------------------------------------------------------------------
// Decision Service
// ---------------------------------------------------------------------------

export async function listDecisions(projectName: string): Promise<Decision[]> {
  return request<Decision[]>(`/projects/${encodeURIComponent(projectName)}/decisions`)
}

export async function getDecision(
  projectName: string,
  decisionId: string
): Promise<Decision> {
  return request<Decision>(
    `/projects/${encodeURIComponent(projectName)}/decisions/${encodeURIComponent(decisionId)}`
  )
}

export async function createDecision(
  projectName: string,
  payload: DecisionCreate
): Promise<Decision> {
  return request<Decision>(`/projects/${encodeURIComponent(projectName)}/decisions`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function connectDecisionToRequirement(
  projectName: string,
  decisionId: string,
  requirementId: string
): Promise<Decision> {
  return request<Decision>(
    `/projects/${encodeURIComponent(projectName)}/decisions/${encodeURIComponent(
      decisionId
    )}/requirements/${encodeURIComponent(requirementId)}`,
    {
      method: 'POST',
    }
  )
}

// ---------------------------------------------------------------------------
// Database / Health Service
// ---------------------------------------------------------------------------

export async function checkBackendHealth(): Promise<{ message: string }> {
  return request<{ message: string }>('/')
}
