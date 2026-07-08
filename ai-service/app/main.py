from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from asgi_correlation_id import CorrelationIdMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException

from app.config.settings import get_settings
from app.api.v1.router import api_router
from app.middleware.logging import RequestLoggingMiddleware
from app.middleware.exceptions import global_exception_handler, validation_exception_handler, http_exception_handler
from app.utils.logger import logger

settings = get_settings()

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(CorrelationIdMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_exception_handler(Exception, global_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(HTTPException, http_exception_handler)

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.on_event("startup")
async def startup_event():
    logger.info(f"Starting {settings.PROJECT_NAME}...")

@app.get("/")
def root():
    return {"message": f"{settings.PROJECT_NAME} is running"}
