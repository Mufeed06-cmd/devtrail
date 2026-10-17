import re
from typing import List, Optional
from falkordb import Graph
from models import (
    ProjectResponse,
    RequirementResponse,
    DecisionWithRequirementsResponse,
    get_current_iso_timestamp,
)


class ProjectNotFoundError(Exception):
    pass


class RequirementNotFoundError(Exception):
    pass


class DecisionNotFoundError(Exception):
    pass


def slugify(text: str) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9]+", "-", text.strip().lower()).strip("-")
    return cleaned if cleaned else "item"


def create_or_select_project(
    graph: Graph, name: str, description: Optional[str] = None
) -> ProjectResponse:
    now = get_current_iso_timestamp()
    query = """
    MERGE (p:Project {name: $name})
    ON CREATE SET 
        p.description = $description,
        p.created_at = $created_at
    ON MATCH SET 
        p.description = CASE WHEN $description IS NOT NULL AND $description <> '' THEN $description ELSE p.description END,
        p.created_at = CASE WHEN p.created_at IS NULL THEN $created_at ELSE p.created_at END
    RETURN p.name AS name, p.description AS description, p.created_at AS created_at
    """
    params = {"name": name, "description": description or "", "created_at": now}
    result = graph.query(query, params)
    row = result.result_set[0]
    return ProjectResponse(name=row[0], description=row[1] if row[1] else None, created_at=row[2])


def get_project(graph: Graph, name: str) -> Optional[ProjectResponse]:
    query = """
    MATCH (p:Project {name: $name})
    RETURN p.name AS name, p.description AS description, p.created_at AS created_at
    LIMIT 1
    """
    result = graph.query(query, {"name": name})
    if not result.result_set:
        return None
    row = result.result_set[0]
    return ProjectResponse(name=row[0], description=row[1] if row[1] else None, created_at=row[2])


def list_projects(graph: Graph) -> List[ProjectResponse]:
    query = """
    MATCH (p:Project)
    RETURN DISTINCT p.name AS name, p.description AS description, p.created_at AS created_at
    ORDER BY p.name ASC
    """
    result = graph.query(query)
    return [
        ProjectResponse(name=row[0], description=row[1] if row[1] else None, created_at=row[2])
        for row in result.result_set
    ]


def create_or_select_requirement(
    graph: Graph,
    project_name: str,
    title: str,
    description: Optional[str] = None,
    req_id: Optional[str] = None,
) -> RequirementResponse:
    if not get_project(graph, project_name):
        raise ProjectNotFoundError(f"Project '{project_name}' does not exist.")

    effective_id = req_id.strip() if req_id and req_id.strip() else f"req-{slugify(title)}"
    now = get_current_iso_timestamp()

    query = """
    MATCH (p:Project {name: $project_name})
    MERGE (r:Requirement {id: $req_id})
    ON CREATE SET 
        r.title = $title,
        r.description = $description,
        r.created_at = $created_at
    ON MATCH SET 
        r.title = $title,
        r.description = CASE WHEN $description IS NOT NULL AND $description <> '' THEN $description ELSE r.description END
    MERGE (p)-[:HAS_REQUIREMENT]->(r)
    RETURN r.id AS id, r.title AS title, r.description AS description, r.created_at AS created_at
    """
    params = {
        "project_name": project_name,
        "req_id": effective_id,
        "title": title,
        "description": description or "",
        "created_at": now,
    }
    result = graph.query(query, params)
    row = result.result_set[0]
    return RequirementResponse(
        id=row[0],
        title=row[1],
        description=row[2] if row[2] else None,
        created_at=row[3],
    )


def get_requirement(graph: Graph, project_name: str, req_id: str) -> Optional[RequirementResponse]:
    query = """
    MATCH (p:Project {name: $project_name})-[:HAS_REQUIREMENT]->(r:Requirement {id: $req_id})
    RETURN r.id AS id, r.title AS title, r.description AS description, r.created_at AS created_at
    LIMIT 1
    """
    result = graph.query(query, {"project_name": project_name, "req_id": req_id})
    if not result.result_set:
        return None
    row = result.result_set[0]
    return RequirementResponse(
        id=row[0],
        title=row[1],
        description=row[2] if row[2] else None,
        created_at=row[3],
    )


def list_requirements(graph: Graph, project_name: str) -> List[RequirementResponse]:
    if not get_project(graph, project_name):
        raise ProjectNotFoundError(f"Project '{project_name}' does not exist.")

    query = """
    MATCH (p:Project {name: $project_name})-[:HAS_REQUIREMENT]->(r:Requirement)
    RETURN r.id AS id, r.title AS title, r.description AS description, r.created_at AS created_at
    ORDER BY r.created_at ASC
    """
    result = graph.query(query, {"project_name": project_name})
    return [
        RequirementResponse(
            id=row[0],
            title=row[1],
            description=row[2] if row[2] else None,
            created_at=row[3],
        )
        for row in result.result_set
    ]


def _parse_requirements_list(raw_reqs: list) -> List[RequirementResponse]:
    requirements = []
    for r in raw_reqs:
        if r is not None and hasattr(r, "properties"):
            props = r.properties
            requirements.append(
                RequirementResponse(
                    id=props.get("id", ""),
                    title=props.get("title", ""),
                    description=props.get("description") or None,
                    created_at=props.get("created_at"),
                )
            )
    return requirements


