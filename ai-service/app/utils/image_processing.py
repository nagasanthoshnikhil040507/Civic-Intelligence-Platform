import cv2
import numpy as np
from app.utils.logger import logger

class ImageProcessor:
    """
    Utility class for standardizing image preprocessing before AI inference.
    """
    
    @staticmethod
    def read_image_from_bytes(image_bytes: bytes) -> np.ndarray:
        """
        Converts raw bytes to an OpenCV image (numpy array).
        """
        try:
            nparr = np.frombuffer(image_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if img is None:
                raise ValueError("Could not decode image bytes")
            return img
        except Exception as e:
            logger.error(f"Error reading image from bytes: {e}")
            raise

    @staticmethod
    def resize_image(image: np.ndarray, target_size: tuple = (224, 224)) -> np.ndarray:
        """
        Resizes an image to the target dimensions (default 224x224 for standard CNNs).
        """
        try:
            return cv2.resize(image, target_size, interpolation=cv2.INTER_AREA)
        except Exception as e:
            logger.error(f"Error resizing image: {e}")
            raise

    @staticmethod
    def convert_color_space(image: np.ndarray, code=cv2.COLOR_BGR2RGB) -> np.ndarray:
        """
        Converts color space (e.g., BGR to RGB). OpenCV uses BGR by default, 
        but most ML models expect RGB.
        """
        try:
            return cv2.cvtColor(image, code)
        except Exception as e:
            logger.error(f"Error converting color space: {e}")
            raise

    @staticmethod
    def normalize_image(image: np.ndarray) -> np.ndarray:
        """
        Normalizes pixel values to the range [0, 1].
        """
        try:
            return image.astype(np.float32) / 255.0
        except Exception as e:
            logger.error(f"Error normalizing image: {e}")
            raise

    @classmethod
    def preprocess_for_model(cls, image_bytes: bytes, target_size: tuple = (224, 224)) -> np.ndarray:
        """
        Complete preprocessing pipeline: Read -> Resize -> Color Convert -> Normalize.
        """
        img = cls.read_image_from_bytes(image_bytes)
        img = cls.resize_image(img, target_size)
        img = cls.convert_color_space(img)
        img = cls.normalize_image(img)
        
        # Add batch dimension: (H, W, C) -> (1, H, W, C)
        return np.expand_dims(img, axis=0)
