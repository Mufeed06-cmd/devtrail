export interface Project {
  name: string
  description: string | null
  created_at: string | null
}

export interface ProjectCreate {
  name: string
  description?: string
}

export interface Requirement {
  id: string
  title: string
  description: string | null
  created_at: string | null
}

export interface RequirementCreate {
  id?: string
  title: string
  description?: string
}

export interface Decision {
  id: string
  title: string
  rationale: string
  status: string
  created_at: string | null
  requirements: Requirement[]
}

export interface DecisionCreate {
  id?: string
  title: string
  rationale: string
  status?: string
  requirement_id?: string
}

export type ActiveTab = 'overview' | 'requirements' | 'decisions' | 'lookup'