def create_or_select_decision(
    graph: Graph,
    project_name: str,
    title: str,
    rationale: str,
    status: str = "accepted",
    dec_id: Optional[str] = None,
    requirement_id: Optional[str] = None,
) -> DecisionWithRequirementsResponse:
    if not get_project(graph, project_name):
        raise ProjectNotFoundError(f"Project '{project_name}' does not exist.")

    if requirement_id:
        req = get_requirement(graph, project_name, requirement_id)
        if not req:
            raise RequirementNotFoundError(
                f"Requirement '{requirement_id}' does not exist in project '{project_name}'."
            )

    effective_id = dec_id.strip() if dec_id and dec_id.strip() else f"dec-{slugify(title)}"
    now = get_current_iso_timestamp()

    query = """
    MATCH (p:Project {name: $project_name})
    MERGE (d:Decision {id: $dec_id})
    ON CREATE SET 
        d.title = $title,
        d.rationale = $rationale,
        d.status = $status,
        d.created_at = $created_at
    ON MATCH SET 
        d.title = $title,
        d.rationale = $rationale,
        d.status = $status
    MERGE (p)-[:HAS_DECISION]->(d)
    RETURN d.id
    """
    params = {
        "project_name": project_name,
        "dec_id": effective_id,
        "title": title,
        "rationale": rationale,
        "status": status,
        "created_at": now,
    }
    graph.query(query, params)

    if requirement_id:
        link_query = """
        MATCH (p:Project {name: $project_name})
        MATCH (p)-[:HAS_DECISION]->(d:Decision {id: $dec_id})
        MATCH (p)-[:HAS_REQUIREMENT]->(r:Requirement {id: $req_id})
        MERGE (d)-[rel:ADDRESSES]->(r)
        ON CREATE SET rel.created_at = $created_at
        """
        graph.query(
            link_query,
            {
                "project_name": project_name,
                "dec_id": effective_id,
                "req_id": requirement_id,
                "created_at": now,
            },
        )

    decision = get_decision(graph, project_name, effective_id)
    if not decision:
        raise DecisionNotFoundError(f"Failed to retrieve created decision '{effective_id}'.")
    return decision


def connect_decision_to_requirement(
    graph: Graph, project_name: str, decision_id: str, requirement_id: str
) -> DecisionWithRequirementsResponse:
    if not get_project(graph, project_name):
        raise ProjectNotFoundError(f"Project '{project_name}' does not exist.")

    decision = get_decision(graph, project_name, decision_id)
    if not decision:
        raise DecisionNotFoundError(
            f"Decision '{decision_id}' does not exist in project '{project_name}'."
        )

    requirement = get_requirement(graph, project_name, requirement_id)
    if not requirement:
        raise RequirementNotFoundError(
            f"Requirement '{requirement_id}' does not exist in project '{project_name}'."
        )

    now = get_current_iso_timestamp()
    link_query = """
    MATCH (p:Project {name: $project_name})
    MATCH (p)-[:HAS_DECISION]->(d:Decision {id: $dec_id})
    MATCH (p)-[:HAS_REQUIREMENT]->(r:Requirement {id: $req_id})
    MERGE (d)-[rel:ADDRESSES]->(r)
    ON CREATE SET rel.created_at = $created_at
    RETURN d.id
    """
    graph.query(
        link_query,
        {
            "project_name": project_name,
            "dec_id": decision_id,
            "req_id": requirement_id,
            "created_at": now,
        },
    )

    return get_decision(graph, project_name, decision_id)


def get_decision(
    graph: Graph, project_name: str, decision_id: str
) -> Optional[DecisionWithRequirementsResponse]:
    query = """
    MATCH (p:Project {name: $project_name})-[:HAS_DECISION]->(d:Decision {id: $dec_id})
    OPTIONAL MATCH (d)-[:ADDRESSES]->(r:Requirement)
    RETURN d.id AS id,
           d.title AS title,
           d.rationale AS rationale,
           d.status AS status,
           d.created_at AS created_at,
           collect(r) AS requirements
    LIMIT 1
    """
    result = graph.query(query, {"project_name": project_name, "dec_id": decision_id})
    if not result.result_set:
        return None
    row = result.result_set[0]
    reqs = _parse_requirements_list(row[5])
    return DecisionWithRequirementsResponse(
        id=row[0],
        title=row[1],
        rationale=row[2],
        status=row[3],
        created_at=row[4],
        requirements=reqs,
    )


def list_decisions(
    graph: Graph, project_name: str
) -> List[DecisionWithRequirementsResponse]:
    if not get_project(graph, project_name):
        raise ProjectNotFoundError(f"Project '{project_name}' does not exist.")

    query = """
    MATCH (p:Project {name: $project_name})-[:HAS_DECISION]->(d:Decision)
    OPTIONAL MATCH (d)-[:ADDRESSES]->(r:Requirement)
    RETURN d.id AS id,
           d.title AS title,
           d.rationale AS rationale,
           d.status AS status,
           d.created_at AS created_at,
           collect(r) AS requirements
    ORDER BY d.created_at ASC
    """
    result = graph.query(query, {"project_name": project_name})
    decisions = []
    for row in result.result_set:
        reqs = _parse_requirements_list(row[5])
        decisions.append(
            DecisionWithRequirementsResponse(
                id=row[0],
                title=row[1],
                rationale=row[2],
                status=row[3],
                created_at=row[4],
                requirements=reqs,
            )
        )
    return decisions
