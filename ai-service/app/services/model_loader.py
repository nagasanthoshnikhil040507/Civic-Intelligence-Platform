import threading
from pathlib import Path
from typing import Any, List, Optional
import tensorflow as tf
from app.utils.logger import logger

class ModelLoader:
    """
    Singleton Model Loader for AI Service.
    Responsible for safely lazy-loading and caching TensorFlow ML models in memory.
    """
    _instance = None
    _lock = threading.Lock()
    
    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(ModelLoader, cls).__new__(cls)
                cls._instance.models = {}
                cls._instance.label_mappings = {}
                # Configure the base model directory using pathlib (resolves to ai-service/trained_models)
                cls._instance.model_dir = Path(__file__).parent.parent.parent / "trained_models"
                cls._instance.is_initialized = False        return cls._instance
        
    def __init__(self):
        with self._lock:
            if not self.is_initialized:
                self.is_initialized = True
                # Ensure the models directory exists
                self.model_dir.mkdir(parents=True, exist_ok=True)
                logger.info(f"ModelLoader initialized. Model directory: {self.model_dir}")
                
    def _get_model_path(self, model_name: str) -> Path:
        """
        Constructs the expected path for a given model name.
        Checks for exact directory, .h5, or .keras extensions.
        """
        base_path = self.model_dir / model_name
        if base_path.exists():
            return base_path
            
        for ext in ['.h5', '.keras']:
            ext_path = self.model_dir / f"{model_name}{ext}"
            if ext_path.exists():
                return ext_path
                
        return base_path

    def load_model(self, model_name: str) -> bool:
        """
        Loads a TensorFlow model from disk into the memory cache.
        Returns True if successful, False otherwise.
        """
        with self._lock:
            if model_name in self.models:
                logger.info(f"Model '{model_name}' is already loaded in cache.")
                return True
                
            model_path = self._get_model_path(model_name)
            
            if not model_path.exists():
                logger.error(f"Failed to load model '{model_name}': Path does not exist at {model_path}")
                return False
                
            try:
                logger.info(f"Loading TensorFlow model '{model_name}' from {model_path}...")
                model = tf.keras.models.load_model(str(model_path))
                self.models[model_name] = model
                logger.info(f"Model '{model_name}' loaded successfully and cached.")
                return True
            except Exception as e:
                logger.error(f"Error loading model '{model_name}': {e}")
                return False
            
    def get_model(self, model_name: str) -> Optional[Any]:
        """
        Retrieves a loaded model from memory cache.
        Attempts lazy-loading if the model is not currently in cache.
        """
        if not self.is_model_loaded(model_name):
            logger.info(f"Model '{model_name}' requested but not cached. Attempting to lazy-load...")
            success = self.load_model(model_name)
            if not success:
                return None
                
        with self._lock:
            return self.models.get(model_name)

    def get_label_mapping(self, mapping_name: str = "label_mapping.json") -> Optional[dict]:
        """
        Retrieves a label mapping from cache or loads it from disk.
        """
        with self._lock:
            if mapping_name in self.label_mappings:
                return self.label_mappings[mapping_name]
                
            mapping_path = self.model_dir / mapping_name
            if not mapping_path.exists():
                logger.error(f"Label mapping file not found at {mapping_path}")
                return None
                
            try:
                import json
                with open(mapping_path, 'r') as f:
                    mapping = json.load(f)
                self.label_mappings[mapping_name] = mapping
                logger.info(f"Loaded label mapping {mapping_name} successfully.")
                return mapping
            except Exception as e:
                logger.error(f"Failed to load label mapping {mapping_name}: {e}")
                return None

    def unload_model(self, model_name: str) -> bool:
        """
        Removes a model from the memory cache to free up RAM/VRAM.
        """
        with self._lock:
            if model_name in self.models:
                del self.models[model_name]
                tf.keras.backend.clear_session()
                logger.info(f"Model '{model_name}' unloaded from cache.")
                return True
            else:
                logger.warning(f"Attempted to unload '{model_name}', but it was not in cache.")
                return False

    def clear_cache(self) -> None:
        """
        Unloads all models from memory.
        """
        with self._lock:
            loaded_models = list(self.models.keys())
            self.models.clear()
            tf.keras.backend.clear_session()
            logger.info(f"Cleared all models from cache: {loaded_models}")

    def list_loaded_models(self) -> List[str]:
        """
        Returns a list of currently cached model names.
        """
        with self._lock:
            return list(self.models.keys())

    def is_model_loaded(self, model_name: str) -> bool:
        """
        Checks if a specific model is currently loaded in the cache.
        """
        with self._lock:
            return model_name in self.models

# Global singleton instance
model_loader = ModelLoader()
