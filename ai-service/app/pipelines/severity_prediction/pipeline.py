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
        
        # If upstream failed or didn't have a model, skip calculation
        if status in ["FAILED", "MODEL_NOT_AVAILABLE"]:
            logger.info(f"Skipping severity prediction due to upstream status: {status}")
            return {
                "processingStatus": status,
                "message": classification_result.get("message", "Upstream pipeline failed.")
            }

        model = model_loader.get_model(self.model_name)
        
        if model is None:
            logger.warning(f"Severity model '{self.model_name}' is not available.")
            return {
                "processingStatus": "SEVERITY_MODEL_NOT_AVAILABLE",
                "message": "Severity TensorFlow model has not been trained yet."
            }

        try:
            logger.info(f"Running severity inference using model '{self.model_name}'...")
            
            # STRICT RULE: Do NOT call TensorFlow predict().
            # STRICT RULE: Do NOT perform inference.
            # When ready, this block will evaluate the image/features:
            # severity = model.predict(...)
            
            return {
                "processingStatus": "INFERENCE_NOT_IMPLEMENTED",
                "message": "Model is loaded, but severity inference logic is strictly disabled in this phase."
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
            merged["processingStatus"] = inference_result.get("processingStatus", "FAILED")
            
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
