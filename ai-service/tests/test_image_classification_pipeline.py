import pytest
import numpy as np
from unittest.mock import patch, MagicMock
from app.pipelines.image_classification.classifier import ImageClassificationPipeline

@pytest.fixture
def pipeline():
    return ImageClassificationPipeline(model_name="civic_classifier")

@patch("app.pipelines.image_classification.classifier.preprocess_image")
@patch("app.pipelines.image_classification.classifier.model_loader")
def test_successful_inference(mock_loader, mock_preprocess, pipeline):
    """Verify model loads, prediction runs, confidence calculation, label mapping, inference timing."""
    mock_preprocess.return_value = MagicMock()
    
    # Mock model
    mock_model = MagicMock()
    # Mock prediction output (shape: (1, 4) classes)
    mock_model.predict.return_value = np.array([[0.1, 0.8, 0.05, 0.05]])
    mock_loader.get_model.return_value = mock_model
    
    # Mock label mapping
    mock_loader.get_label_mapping.return_value = {"0": "garbage", "1": "road_damage", "2": "street_light", "3": "water_leakage"}
    
    result = pipeline.run("dummy_path.jpg")
    
    # Verify predict was called
    mock_model.predict.assert_called_once()
    
    # Verify output properties
    assert result["processingStatus"] == "completed"
    assert result["categoryPrediction"] == "road_damage"
    assert result["confidence"] == 0.8
    assert "inferenceTimeMs" in result
    assert "analyzedAt" in result

@patch("app.pipelines.image_classification.classifier.preprocess_image")
@patch("app.pipelines.image_classification.classifier.model_loader")
def test_missing_model_handling(mock_loader, mock_preprocess, pipeline):
    """Verify missing model is handled correctly (MODEL_NOT_AVAILABLE)."""
    mock_preprocess.return_value = MagicMock()
    mock_loader.get_model.return_value = None # Model not found
    
    result = pipeline.run("dummy_path.jpg")
    
    assert result["processingStatus"] == "MODEL_NOT_AVAILABLE"
    assert "not been trained yet" in result["message"]
    mock_loader.get_model.assert_called_once_with("civic_classifier")

@patch("app.pipelines.image_classification.classifier.preprocess_image")
def test_invalid_image_path_handling(mock_preprocess, pipeline):
    """Verify Invalid image path is handled correctly."""
    mock_preprocess.side_effect = FileNotFoundError("File not found")
    
    result = pipeline.run("bad_path.jpg")
    
    assert result["processingStatus"] == "FAILED"
    assert "File not found" in result["message"]

@patch("app.pipelines.image_classification.classifier.preprocess_image")
@patch("app.pipelines.image_classification.classifier.model_loader")
def test_missing_label_mapping_handling(mock_loader, mock_preprocess, pipeline):
    """Verify failure when label mapping is missing."""
    mock_preprocess.return_value = MagicMock()
    
    mock_model = MagicMock()
    mock_model.predict.return_value = np.array([[0.9, 0.1]])
    mock_loader.get_model.return_value = mock_model
    
    # Mock missing mapping
    mock_loader.get_label_mapping.return_value = None
    
    result = pipeline.run("dummy_path.jpg")
    
    assert result["processingStatus"] == "FAILED"
    assert "Label mapping not found" in result["message"]
