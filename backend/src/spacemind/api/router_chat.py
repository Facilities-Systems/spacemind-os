"""
SpaceMind OS — AI Concierge Chat Router
POST /api/v1/chat — stateless conversation endpoint (JWT auth).
Client sends full message history; server returns next assistant reply.
"""
from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from spacemind.api.auth import get_current_user
from spacemind.core.exceptions import AIError
from spacemind.domain.models import User
from spacemind.services.chat_service import ChatService
from spacemind.storage.database import get_db

router = APIRouter(prefix="/api/v1/chat", tags=["Concierge Chat"])


class ChatMessage(BaseModel):
    role: str = Field(..., pattern="^(user|assistant)$")
    content: str = Field(..., min_length=1)


class ChatRequest(BaseModel):
    messages: List[ChatMessage] = Field(..., min_length=1)


class ChatResponse(BaseModel):
    reply: str


@router.post("", response_model=ChatResponse, summary="AI Concierge — stateless chat with live FM context")
def chat(
    body: ChatRequest,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> ChatResponse:
    messages = [{"role": m.role, "content": m.content} for m in body.messages]
    try:
        reply = ChatService(db).chat(messages)
    except AIError as e:
        raise HTTPException(status_code=503, detail=str(e.message))
    return ChatResponse(reply=reply)
