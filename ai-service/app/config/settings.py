from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache

class Settings(BaseSettings):
    PROJECT_NAME: str = "Civic Intelligence Platform AI"
    API_V1_STR: str = "/api/v1"
    PORT: int = 8000
    
    # AI Config
    DEVICE: str = "cpu"  # cpu or cuda
    BATCH_SIZE: int = 1
    MODEL_CACHE_DIR: str = "./models/weights"
    
    # External Services
    NODE_API_URL: str = "http://localhost:5000/api/v1"
    
    # Timeouts and limits
    INFERENCE_TIMEOUT: int = 30
    
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

@lru_cache()
def get_settings():
    return Settings()
