from pydantic import BaseModel
from typing import Any, Optional

class APIResponse(BaseModel):
    success: bool
    data: Optional[Any] = None
    message: str = "Success"
    
class PredictionRequest(BaseModel):
    image_url: Optional[str] = None
    description: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
