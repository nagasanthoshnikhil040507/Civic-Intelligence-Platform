from typing import Dict, Any, Optional
from datetime import datetime, timezone

from app.utils.logger import logger
from app.services.model_loader import model_loader

class SeverityPredictionPipeline:
    """
    Severity Prediction Pipeline.
    Responsible for evaluating the severity of a classified complaint.
    Takes the output of the ImageClassificationPipeline as input.
    """
    
    def __init__(self, model_name: str = "severity_prediction"):
        self.model_name = model_name

    def calculate_severity(self, classification_result: Dict[str, Any]) -> Dict[str, Any]:
        """
        Executes severity model inference.
        If the model is not trained/available, returns SEVERITY_MODEL_NOT_AVAILABLE.
        
        Args:
            classification_result (Dict[str, Any]): Validated classification result.
            
        Returns:
            Dict[str, Any]: The raw severity inference output.
        """
        status = classification_result.get("processingStatus")
        
        # Propagate upstream failures or missing models
        if status != "completed":
            logger.info(f"Skipping severity prediction due to upstream status: {status}")
            return {
                "processingStatus": status,
                "message": classification_result.get("message", "Upstream pipeline not completed.")
            }

        try:
            logger.info(f"Running severity inference using rule-based engine...")
            
            category = classification_result.get("categoryPrediction", "")
            confidence = classification_result.get("confidence", 0.0)
            is_duplicate = classification_result.get("duplicateDetected", False)
            
            # Configurable decision rules
            severity = "low"
            if category == "water_leakage":
                severity = "critical"
            elif category == "road_damage":
                severity = "high"
            elif category == "garbage":
                severity = "medium"
            elif category == "street_light":
                severity = "low"
                
            # If a duplicate is detected or similarity is high, log it for future NLP model tuning
            if is_duplicate:
                logger.info("Duplicate complaint detected; applying standard severity regardless.")
            
            return {
                "processingStatus": "completed",
                "severity": severity,
                "message": "Severity predicted using rule-based engine."
            }
        except Exception as e:
            logger.error(f"Severity inference error: {e}")
            return {
                "processingStatus": "FAILED",
                "message": str(e)
            }

    def run(self, classification_result: Dict[str, Any]) -> Dict[str, Any]:
        """
        Executes the entire severity prediction pipeline.
        
        Args:
            classification_result (Dict[str, Any]): The output from the image classification pipeline.
            
        Returns:
            Dict[str, Any]: The enriched analysis result matching the schema.
        """
        if not isinstance(classification_result, dict):
            logger.error("Invalid input: classification_result must be a dictionary.")
            raise ValueError("Input to severity prediction must be a dictionary.")

        try:
            # 1. Calculate severity status
            inference_result = self.calculate_severity(classification_result)
            
            # 2. Merge results retaining aiAnalysis compatibility
            merged = classification_result.copy()
            merged["processingStatus"] = inference_result.get("processingStatus", classification_result.get("processingStatus"))
            
            if "severity" in inference_result:
                merged["severity"] = inference_result["severity"]
            
            new_msg = inference_result.get("message")
            if new_msg:
                merged["message"] = new_msg
                
            merged["analyzedAt"] = datetime.now(timezone.utc).isoformat()
            
            logger.info(f"Severity pipeline complete. Status: {merged['processingStatus']}")
            return merged
            
        except Exception as e:
            logger.error(f"Severity pipeline execution failed: {e}")
            result = classification_result.copy() if isinstance(classification_result, dict) else {}
            result["processingStatus"] = "FAILED"
            result["message"] = str(e)
            result["analyzedAt"] = datetime.now(timezone.utc).isoformat()
            return result
