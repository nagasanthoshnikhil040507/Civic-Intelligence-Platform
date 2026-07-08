from fastapi import APIRouter
from app.schemas.common import HealthResponse

router = APIRouter()

@router.get("/health", response_model=HealthResponse)
def health_check():
    return {
        "status": "ok", 
        "service": "AI Service",
        "version": "1.0"
    }
