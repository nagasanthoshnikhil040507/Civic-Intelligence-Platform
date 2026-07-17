from fastapi import APIRouter, Request
from pydantic import BaseModel
from typing import List
import time
import os
from pathlib import Path

from app.utils.logger import logger
from app.pipelines.image_classification.classifier import ImageClassificationPipeline
from app.pipelines.severity_prediction.pipeline import SeverityPredictionPipeline
from app.pipelines.priority_prediction.pipeline import PriorityPredictionPipeline
from app.pipelines.department_recommendation.pipeline import DepartmentRecommendationPipeline
from app.pipelines.duplicate_detection.pipeline import DuplicateComplaintDetectionPipeline

router = APIRouter()

class AnalyzeRequest(BaseModel):
    complaintId: str
    imageUrls: List[str]

# Global singletons for the router
classification_pipeline = ImageClassificationPipeline(model_name="civic_classifier")
severity_pipeline = SeverityPredictionPipeline(model_name="severity_prediction")
priority_pipeline = PriorityPredictionPipeline(model_name="priority_prediction")
department_pipeline = DepartmentRecommendationPipeline()
duplicate_pipeline = DuplicateComplaintDetectionPipeline()

@router.post("/analyze")
async def analyze_complaint(request: AnalyzeRequest, raw_request: Request):
    logger.info(f"Received analysis request for complaint {request.complaintId}")
    
    latitude, longitude = None, None
    try:
        body = await raw_request.json()
        latitude = body.get("latitude")
        longitude = body.get("longitude")
    except Exception:
        pass
    start_time = time.time()
    
    if not request.imageUrls or len(request.imageUrls) == 0:
        logger.warning(f"No images provided for complaint {request.complaintId}")
        return {
            "processingStatus": "FAILED",
            "message": "No images provided for analysis."
        }
        
    image_path = request.imageUrls[0]
    
    # Path resolution for Express uploads
    if image_path.startswith("/uploads/"):
        base_dir = Path(__file__).resolve().parent.parent.parent.parent.parent
        image_path = str(base_dir / "server" / "public" / image_path.lstrip("/"))
    elif image_path.startswith("uploads/"):
        base_dir = Path(__file__).resolve().parent.parent.parent.parent.parent
        image_path = str(base_dir / "server" / "public" / image_path)
    
    # 1. Image Classification
    classification_result = classification_pipeline.run(image_path)
    
    # 2. Severity Prediction
    severity_result = severity_pipeline.run(classification_result)
    
    # 3. Priority Prediction
    priority_result = priority_pipeline.run(severity_result)
    
    # 4. Department Recommendation
    final_result = department_pipeline.run(priority_result)
    
    # 5. Duplicate Complaint Detection
    if latitude is None or longitude is None or not image_path or final_result.get("processingStatus") != "completed":
        duplicate_result = {
            "duplicateDetected": False,
            "matchedComplaintId": None,
            "similarity": 0
        }
    else:
        try:
            duplicate_result = duplicate_pipeline.run(image_path, float(latitude), float(longitude))
        except Exception as e:
            logger.error(f"Duplicate pipeline execution failed: {e}")
            duplicate_result = {
                "duplicateDetected": False,
                "matchedComplaintId": None,
                "similarity": 0
            }
    
    end_time = time.time()
    total_time_ms = (end_time - start_time) * 1000
    logger.info(f"End-to-end analysis for {request.complaintId} completed in {total_time_ms:.2f} ms")
    
    response = {
        "processingStatus": final_result.get("processingStatus", "FAILED"),
        "analyzedAt": final_result.get("analyzedAt"),
        "message": final_result.get("message", ""),
        "totalInferenceTimeMs": round(total_time_ms, 2)
    }
    
    # Add dynamically generated properties if available
    if "categoryPrediction" in final_result:
        response["categoryPrediction"] = final_result["categoryPrediction"]
    if "confidence" in final_result:
        response["confidence"] = final_result["confidence"]
    if "severity" in final_result:
        response["severity"] = final_result["severity"]
    if "priority" in final_result:
        response["priority"] = final_result["priority"]
    if "departmentRecommendation" in final_result:
        response["departmentRecommendation"] = final_result["departmentRecommendation"]
    if "inferenceTimeMs" in final_result:
        response["inferenceTimeMs"] = final_result["inferenceTimeMs"]
        
    response["duplicateDetected"] = duplicate_result.get("duplicateDetected", False)
    response["matchedComplaintId"] = duplicate_result.get("matchedComplaintId", None)
    response["similarity"] = duplicate_result.get("similarity", 0)
        
    return response
