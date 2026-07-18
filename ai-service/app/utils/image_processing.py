import os
import cv2
import numpy as np
import logging
import requests
from typing import Tuple

from app.utils.logger import logger

def load_image(file_path: str) -> np.ndarray:
    """
    Loads an image from a file path or URL using OpenCV.
    
    Args:
        file_path (str): The absolute/relative path or URL to the image file.
        
    Returns:
        np.ndarray: The loaded image as a NumPy array (BGR format).
        
    Raises:
        FileNotFoundError: If the file does not exist or URL cannot be fetched.
        ValueError: If the file is not a valid image format or cannot be decoded.
    """
    import time
    try:
        if file_path.startswith("http://") or file_path.startswith("https://"):
            logger.info(f"Downloading image from URL: {file_path}")
            
            max_retries = 3
            response = None
            for attempt in range(1, max_retries + 1):
                try:
                    response = requests.get(file_path, timeout=10)
                    if response.status_code == 200:
                        break
                    
                    logger.warning(f"Cloudinary fetch attempt {attempt} returned HTTP {response.status_code}")
                    if response.status_code in [404, 403, 502, 503, 504]:
                        if attempt < max_retries:
                            logger.info(f"Retrying image download in 2 seconds (Attempt {attempt + 1}/{max_retries})...")
                            time.sleep(2)
                            continue
                    response.raise_for_status()
                except requests.exceptions.RequestException as e:
                    logger.warning(f"Cloudinary fetch attempt {attempt} failed: {e}")
                    if attempt < max_retries:
                        logger.info(f"Retrying image download in 2 seconds (Attempt {attempt + 1}/{max_retries})...")
                        time.sleep(2)
                        continue
                    raise e
                    
            if response is None or response.status_code != 200:
                raise FileNotFoundError(f"Failed to fetch image from URL after {max_retries} attempts: {file_path}")
                
            # Decode the image directly from memory
            image_array = np.frombuffer(response.content, np.uint8)
            image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
        else:
            if not os.path.exists(file_path):
                logger.error(f"File not found: {file_path}")
                raise FileNotFoundError(f"File not found: {file_path}")
                
            # cv2.imread returns None if the image cannot be read or is invalid
            image = cv2.imread(file_path, cv2.IMREAD_COLOR)
            
        if image is None:
            raise ValueError(f"Invalid image format or cannot decode image at {file_path}")
        return image
    except requests.exceptions.RequestException as e:
        logger.error(f"Failed to fetch image from URL {file_path}: {e}")
        raise FileNotFoundError(f"Failed to fetch image from URL: {file_path}")
    except Exception as e:
        if not isinstance(e, FileNotFoundError):
            import traceback
            logger.error(f"Error loading image from {file_path}: {e}\n{traceback.format_exc()}")
        raise

def resize_image(image: np.ndarray, target_size: Tuple[int, int] = (224, 224)) -> np.ndarray:
    """
    Resizes an image to the target dimensions.
    
    Args:
        image (np.ndarray): The input image.
        target_size (tuple): The desired target size as (width, height). Default is (224, 224).
        
    Returns:
        np.ndarray: The resized image.
    """
    try:
        resized_image = cv2.resize(image, target_size, interpolation=cv2.INTER_AREA)
        return resized_image
    except Exception as e:
        logger.error(f"Error resizing image to {target_size}: {e}")
        raise

def normalize_image(image: np.ndarray) -> np.ndarray:
    """
    Normalizes image pixel values to the range [0, 1].
    
    Args:
        image (np.ndarray): The input image array.
        
    Returns:
        np.ndarray: The normalized image array with float32 data type.
    """
    try:
        normalized_image = image.astype(np.float32) / 255.0
        return normalized_image
    except Exception as e:
        logger.error(f"Error normalizing image: {e}")
        raise

def preprocess_image(file_path: str, target_size: Tuple[int, int] = (224, 224), expand_dims: bool = True) -> np.ndarray:
    """
    Complete preprocessing pipeline for an image file.
    Reads the image, converts BGR to RGB, resizes, normalizes, and optionally expands dimensions.
    
    Args:
        file_path (str): The path to the image file.
        target_size (tuple): The target resizing dimensions. Default is (224, 224).
        expand_dims (bool): Whether to expand dimensions to create a batch (e.g., shape (1, H, W, C)). Default is True.
        
    Returns:
        np.ndarray: The preprocessed image tensor ready for model inference.
    """
    try:
        # 1. Load image (BGR by default in OpenCV)
        image = load_image(file_path)
        
        # 2. Convert BGR to RGB
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # 3. Resize image
        image_resized = resize_image(image_rgb, target_size)
        
        # 4. Normalize pixel values
        image_normalized = normalize_image(image_resized)
        
        # 5. Expand dimensions to create a batch if requested
        if expand_dims:
            image_tensor = np.expand_dims(image_normalized, axis=0)
        else:
            image_tensor = image_normalized
            
        logger.info(f"Successfully preprocessed image: {file_path}. Final shape: {image_tensor.shape}")
        return image_tensor
        
    except Exception as e:
        logger.error(f"Preprocessing pipeline failed for image {file_path}: {e}")
        raise
