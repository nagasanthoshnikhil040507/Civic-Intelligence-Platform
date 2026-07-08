import logging
import sys
from app.config.settings import get_settings

settings = get_settings()

def setup_logging():
    logger = logging.getLogger(settings.PROJECT_NAME)
    logger.setLevel(logging.INFO)
    
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - [%(correlation_id)s] - %(message)s'
        )
        
        # Inject correlation ID if available (ASGI middleware)
        class CorrelationIdFilter(logging.Filter):
            def filter(self, record):
                try:
                    from asgi_correlation_id.context import correlation_id
                    record.correlation_id = correlation_id.get() or "no-id"
                except ImportError:
                    record.correlation_id = "no-id"
                return True
                
        handler.addFilter(CorrelationIdFilter())
        handler.setFormatter(formatter)
        logger.addHandler(handler)
    
    return logger

logger = setup_logging()
