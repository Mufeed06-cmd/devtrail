from datetime import datetime, timezone
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator


def get_current_iso_timestamp() -> str:
    return datetime.now(timezone.utc).isoformat()


class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Unique name of the project")
    description: Optional[str] = Field(None, max_length=1000, description="Optional project description")

    @field_validator("name")
    @classmethod
    def strip_and_validate_name(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("Project name cannot be empty or whitespace only")
        return stripped


class ProjectResponse(BaseModel):
    name: str
    description: Optional[str] = None
    created_at: Optional[str] = None


class RequirementCreate(BaseModel):
    id: Optional[str] = Field(None, max_length=100, description="Optional unique identifier (e.g. REQ-1)")
    title: str = Field(..., min_length=1, max_length=200, description="Title of the requirement")
    description: Optional[str] = Field(None, max_length=2000, description="Description of the requirement")

    @field_validator("title")
    @classmethod
    def strip_and_validate_title(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("Requirement title cannot be empty or whitespace only")
        return stripped


class RequirementResponse(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    created_at: Optional[str] = None


class DecisionCreate(BaseModel):
    id: Optional[str] = Field(None, max_length=100, description="Optional unique identifier (e.g. DEC-1)")
    title: str = Field(..., min_length=1, max_length=200, description="Decision title")
    rationale: str = Field(..., min_length=1, max_length=4000, description="Rationale for the decision")
    status: Optional[str] = Field("accepted", max_length=50, description="Status (e.g. proposed, accepted, deprecated)")
    requirement_id: Optional[str] = Field(None, description="Optional requirement ID to connect immediately")

    @field_validator("title", "rationale")
    @classmethod
    def strip_and_validate_non_empty(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("Field cannot be empty or whitespace only")
        return stripped


class DecisionResponse(BaseModel):
    id: str
    title: str
    rationale: str
    status: str
    created_at: Optional[str] = None


class DecisionWithRequirementsResponse(BaseModel):
    id: str
    title: str
    rationale: str
    status: str
    created_at: Optional[str] = None
    requirements: List[RequirementResponse] = Field(default_factory=list)
