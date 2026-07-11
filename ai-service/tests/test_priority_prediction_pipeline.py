import pytest
from unittest.mock import patch, MagicMock
from app.pipelines.priority_prediction.pipeline import PriorityPredictionPipeline

@pytest.fixture
def pipeline():
    return PriorityPredictionPipeline(model_name="test_priority")

def test_upstream_model_not_available_propagation(pipeline):
    """Verify MODEL_NOT_AVAILABLE propagates correctly from classification."""
    input_data = {
        "processingStatus": "MODEL_NOT_AVAILABLE",
        "message": "Classification model missing."
    }
    
    result = pipeline.run(input_data)
    
    assert result["processingStatus"] == "MODEL_NOT_AVAILABLE"
    assert result["message"] == "Classification model missing."

def test_upstream_severity_model_not_available_propagation(pipeline):
    """Verify SEVERITY_MODEL_NOT_AVAILABLE propagates correctly from severity prediction."""
    input_data = {
        "processingStatus": "SEVERITY_MODEL_NOT_AVAILABLE",
        "message": "Severity model missing."
    }
    
    result = pipeline.run(input_data)
    
    assert result["processingStatus"] == "SEVERITY_MODEL_NOT_AVAILABLE"
    assert result["message"] == "Severity model missing."

def test_upstream_failed_propagation(pipeline):
    """Verify FAILED propagates correctly."""
    input_data = {
        "processingStatus": "FAILED",
        "message": "Something failed upstream."
    }
    
    result = pipeline.run(input_data)
    
    assert result["processingStatus"] == "FAILED"
    assert result["message"] == "Something failed upstream."

def test_invalid_input_handling(pipeline):
    """Verify Invalid input handling raises exception safely caught or directly raises ValueError."""
    with pytest.raises(ValueError, match="Input to priority prediction must be a dictionary."):
        pipeline.run(["this is a list"])

@patch("app.pipelines.priority_prediction.pipeline.model_loader")
def test_priority_model_not_available(mock_loader, pipeline):
    """Verify pipeline returns PRIORITY_MODEL_NOT_AVAILABLE when missing."""
    mock_loader.get_model.return_value = None
    
    input_data = {
        "processingStatus": "INFERENCE_NOT_IMPLEMENTED",
        "categoryPrediction": "water_leakage",
        "severity": "high"
    }
    
    result = pipeline.run(input_data)
    
    assert result["processingStatus"] == "PRIORITY_MODEL_NOT_AVAILABLE"
    assert "Priority TensorFlow model has not been trained yet" in result["message"]
    mock_loader.get_model.assert_called_once_with("test_priority")

@patch("app.pipelines.priority_prediction.pipeline.model_loader")
def test_no_tensorflow_inference_occurs(mock_loader, pipeline):
    """Verify No TensorFlow inference occurs even if model is loaded."""
    mock_model = MagicMock()
    mock_loader.get_model.return_value = mock_model
    
    input_data = {
        "processingStatus": "INFERENCE_NOT_IMPLEMENTED",
        "categoryPrediction": "water_leakage",
        "severity": "high"
    }
    
    result = pipeline.run(input_data)
    
    # Model predict must NOT be called
    mock_model.predict.assert_not_called()
    assert result["processingStatus"] == "INFERENCE_NOT_IMPLEMENTED"
    assert "priority inference logic is strictly disabled" in result["message"]

def test_structured_output(pipeline):
    """Verify Structured output compatibility with aiAnalysis schema."""
    input_data = {
        "processingStatus": "MODEL_NOT_AVAILABLE",
        "categoryPrediction": "street_light"
    }
    
    result = pipeline.run(input_data)
    
    # Check that original keys are maintained and analyzedAt is added
    assert "categoryPrediction" in result
    assert result["categoryPrediction"] == "street_light"
    assert "analyzedAt" in result
    assert "processingStatus" in result
