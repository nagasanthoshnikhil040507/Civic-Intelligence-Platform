import os
import time
import pytest
import numpy as np
import cv2
import requests
from unittest.mock import patch, MagicMock
from app.utils.image_processing import load_image, resize_image, normalize_image, preprocess_image

# Use an actual dataset image for testing. Construct path dynamically to avoid Windows-specific hardcoding.
DATASET_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "datasets", "road_damage", "test")
TEST_IMAGE = "rms640_0526_jpg.rf.435e03b7dc641332c9cb730ff450fc64.jpg"
TEST_IMAGE_PATH = os.path.join(DATASET_PATH, TEST_IMAGE)

def test_load_image():
    """1. Valid Image Test - Loading Local Path"""
    image = load_image(TEST_IMAGE_PATH)
    assert image is not None
    assert isinstance(image, np.ndarray)
    assert len(image.shape) == 3

@patch("app.utils.image_processing.requests.get")
def test_load_image_http(mock_get):
    """2. Valid Image Test - Loading from HTTP URL"""
    mock_response = MagicMock()
    mock_response.raise_for_status.return_value = None
    
    # Read actual image bytes to mock response
    with open(TEST_IMAGE_PATH, "rb") as f:
        mock_response.content = f.read()
    
    mock_get.return_value = mock_response
    
    image = load_image("http://example.com/image.jpg")
    assert image is not None
    assert isinstance(image, np.ndarray)
    assert len(image.shape) == 3
    mock_get.assert_called_once_with("http://example.com/image.jpg", timeout=10)

def test_preprocess_image_shape_and_dtype():
    """3. Valid Image Test - Shape, dtype, normalization"""
    tensor = preprocess_image(TEST_IMAGE_PATH, target_size=(224, 224), expand_dims=True)
    assert tensor.shape == (1, 224, 224, 3)
    assert tensor.dtype == np.float32
    assert np.min(tensor) >= 0.0
    assert np.max(tensor) <= 1.0

def test_resize_image():
    """4. Resize Test"""
    image = load_image(TEST_IMAGE_PATH)
    resized = resize_image(image, target_size=(128, 128))
    assert resized.shape[:2] == (128, 128)

def test_rgb_conversion():
    """5. RGB Conversion Test"""
    image_bgr = load_image(TEST_IMAGE_PATH)
    image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
    
    b, g, r = cv2.split(image_bgr)
    r2, g2, b2 = cv2.split(image_rgb)
    assert np.array_equal(b, b2)
    assert np.array_equal(r, r2)
    assert np.array_equal(g, g2)

def test_invalid_path():
    """6. Invalid Local Path Test"""
    with pytest.raises(FileNotFoundError, match="File not found"):
        load_image("non_existent_file.jpg")

@patch("app.utils.image_processing.requests.get")
def test_invalid_http_url(mock_get):
    """7. Invalid HTTP URL Test"""
    mock_get.side_effect = requests.exceptions.RequestException("Connection error")
    with pytest.raises(FileNotFoundError, match="Failed to fetch image from URL"):
        load_image("http://bad_url.com/img.jpg")

def test_invalid_file(tmp_path):
    """8. Invalid File Test"""
    fake_img = tmp_path / "corrupt.jpg"
    fake_img.write_text("This is not an image file")
    
    with pytest.raises(ValueError, match="Invalid image format"):
        load_image(str(fake_img))

def test_logging_verification(caplog):
    """9. Logging Verification"""
    import logging
    with caplog.at_level(logging.INFO):
        preprocess_image(TEST_IMAGE_PATH)
    assert "Successfully preprocessed image" in caplog.text

def test_performance():
    """10. Performance Test"""
    start_time = time.time()
    tensor = preprocess_image(TEST_IMAGE_PATH)
    end_time = time.time()
    duration_ms = (end_time - start_time) * 1000
    assert duration_ms < 500
