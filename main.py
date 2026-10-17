from typing import List
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from falkordb import FalkorDB

import graph_service
from models import (
    ProjectCreate,
    ProjectResponse,
    RequirementCreate,
    RequirementResponse,
    DecisionCreate,
    DecisionWithRequirementsResponse,
)

app = FastAPI(
    title="DevTrail API",
    description="Persistent graph-memory system for AI-assisted software development, powered by FalkorDB.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

db = FalkorDB(host="localhost", port=6379)
graph = db.select_graph("DevTrail")


@app.get("/")
def home():
    return {"message": "DevTrail backend is running!"}


@app.get("/test-db")
def test_db():
    result = graph.query("""
        CREATE (p:Project {name: 'DevTrail'})
        RETURN p.name
    """)

    return {"database_result": result.result_set}


# ---------------------------------------------------------------------------
# Project Endpoints
# ---------------------------------------------------------------------------


@app.post(
    "/projects",
    response_model=ProjectResponse,
    status_code=status.HTTP_200_OK,
    summary="Create or select a project",
)
def create_or_select_project_endpoint(payload: ProjectCreate):
    try:
        return graph_service.create_or_select_project(
            graph=graph,
            name=payload.name,
            description=payload.description,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error while creating/selecting project: {exc}",
        )


@app.get(
    "/projects",
    response_model=List[ProjectResponse],
    summary="List all projects",
)
def list_projects_endpoint():
    try:
        return graph_service.list_projects(graph=graph)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error while listing projects: {exc}",
        )


@app.get(
    "/projects/{project_name}",
    response_model=ProjectResponse,
    summary="Get project by name",
)
def get_project_endpoint(project_name: str):
    project = graph_service.get_project(graph=graph, name=project_name)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project '{project_name}' not found.",
        )
    return project


# ---------------------------------------------------------------------------
# Requirement Endpoints
# ---------------------------------------------------------------------------


@app.post(
    "/projects/{project_name}/requirements",
    response_model=RequirementResponse,
    status_code=status.HTTP_200_OK,
    summary="Create or select a requirement for a project",
)
def create_requirement_endpoint(project_name: str, payload: RequirementCreate):
    try:
        return graph_service.create_or_select_requirement(
            graph=graph,
            project_name=project_name,
            title=payload.title,
            description=payload.description,
            req_id=payload.id,
        )
    except graph_service.ProjectNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error while saving requirement: {exc}",
        )


@app.get(
    "/projects/{project_name}/requirements",
    response_model=List[RequirementResponse],
    summary="List all requirements for a project",
)
def list_requirements_endpoint(project_name: str):
    try:
        return graph_service.list_requirements(graph=graph, project_name=project_name)
    except graph_service.ProjectNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error while listing requirements: {exc}",
        )


@app.get(
    "/projects/{project_name}/requirements/{requirement_id}",
    response_model=RequirementResponse,
    summary="Get a requirement by ID",
)
def get_requirement_endpoint(project_name: str, requirement_id: str):
    try:
        req = graph_service.get_requirement(
            graph=graph, project_name=project_name, req_id=requirement_id
        )
        if not req:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Requirement '{requirement_id}' not found in project '{project_name}'.",
            )
        return req
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error while fetching requirement: {exc}",
        )


# ---------------------------------------------------------------------------
# Decision Endpoints
# ---------------------------------------------------------------------------


@app.post(
    "/projects/{project_name}/decisions",
    response_model=DecisionWithRequirementsResponse,
    status_code=status.HTTP_200_OK,
    summary="Store a decision with title, rationale, and optional requirement link",
)
def create_decision_endpoint(project_name: str, payload: DecisionCreate):
    try:
        return graph_service.create_or_select_decision(
            graph=graph,
            project_name=project_name,
            title=payload.title,
            rationale=payload.rationale,
            status=payload.status or "accepted",
            dec_id=payload.id,
            requirement_id=payload.requirement_id,
        )
    except graph_service.ProjectNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except graph_service.RequirementNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error while creating decision: {exc}",
        )


@app.post(
    "/projects/{project_name}/decisions/{decision_id}/requirements/{requirement_id}",
    response_model=DecisionWithRequirementsResponse,
    summary="Connect a decision to a requirement",
)
def connect_decision_requirement_endpoint(
    project_name: str, decision_id: str, requirement_id: str
):
    try:
        return graph_service.connect_decision_to_requirement(
            graph=graph,
            project_name=project_name,
            decision_id=decision_id,
            requirement_id=requirement_id,
        )
    except (
        graph_service.ProjectNotFoundError,
        graph_service.DecisionNotFoundError,
        graph_service.RequirementNotFoundError,
    ) as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error while connecting decision to requirement: {exc}",
        )


@app.get(
    "/projects/{project_name}/decisions/{decision_id}",
    response_model=DecisionWithRequirementsResponse,
    summary="Retrieve a decision and its associated requirements",
)
def get_decision_endpoint(project_name: str, decision_id: str):
    try:
        # Check project exists
        project = graph_service.get_project(graph=graph, name=project_name)
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Project '{project_name}' not found.",
            )

        decision = graph_service.get_decision(
            graph=graph, project_name=project_name, decision_id=decision_id
        )
        if not decision:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Decision '{decision_id}' not found in project '{project_name}'.",
            )
        return decision
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error while retrieving decision: {exc}",
        )


@app.get(
    "/projects/{project_name}/decisions",
    response_model=List[DecisionWithRequirementsResponse],
    summary="List all decisions with their associated requirements for a project",
)
def list_decisions_endpoint(project_name: str):
    try:
        return graph_service.list_decisions(graph=graph, project_name=project_name)
    except graph_service.ProjectNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error while listing decisions: {exc}",
        )
