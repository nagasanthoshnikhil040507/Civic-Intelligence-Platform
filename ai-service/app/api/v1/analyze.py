from fastapi import APIRouter
from pydantic import BaseModel
from typing import List

router = APIRouter()

class AnalyzeRequest(BaseModel):
    complaintId: str
    imageUrls: List[str]

@router.post("/analyze")
async def analyze_complaint(request: AnalyzeRequest):
    # Do NOT perform ML inference yet.
    # Return a structured realistic mock response exactly matching the future schema.
    return {
        "categoryPrediction": "Infrastructure Damage",
        "confidence": 0.95,
        "severity": 85,
        "roadDamage": "Severe Pothole",
        "garbageDetected": False,
        "sentiment": "Frustrated",
        "recommendations": [
            "Dispatch rapid response team for road repair",
            "Place warning signs immediately",
            "Monitor area for secondary damage"
        ],
        "processingStatus": "completed"
    }
