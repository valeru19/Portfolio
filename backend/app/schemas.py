from __future__ import annotations

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ApplicationKind(str, Enum):
    job = "job"
    order = "order"


class ApplicationCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    contact: str = Field(min_length=3, max_length=200)
    kind: ApplicationKind
    message: str = Field(min_length=10, max_length=2000)

    @field_validator("name", "contact", "message")
    @classmethod
    def strip_text(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Field cannot be empty")
        return cleaned


class ApplicationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    contact: str
    kind: ApplicationKind
    message: str
    created_at: datetime


class ReviewCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    text: str = Field(min_length=10, max_length=2000)
    rating: int = Field(ge=1, le=5)

    @field_validator("name", "text")
    @classmethod
    def strip_text(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Field cannot be empty")
        return cleaned


class ReviewOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    text: str
    rating: int
    status: str
    created_at: datetime


class ReviewPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    text: str
    rating: int
    created_at: datetime


class MessageOut(BaseModel):
    detail: str
