from enum import Enum
from typing import Generic, TypeVar, Literal

from pydantic import BaseModel, Field


class ZoneStatus(str, Enum):
    """Enumeration of physical zone crowd density levels."""
    CLEAR = "clear"
    MODERATE = "moderate"
    BUSY = "busy"
    CONGESTED = "congested"


class IntentType(str, Enum):
    """Enumeration of recognized co-pilot user intents."""
    NAVIGATION = "navigation"
    CROWD_STATUS = "crowd_status"
    RECOMMENDATION = "recommendation"
    GENERAL = "general"


class CrowdSnapshot(BaseModel):
    """A snapshot of live crowd density, queue times, and status in a specific zone."""
    model_config = {"extra": "ignore"}

    zone_id: str
    density: float = Field(ge=0, le=1)
    status: ZoneStatus
    queue_time: int = Field(ge=0)


class Zone(BaseModel):
    """Metadata representing a physical zone or point of interest inside the venue."""
    model_config = {"extra": "ignore"}

    id: str
    label: str
    type: Literal["entrance", "seating", "food", "wc", "medical", "exit"]
    location: tuple[int, int]
    status: ZoneStatus = ZoneStatus.CLEAR


class Route(BaseModel):
    """Calculated path routing between stadium locations."""
    model_config = {"extra": "ignore"}

    id: str
    path: list[str]
    estimated_time: int
    crowd_level: float
    rationale: str


class ChatRequest(BaseModel):
    """Incoming user payload to the co-pilot chat interface."""
    model_config = {"extra": "ignore"}

    message: str = Field(min_length=1, max_length=500)
    language: str = "en"
    current_zone_id: str | None = None
    seat_number: str | None = None
    user_id: str | None = None
    stadium_id: str | None = "metlife"
    accessibility_mode: bool | None = False


class ChatMessage(BaseModel):
    """A single dialogue exchange record between user and co-pilot model."""
    model_config = {"extra": "ignore"}

    id: str
    role: Literal["user", "model"]
    content: str
    timestamp: str
    intent: IntentType
    context_snapshot: list[CrowdSnapshot] = []
    is_fallback: bool = False
    language: str = "en"
    route_id: str | None = None
    response_time: float | None = None
    confidence: float | None = Field(default=None, ge=0, le=1)


class ChatResponse(BaseModel):
    """API payload wrapper returning model response and optional debug metrics."""
    model_config = {"extra": "ignore"}

    message: ChatMessage
    dev_info: dict | None = None


class Alert(BaseModel):
    """Live warning or emergency event active in a specific zone."""
    model_config = {"extra": "ignore"}

    id: str
    level: Literal["warning", "critical"]
    message: str
    zone_id: str


class Recommendation(BaseModel):
    """Context-aware action recommendation for food, toilet, exits, or safety."""
    model_config = {"extra": "ignore"}

    id: str
    type: Literal["food", "restroom", "exit", "safety"]
    message: str
    zone_id: str
    priority: Literal["low", "medium", "high"]


T = TypeVar("T")


class ApiResponse(BaseModel, Generic[T]):
    """Standardized top-level envelope wrapper for all HTTP responses."""
    model_config = {"extra": "ignore"}

    success: bool
    data: T | None = None
    error: str | None = None