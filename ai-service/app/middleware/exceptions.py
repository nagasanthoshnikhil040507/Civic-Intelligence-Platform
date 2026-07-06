from fastapi import Request
from fastapi.responses import JSONResponse
import logging

logger = logging.getLogger("ai_service")

async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error in AI service", "success": False},
    )
