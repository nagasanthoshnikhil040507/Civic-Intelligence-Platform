from typing import Dict, Any, Optional
from datetime import datetime, timezone

from app.utils.logger import logger

class SeverityPredictionPipeline:
    def __init__(self, model_name: str = "severity_prediction"):
        self.model_name = model_name

    def calculate_severity(self, classification_result: Dict[str, Any], duplicate_result: Dict[str, Any]) -> Dict[str, Any]:
        status = classification_result.get("processingStatus")
        if status != "completed":
            return {
                "processingStatus": status,
                "message": "Upstream classification not completed."
            }

        try:
            quantity = classification_result.get("garbageQuantity", 2)
            # Use dynamic confidence from duplicate pipeline if available, else classification confidence
            confidence = duplicate_result.get("confidenceScore") or (classification_result.get("confidence", 0.0) * 100.0)
            
            report_count = duplicate_result.get("reportCount", 1)
            age_hours = duplicate_result.get("complaintAgeHours", 0.0)
            
            logger.info(f"Severity Inputs -> Qty: {quantity}, Conf: {confidence}, Reports: {report_count}, Age: {age_hours}h")

            # Base severity from quantity
            severity_levels = ["low", "low", "medium", "high"]
            base_idx = min(max(quantity, 1), 3) # ensure 1 to 3
            severity = severity_levels[base_idx]
            
            # Boost logic
            boosts = 0
            if report_count >= 3:
                boosts += 1
            if report_count >= 10:
                boosts += 1
            if age_hours > 72: # Older than 3 days
                boosts += 1
            if confidence > 95:
                boosts += 1
                
            # Apply boosts
            levels = ["low", "medium", "high", "critical"]
            current_idx = levels.index(severity)
            final_idx = min(current_idx + boosts, 3)
            final_severity = levels[final_idx]

            return {
                "processingStatus": "completed",
                "severity": final_severity,
                "message": "Severity calculated dynamically."
            }
        except Exception as e:
            logger.error(f"Severity calculation error: {e}")
            return {
                "processingStatus": "FAILED",
                "message": str(e)
            }

    def run(self, classification_result: Dict[str, Any], duplicate_result: Dict[str, Any]) -> Dict[str, Any]:
        try:
            inference_result = self.calculate_severity(classification_result, duplicate_result)
            
            merged = classification_result.copy()
            merged["processingStatus"] = inference_result.get("processingStatus", "FAILED")
            
            if "severity" in inference_result:
                merged["severity"] = inference_result["severity"]
            
            if "message" in inference_result:
                merged["message"] = inference_result["message"]
                
            merged["analyzedAt"] = datetime.now(timezone.utc).isoformat()
            
            return merged
        except Exception as e:
            logger.error(f"Severity pipeline execution failed: {e}")
            result = classification_result.copy() if isinstance(classification_result, dict) else {}
            result["processingStatus"] = "FAILED"
            result["message"] = str(e)
            result["analyzedAt"] = datetime.now(timezone.utc).isoformat()
            return result
