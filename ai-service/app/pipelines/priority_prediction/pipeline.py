from typing import Dict, Any
from datetime import datetime, timezone

from app.utils.logger import logger
from app.services.model_loader import model_loader

class PriorityPredictionPipeline:
    """
    Priority Prediction Pipeline.
    Responsible for evaluating the priority (e.g., low, medium, high, critical) of a complaint.
    Consumes the enriched output of the SeverityPredictionPipeline.
    """
    
    def __init__(self, model_name: str = "priority_prediction"):
        self.model_name = model_name

    def calculate_priority(self, severity_result: Dict[str, Any]) -> Dict[str, Any]:
        """
        Executes priority model inference.
        If the model is not trained/available, returns PRIORITY_MODEL_NOT_AVAILABLE.
        
        Args:
            severity_result (Dict[str, Any]): Validated result from upstream pipelines.
            
        Returns:
            Dict[str, Any]: The raw priority inference output.
        """
        status = severity_result.get("processingStatus")
        
        # Propagate upstream failures or missing models
        if status in ["FAILED", "MODEL_NOT_AVAILABLE", "SEVERITY_MODEL_NOT_AVAILABLE"]:
            logger.info(f"Skipping priority prediction due to upstream status: {status}")
            return {
                "processingStatus": status,
                "message": severity_result.get("message", "Upstream pipeline failed or model missing.")
            }

        # Check if Priority model exists
        model = model_loader.get_model(self.model_name)
        
        if model is None:
            logger.warning(f"Priority model '{self.model_name}' is not available.")
            return {
                "processingStatus": "PRIORITY_MODEL_NOT_AVAILABLE",
                "message": "Priority TensorFlow model has not been trained yet."
            }

        try:
            logger.info(f"Running priority inference using model '{self.model_name}'...")
            
            # STRICT RULE: Do NOT call TensorFlow predict().
            # STRICT RULE: Do NOT perform inference.
            
            return {
                "processingStatus": "INFERENCE_NOT_IMPLEMENTED",
                "message": "Model is loaded, but priority inference logic is strictly disabled in this phase."
            }
        except Exception as e:
            logger.error(f"Priority inference error: {e}")
            return {
                "processingStatus": "FAILED",
                "message": str(e)
            }

    def run(self, severity_result: Dict[str, Any]) -> Dict[str, Any]:
        """
        Executes the entire priority prediction pipeline.
        
        Args:
            severity_result (Dict[str, Any]): The output from the severity prediction pipeline.
            
        Returns:
            Dict[str, Any]: The enriched analysis result matching the aiAnalysis schema.
        """
        if not isinstance(severity_result, dict):
            logger.error("Invalid input: severity_result must be a dictionary.")
            raise ValueError("Input to priority prediction must be a dictionary.")

        try:
            # 1. Calculate priority status
            inference_result = self.calculate_priority(severity_result)
            
            # 2. Merge results retaining aiAnalysis compatibility
            merged = severity_result.copy()
            merged["processingStatus"] = inference_result.get("processingStatus", "FAILED")
            
            new_msg = inference_result.get("message")
            if new_msg:
                merged["message"] = new_msg
                
            merged["analyzedAt"] = datetime.now(timezone.utc).isoformat()
            
            logger.info(f"Priority pipeline complete. Status: {merged['processingStatus']}")
            return merged
            
        except Exception as e:
            logger.error(f"Priority pipeline execution failed: {e}")
            result = severity_result.copy() if isinstance(severity_result, dict) else {}
            result["processingStatus"] = "FAILED"
            result["message"] = str(e)
            result["analyzedAt"] = datetime.now(timezone.utc).isoformat()
            return result
