from __future__ import annotations

import secrets
from typing import Annotated

from fastapi import Depends, FastAPI, Header, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.orm import Session

from .config import settings
from .database import Base, engine, get_db
from .models import Application, Review
from .rate_limit import enforce_rate_limit
from .schemas import (
    ApplicationCreate,
    ApplicationOut,
    MessageOut,
    ReviewCreate,
    ReviewOut,
    ReviewPublic,
)

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Valeru Portfolio API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

DbDep = Annotated[Session, Depends(get_db)]


def require_admin(x_admin_key: Annotated[str | None, Header()] = None) -> None:
    if not x_admin_key or not secrets.compare_digest(x_admin_key, settings.admin_key):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing admin key",
        )


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post(
    "/api/applications",
    response_model=MessageOut,
    status_code=status.HTTP_201_CREATED,
)
def create_application(
    payload: ApplicationCreate,
    request: Request,
    db: DbDep,
) -> MessageOut:
    enforce_rate_limit(request)
    row = Application(
        name=payload.name,
        contact=payload.contact,
        kind=payload.kind.value,
        message=payload.message,
    )
    db.add(row)
    db.commit()
    return MessageOut(detail="Application received")


@app.get(
    "/api/applications",
    response_model=list[ApplicationOut],
    dependencies=[Depends(require_admin)],
)
def list_applications(db: DbDep) -> list[Application]:
    stmt = select(Application).order_by(Application.created_at.desc())
    return list(db.scalars(stmt).all())


@app.post(
    "/api/reviews",
    response_model=MessageOut,
    status_code=status.HTTP_201_CREATED,
)
def create_review(
    payload: ReviewCreate,
    request: Request,
    db: DbDep,
) -> MessageOut:
    enforce_rate_limit(request)
    row = Review(
        name=payload.name,
        text=payload.text,
        rating=payload.rating,
        status="pending",
    )
    db.add(row)
    db.commit()
    return MessageOut(detail="Review submitted for moderation")


@app.get("/api/reviews", response_model=list[ReviewPublic])
def list_approved_reviews(db: DbDep) -> list[Review]:
    stmt = (
        select(Review)
        .where(Review.status == "approved")
        .order_by(Review.created_at.desc())
    )
    return list(db.scalars(stmt).all())


@app.patch(
    "/api/reviews/{review_id}/approve",
    response_model=ReviewOut,
    dependencies=[Depends(require_admin)],
)
def approve_review(review_id: int, db: DbDep) -> Review:
    row = db.get(Review, review_id)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")
    row.status = "approved"
    db.commit()
    db.refresh(row)
    return row


@app.delete(
    "/api/reviews/{review_id}",
    response_model=MessageOut,
    dependencies=[Depends(require_admin)],
)
def delete_review(review_id: int, db: DbDep) -> MessageOut:
    row = db.get(Review, review_id)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")
    db.delete(row)
    db.commit()
    return MessageOut(detail="Review deleted")
