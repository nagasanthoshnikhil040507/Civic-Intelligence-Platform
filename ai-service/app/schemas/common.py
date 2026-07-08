from pydantic import BaseModel
from typing import Optional, Dict, Any

class HealthResponse(BaseModel):
    status: str
    service: str
    version: str

class ErrorResponse(BaseModel):
    success: bool = False
    detail: str
    error_code: Optional[str] = None
