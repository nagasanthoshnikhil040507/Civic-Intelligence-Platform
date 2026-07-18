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
from app.config.settings import get_settings
settings = get_settings()

duplicate_pipeline = DuplicateComplaintDetectionPipeline(db_uri=settings.MONGODB_URI, db_name=settings.DB_NAME)

@router.post("/analyze")
async def analyze_complaint(request: AnalyzeRequest, raw_request: Request):
    from app.utils.logger import complaint_id_ctx_var
    import traceback
    
    complaint_id_ctx_var.set(request.complaintId)
    logger.info(f"--- ENTER STAGE: Analyze Endpoint ---")
    logger.info(f"Input request.imageUrls: {request.imageUrls}")
    
    latitude, longitude = None, None
    try:
        body = await raw_request.json()
        latitude = body.get("latitude")
        longitude = body.get("longitude")
        logger.info(f"Input latitude: {latitude}, longitude: {longitude}")
    except Exception as e:
        logger.error(f"Failed to read raw JSON for lat/long: {e}\n{traceback.format_exc()}")
        pass
        
    start_time = time.time()
    
    if not request.imageUrls or len(request.imageUrls) == 0:
        logger.warning("No images provided for analysis.")
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
    
    logger.info(f"Resolved main image path: {image_path}")
    
    import asyncio
    
    # 1. Image Classification
    logger.info(f"--- ENTER STAGE: Image Classification ---")
    t0 = time.time()
    try:
        classification_result = await asyncio.to_thread(classification_pipeline.run, image_path)
        logger.info(f"Output Image Classification: {classification_result}")
    except Exception as e:
        logger.error(f"EXCEPTION in Image Classification: {e}\n{traceback.format_exc()}")
        classification_result = {"processingStatus": "FAILED", "message": str(e)}
    logger.info(f"--- COMPLETE STAGE: Image Classification ({time.time()-t0:.2f}s) ---")
    
    # 2. Severity Prediction
    logger.info(f"--- ENTER STAGE: Severity Prediction ---")
    t0 = time.time()
    try:
        severity_result = await asyncio.to_thread(severity_pipeline.run, classification_result)
        logger.info(f"Output Severity Prediction: {severity_result}")
    except Exception as e:
        logger.error(f"EXCEPTION in Severity Prediction: {e}\n{traceback.format_exc()}")
        severity_result = {"processingStatus": "FAILED", "message": str(e)}
    logger.info(f"--- COMPLETE STAGE: Severity Prediction ({time.time()-t0:.2f}s) ---")
    
    # 3. Priority Prediction
    logger.info(f"--- ENTER STAGE: Priority Prediction ---")
    t0 = time.time()
    try:
        priority_result = await asyncio.to_thread(priority_pipeline.run, severity_result)
        logger.info(f"Output Priority Prediction: {priority_result}")
    except Exception as e:
        logger.error(f"EXCEPTION in Priority Prediction: {e}\n{traceback.format_exc()}")
        priority_result = {"processingStatus": "FAILED", "message": str(e)}
    logger.info(f"--- COMPLETE STAGE: Priority Prediction ({time.time()-t0:.2f}s) ---")
    
    # 4. Department Recommendation
    logger.info(f"--- ENTER STAGE: Department Recommendation ---")
    t0 = time.time()
    try:
        final_result = await asyncio.to_thread(department_pipeline.run, priority_result)
        logger.info(f"Output Department Recommendation: {final_result}")
    except Exception as e:
        logger.error(f"EXCEPTION in Department Recommendation: {e}\n{traceback.format_exc()}")
        final_result = {"processingStatus": "FAILED", "message": str(e)}
    logger.info(f"--- COMPLETE STAGE: Department Recommendation ({time.time()-t0:.2f}s) ---")
    
    # 5. Duplicate Complaint Detection
    logger.info(f"--- ENTER STAGE: Duplicate Detection ---")
    t0 = time.time()
    if latitude is None or longitude is None or not image_path or final_result.get("processingStatus") != "completed":
        logger.info("Skipping duplicate detection due to missing geo data or earlier pipeline failure.")
        duplicate_result = {
            "duplicateDetected": False,
            "matchedComplaintId": None,
            "similarity": 0
        }
    else:
        try:
            duplicate_result = await asyncio.to_thread(duplicate_pipeline.run, request.imageUrls, float(latitude), float(longitude), request.complaintId)
            logger.info(f"Output Duplicate Detection: {duplicate_result}")
        except Exception as e:
            logger.error(f"EXCEPTION in Duplicate Detection: {e}\n{traceback.format_exc()}")
            duplicate_result = {
                "duplicateDetected": False,
                "matchedComplaintId": None,
                "similarity": 0
            }
    logger.info(f"--- COMPLETE STAGE: Duplicate Detection ({time.time()-t0:.2f}s) ---")
    
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
        
    logger.info(f"Final AI API Response: {response}")
    return response
