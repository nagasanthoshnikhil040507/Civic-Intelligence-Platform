import time
import logging
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from asgi_correlation_id import correlation_id

logger = logging.getLogger("ai_service")

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        req_id = correlation_id.get()
        start_time = time.time()
        
        logger.info(f"[{req_id}] Started {request.method} {request.url}")
        try:
            response = await call_next(request)
            process_time = time.time() - start_time
            logger.info(f"[{req_id}] Completed {response.status_code} in {process_time:.3f}s")
            response.headers["X-Process-Time"] = str(process_time)
            return response
        except Exception as e:
            process_time = time.time() - start_time
            logger.error(f"[{req_id}] Failed with exception {str(e)} in {process_time:.3f}s")
            raise
