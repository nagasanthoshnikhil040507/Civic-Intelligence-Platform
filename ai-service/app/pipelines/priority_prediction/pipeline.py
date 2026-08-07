from typing import Dict, Any
from datetime import datetime, timezone

from app.utils.logger import logger

class PriorityPredictionPipeline:
    def __init__(self, model_name: str = "priority_prediction"):
        self.model_name = model_name

    def calculate_priority(self, severity_result: Dict[str, Any], duplicate_result: Dict[str, Any]) -> Dict[str, Any]:
        status = severity_result.get("processingStatus")
        if status != "completed":
            return {
                "processingStatus": status,
                "message": "Upstream severity not completed."
            }

        try:
            # 1. Base Score from Severity (0-40 points)
            severity = severity_result.get("severity", "low")
            if severity == "critical":
                score = 40
            elif severity == "high":
                score = 30
            elif severity == "medium":
                score = 20
            else:
                score = 10
                
            # 2. Confidence Score (0-20 points)
            conf = duplicate_result.get("confidenceScore") or (severity_result.get("confidence", 0.0) * 100.0)
            score += (conf / 100.0) * 20
            
            # 3. Report Count (0-25 points)
            report_count = duplicate_result.get("reportCount", 1)
            score += min((report_count - 1) * 5, 25)
            
            # 4. Complaint Age (0-15 points)
            age_hours = duplicate_result.get("complaintAgeHours", 0.0)
            score += min((age_hours / 24.0) * 5, 15)

            final_priority = min(max(round(score), 0), 100)
            logger.info(f"Priority Calculation -> Sev: {severity}, Conf: {conf}, Rep: {report_count}, Age: {age_hours}h => Score: {final_priority}")

            return {
                "processingStatus": "completed",
                "priority": final_priority,
                "message": "Priority calculated dynamically."
            }
        except Exception as e:
            logger.error(f"Priority inference error: {e}")
            return {
                "processingStatus": "FAILED",
                "message": str(e)
            }

    def run(self, severity_result: Dict[str, Any], duplicate_result: Dict[str, Any]) -> Dict[str, Any]:
        try:
            inference_result = self.calculate_priority(severity_result, duplicate_result)
            
            merged = severity_result.copy()
            merged["processingStatus"] = inference_result.get("processingStatus", "FAILED")
            
            if "priority" in inference_result:
                merged["priority"] = inference_result["priority"]
            
            if "message" in inference_result:
                merged["message"] = inference_result["message"]
                
            merged["analyzedAt"] = datetime.now(timezone.utc).isoformat()
            
            return merged
        except Exception as e:
            logger.error(f"Priority pipeline execution failed: {e}")
            result = severity_result.copy() if isinstance(severity_result, dict) else {}
            result["processingStatus"] = "FAILED"
            result["message"] = str(e)
            result["analyzedAt"] = datetime.now(timezone.utc).isoformat()
            return result
