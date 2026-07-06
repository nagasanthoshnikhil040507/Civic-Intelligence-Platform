from fastapi import APIRouter
from app.model_registry.registry import registry

router = APIRouter()

@router.get("/health")
def health_check():
    return {"status": "ok", "service": "ai-engine"}

@router.get("/readiness")
def readiness_check():
    return {
        "status": "ready",
        "models_status": registry.get_status()
    }
