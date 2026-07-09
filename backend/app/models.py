from __future__ import annotations

from enum import Enum
from typing import Generic, TypeVar

from pydantic import BaseModel, Field


class ZoneStatus(str, Enum):
    CLEAR = "clear"
    MODERATE = "moderate"
    BUSY = "busy"
    CONGESTED = "congested"


class IntentType(str, Enum):
    NAVIGATION = "navigation"
    CROWD_STATUS = "crowd_status"
    RECOMMENDATION = "recommendation"
    GENERAL = "general"


class CrowdSnapshot(BaseModel):
    zone_id: str
    density: float = Field(ge=0, le=1)
    status: ZoneStatus
    queue_time: int = Field(ge=0)


class Zone(BaseModel):
    id: str
    label: str
    type: str  # entrance, seating, food, wc, medical, exit
    location: tuple[int, int]
    status: ZoneStatus = ZoneStatus.CLEAR


class Route(BaseModel):
    id: str
    path: list[str]
    estimated_time: int
    crowd_level: float
    rationale: str


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=500)
    language: str = "en"
    current_zone_id: str | None = None
    seat_number: str | None = None
    user_id: str | None = None
    stadium_id: str | None = "metlife"
    accessibility_mode: bool | None = False


class ChatMessage(BaseModel):
    id: str
    role: str  # user / model
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
    message: ChatMessage
    dev_info: dict | None = None


class Alert(BaseModel):
    id: str
    level: str  # warning / critical
    message: str
    zone_id: str


class Recommendation(BaseModel):
    id: str
    type: str  # food, restroom, exit, safety
    message: str
    zone_id: str
    priority: str  # low, medium, high


T = TypeVar("T")


class ApiResponse(BaseModel, Generic[T]):
    success: bool
    data: T | None = None
    error: str | None = None