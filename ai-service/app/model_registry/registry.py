import logging
from typing import Dict, Any, Optional

logger = logging.getLogger("ai_service")

class ModelRegistry:
    def __init__(self):
        self._models: Dict[str, Any] = {}
        self._status: Dict[str, str] = {}

    def register(self, model_name: str, model_path: str):
        # Setup metadata without loading the model
        self._status[model_name] = "REGISTERED"
        logger.info(f"Model {model_name} registered at path {model_path}")

    def load_model(self, model_name: str):
        if self._status.get(model_name) == "LOADED":
            return self._models[model_name]
            
        logger.info(f"Lazily loading model: {model_name}")
        # Placeholder for actual model loading logic
        self._models[model_name] = {"dummy_model_ref": model_name}
        self._status[model_name] = "LOADED"
        return self._models[model_name]
        
    def get_status(self) -> Dict[str, str]:
        return self._status

registry = ModelRegistry()
