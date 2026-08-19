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
from app.pipelines.duplicate_detection.pipeline import DuplicateComplaintDetectionPipeline
from app.pipelines.summarization.pipeline import SummarizationPipeline

router = APIRouter()

class AnalyzeRequest(BaseModel):
    complaintId: str
    imageUrls: List[str]

# Global singletons for the router
classification_pipeline = ImageClassificationPipeline(model_name="civic_classifier")
severity_pipeline = SeverityPredictionPipeline(model_name="severity_prediction")
priority_pipeline = PriorityPredictionPipeline(model_name="priority_prediction")
summary_pipeline = SummarizationPipeline()

from app.config.settings import get_settings
settings = get_settings()

duplicate_pipeline = DuplicateComplaintDetectionPipeline(db_uri=settings.MONGODB_URI, db_name=settings.DB_NAME)

@router.post("/analyze")
async def analyze_complaint(request: AnalyzeRequest, raw_request: Request):
    from app.utils.logger import complaint_id_ctx_var
    import traceback
    import asyncio
    
    complaint_id_ctx_var.set(request.complaintId)
    logger.info(f"--- ENTER STAGE: Analyze Endpoint (Phase 3) ---")
    logger.info(f"Input request.imageUrls: {request.imageUrls}")
    
    latitude, longitude, description = None, None, ""
    try:
        body = await raw_request.json()
        latitude = body.get("latitude")
        latitude = body.get("latitude")
        longitude = body.get("longitude")
        description = body.get("description", "")
        title = body.get("title", "")
        category = body.get("category", "")
        logger.info(f"Input lat: {latitude}, lon: {longitude}, desc length: {len(description)}")
    except Exception as e:
        logger.error(f"Failed to read raw JSON for lat/lon/desc: {e}")
        
    start_time = time.time()
    
    if not request.imageUrls or len(request.imageUrls) == 0:
        return {"processingStatus": "FAILED", "message": "No images provided for analysis."}
        
    image_path = request.imageUrls[0]
    if image_path.startswith("/uploads/"):
        base_dir = Path(__file__).resolve().parent.parent.parent.parent.parent
        image_path = str(base_dir / "server" / "public" / image_path.lstrip("/"))
    elif image_path.startswith("uploads/"):
        base_dir = Path(__file__).resolve().parent.parent.parent.parent.parent
        image_path = str(base_dir / "server" / "public" / image_path)
    
    # 1. Duplicate Complaint Detection (Moved to FIRST stage)
    logger.info(f"--- STAGE 1: Duplicate Detection ---")
    t0 = time.time()
    duplicate_result = {
        "duplicateDetected": False, "matchedComplaintId": None, "similarity": 0, 
        "reportCount": 1, "complaintAgeHours": 0.0, "confidenceScore": 0.0
    }
    if latitude is not None and longitude is not None and image_path:
        try:
            # If complaintId is "temp_pre_submit", we pass it to avoid self-match logic errors, but it won't match anyway.
            duplicate_result = await asyncio.to_thread(duplicate_pipeline.run, request.imageUrls, float(latitude), float(longitude), request.complaintId, description)
            logger.info(f"Output Duplicate Detection: {duplicate_result}")
        except Exception as e:
            logger.error(f"EXCEPTION in Duplicate Detection: {e}\n{traceback.format_exc()}")
    logger.info(f"--- COMPLETE STAGE 1 ({time.time()-t0:.2f}s) ---")
    
    # 2. Image Classification (Garbage / No Garbage, Quantity)
    logger.info(f"--- STAGE 2: Garbage Detection ---")
    t0 = time.time()
    try:
        classification_result = await asyncio.to_thread(classification_pipeline.run, image_path)
        logger.info(f"Output Classification: {classification_result}")
    except Exception as e:
        logger.error(f"EXCEPTION in Classification: {e}\n{traceback.format_exc()}")
        classification_result = {"processingStatus": "FAILED", "message": str(e)}
    logger.info(f"--- COMPLETE STAGE 2 ({time.time()-t0:.2f}s) ---")
    
    # 3. Severity Prediction (Dynamic based on Quantity, Conf, Age, Report Count)
    logger.info(f"--- STAGE 3: Dynamic Severity ---")
    t0 = time.time()
    try:
        severity_result = await asyncio.to_thread(severity_pipeline.run, classification_result, duplicate_result)
        logger.info(f"Output Severity: {severity_result}")
    except Exception as e:
        logger.error(f"EXCEPTION in Severity: {e}\n{traceback.format_exc()}")
        severity_result = {"processingStatus": "FAILED", "message": str(e)}
    logger.info(f"--- COMPLETE STAGE 3 ({time.time()-t0:.2f}s) ---")
    
    # 4. Priority Prediction (Dynamic based on Sev, Conf, Age, Report Count)
    logger.info(f"--- STAGE 4: Dynamic Priority ---")
    t0 = time.time()
    try:
        final_result = await asyncio.to_thread(priority_pipeline.run, severity_result, duplicate_result)
        logger.info(f"Output Priority: {final_result}")
    except Exception as e:
        logger.error(f"EXCEPTION in Priority: {e}\n{traceback.format_exc()}")
        final_result = {"processingStatus": "FAILED", "message": str(e)}
    logger.info(f"--- COMPLETE STAGE 4 ({time.time()-t0:.2f}s) ---")
    
    # 5. Department Recommendation (Static as requested)
    logger.info(f"--- STAGE 5: Department (Static) ---")
    final_result["departmentRecommendation"] = "Sanitation Department"
    
    # 6. Summarization
    logger.info(f"--- STAGE 6: Summarization ---")
    t0 = time.time()
    try:
        summary_result = summary_pipeline.run(title=title, description=description, category=final_result.get("categoryPrediction", category))
        logger.info(f"Output Summary: {summary_result}")
    except Exception as e:
        logger.error(f"EXCEPTION in Summary: {e}\n{traceback.format_exc()}")
        summary_result = "Summary generation failed."
    logger.info(f"--- COMPLETE STAGE 6 ({time.time()-t0:.2f}s) ---")
    
    end_time = time.time()
    total_time_ms = (end_time - start_time) * 1000
    
    response = {
        "processingStatus": final_result.get("processingStatus", "FAILED"),
        "analyzedAt": final_result.get("analyzedAt"),
        "message": final_result.get("message", ""),
        "totalInferenceTimeMs": round(total_time_ms, 2)
    }
    
    if "categoryPrediction" in final_result:
        response["categoryPrediction"] = final_result["categoryPrediction"]
    if "garbageQuantity" in final_result:
        response["garbageQuantity"] = final_result["garbageQuantity"]
    if duplicate_result.get("confidenceScore"):
        response["confidence"] = duplicate_result["confidenceScore"]
    elif "confidence" in final_result:
        response["confidence"] = final_result["confidence"] * 100.0 # Standardize to 0-100
        
    if "severity" in final_result:
        response["severity"] = final_result["severity"]
    if "priority" in final_result:
        response["priority"] = final_result["priority"] # Now 0-100 numeric
    if "departmentRecommendation" in final_result:
        response["departmentRecommendation"] = final_result["departmentRecommendation"]
        
    response["duplicateDetected"] = duplicate_result.get("duplicateDetected", False)
    response["matchedComplaintId"] = duplicate_result.get("matchedComplaintId", None)
    response["similarity"] = duplicate_result.get("similarity", 0)
    response["summary"] = summary_result
        
    logger.info(f"Final AI API Response: {response}")
    return response
