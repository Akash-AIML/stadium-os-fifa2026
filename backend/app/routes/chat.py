from fastapi import APIRouter, HTTPException
from app.models import ChatRequest, ChatResponse, ApiResponse
from app.routes.chat import handle_chat

router = APIRouter()


@router.post("/", response_model=ApiResponse[ChatResponse])
async def chat_endpoint(request: ChatRequest):
    try:
        result = await handle_chat(request)
        return result
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")