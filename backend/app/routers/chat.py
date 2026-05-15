from fastapi import APIRouter, HTTPException

from app import schemas
from app.services.ai_service import generate_chat_answer


router = APIRouter(
    tags=["Chat"]
)


@router.post("/chat", response_model=schemas.ChatResponse)
def chat(request: schemas.ChatRequest):
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="message boş olamaz")

    result = generate_chat_answer(
        message=request.message.strip(),
        current_page=request.current_page,
        context=request.context or {}
    )

    return result
