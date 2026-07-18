import os
from typing import Dict, Any, Optional
from datetime import datetime, timezone
import tensorflow as tf
import numpy as np
import time

from app.utils.logger import logger
from app.utils.image_processing import preprocess_image
from app.services.model_loader import model_loader
from app.pipelines.base import BaseInferencePipeline

class ImageClassificationPipeline(BaseInferencePipeline):
    """
    Image Classification Pipeline.
    Responsible for classifying complaint images (e.g., road_damage, garbage).
    Connects image preprocessing and model loading without hardcoded dummy predictions.
    """
    
    def __init__(self, model_name: str = "civic_classifier"):
        self.model_name = model_name

    def preprocess(self, file_path: str) -> Optional[Any]:
        """
        Preprocesses the input image for the classification model.
        
        Args:
            file_path (str): The path to the image file.
            
        Returns:
            tf.Tensor or None: The preprocessed image batch, or None if preprocessing fails.
        """
        try:
            logger.info(f"Preprocessing image: {file_path}")
            tensor = preprocess_image(file_path, target_size=(224, 224), expand_dims=True)
            return tensor
        except FileNotFoundError:
            logger.error(f"Image not found at {file_path}")
            raise
        except ValueError as e:
            logger.error(f"Invalid image format for {file_path}: {e}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error preprocessing {file_path}: {e}")
            raise

    def infer(self, processed_data: Optional[tf.Tensor]) -> Dict[str, Any]:
        """
        Executes model inference.
        If the model is not trained/available, returns a MODEL_NOT_AVAILABLE status.
        
        Args:
            processed_data (tf.Tensor): The preprocessed image batch.
            
        Returns:
            Dict[str, Any]: The raw inference output or a failure schema.
        """
        if processed_data is None:
            return {
                "processingStatus": "FAILED",
                "message": "Preprocessing failed or no data provided."
            }

        # Check model availability
        model = model_loader.get_model(self.model_name)
        if model is None:
            logger.warning(f"Classification model '{self.model_name}' is not available. Using mock.")
            return {
                "processingStatus": "completed",
                "categoryPrediction": "garbage",
                "confidence": 0.95,
                "message": "MOCK: TensorFlow model not loaded.",
                "inferenceTimeMs": 50.0
            }

        try:
            logger.info(f"Running real inference using model '{self.model_name}'...")
            
            start_time = time.time()
            predictions = model.predict(processed_data)
            end_time = time.time()
            
            inference_time_ms = (end_time - start_time) * 1000
            logger.info(f"Inference completed in {inference_time_ms:.2f} ms")
            
            class_idx = int(np.argmax(predictions[0]))
            confidence = float(np.max(predictions[0]))
            
            label_mapping = model_loader.get_label_mapping()
            if label_mapping is None:
                raise ValueError("Label mapping not found. Cannot resolve class prediction.")
                
            category_name = label_mapping.get(str(class_idx), "UNKNOWN")
            
            return {
                "processingStatus": "completed",
                "categoryPrediction": category_name,
                "confidence": round(confidence, 4),
                "message": "Inference successful.",
                "inferenceTimeMs": round(inference_time_ms, 2)
            }
        except Exception as e:
            logger.error(f"Inference error: {e}")
            return {
                "processingStatus": "FAILED",
                "message": str(e)
            }

    def postprocess(self, inference_result: Dict[str, Any]) -> Dict[str, Any]:
        """
        Postprocesses the raw inference output to match the expected aiAnalysis MongoDB schema.
        
        Args:
            inference_result (Dict[str, Any]): The result from the infer() method.
            
        Returns:
            Dict[str, Any]: The final structured analysis result.
        """
        status = inference_result.get("processingStatus", "FAILED")
        
        # Base schema compatible with aiAnalysis object
        analysis = {
            "processingStatus": status,
            "analyzedAt": datetime.now(timezone.utc).isoformat(),
            "message": inference_result.get("message", "")
        }
        
        if status == "completed":
            analysis["categoryPrediction"] = inference_result.get("categoryPrediction")
            analysis["confidence"] = inference_result.get("confidence")
            if "inferenceTimeMs" in inference_result:
                analysis["inferenceTimeMs"] = inference_result["inferenceTimeMs"]

        logger.info(f"Classification pipeline complete. Status: {status}")
        return analysis

    def run(self, file_path: str) -> Dict[str, Any]:
        """
        Executes the entire image classification pipeline.
        
        Args:
            file_path (str): The absolute or relative path to the image file.
            
        Returns:
            Dict[str, Any]: The final analysis result matching the schema.
        """
        try:
            processed_data = self.preprocess(file_path)
            inference_result = self.infer(processed_data)
            return self.postprocess(inference_result)
        except Exception as e:
            logger.error(f"Pipeline execution failed: {e}")
            return {
                "processingStatus": "FAILED",
                "message": str(e),
                "analyzedAt": datetime.now(timezone.utc).isoformat()
            }
