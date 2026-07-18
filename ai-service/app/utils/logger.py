import logging
import sys
import threading
import asyncio
from contextvars import ContextVar
from app.config.settings import get_settings

settings = get_settings()

# Context variable for complaintId
complaint_id_ctx_var: ContextVar[str] = ContextVar("complaint_id", default="NO_COMPLAINT_ID")

def setup_logging():
    logger = logging.getLogger(settings.PROJECT_NAME)
    logger.setLevel(logging.INFO)
    
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - [thread:%(thread_id)s] [coro:%(coro_id)s] [complaint:%(complaint_id)s] - %(message)s'
        )
        
        class CustomFilter(logging.Filter):
            def filter(self, record):
                record.thread_id = threading.get_ident()
                try:
                    record.coro_id = id(asyncio.current_task())
                except RuntimeError:
                    record.coro_id = "None"
                record.complaint_id = complaint_id_ctx_var.get()
                return True
                
        handler.addFilter(CustomFilter())
        handler.setFormatter(formatter)
        logger.addHandler(handler)
    
    return logger

logger = setup_logging()
