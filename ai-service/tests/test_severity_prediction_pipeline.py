import pytest
from unittest.mock import patch, MagicMock
from app.pipelines.severity_prediction.pipeline import SeverityPredictionPipeline

@pytest.fixture
def pipeline():
    return SeverityPredictionPipeline(model_name="test_severity")

def test_upstream_model_not_available_propagation(pipeline):
    """Verify MODEL_NOT_AVAILABLE propagates correctly from classification."""
    input_data = {
        "processingStatus": "MODEL_NOT_AVAILABLE",
        "message": "TensorFlow model has not been trained yet."
    }
    
    result = pipeline.run(input_data)
    
    assert result["processingStatus"] == "MODEL_NOT_AVAILABLE"
    assert result["message"] == "TensorFlow model has not been trained yet."

def test_upstream_failed_propagation(pipeline):
    """Verify FAILED propagates correctly from classification."""
    input_data = {
        "processingStatus": "FAILED",
        "message": "File not found"
    }
    result = pipeline.run(input_data)
    assert result["processingStatus"] == "FAILED"

def test_invalid_input_handling(pipeline):
    """Verify Invalid input handling."""
    with pytest.raises(ValueError, match="Input to severity prediction must be a dictionary."):
        pipeline.run("this is a string, not a dict")

@patch("app.pipelines.severity_prediction.pipeline.model_loader")
def test_severity_model_not_available(mock_loader, pipeline):
    """Verify pipeline returns SEVERITY_MODEL_NOT_AVAILABLE when missing."""
    mock_loader.get_model.return_value = None
    
    input_data = {
        "processingStatus": "INFERENCE_NOT_IMPLEMENTED",
        "categoryPrediction": "road_damage"
    }
    
    result = pipeline.run(input_data)
    
    assert result["processingStatus"] == "SEVERITY_MODEL_NOT_AVAILABLE"
    assert "Severity TensorFlow model has not been trained yet" in result["message"]
    mock_loader.get_model.assert_called_once_with("test_severity")

@patch("app.pipelines.severity_prediction.pipeline.model_loader")
def test_no_tensorflow_inference_occurs(mock_loader, pipeline):
    """Verify No TensorFlow inference occurs even if model is loaded."""
    mock_model = MagicMock()
    mock_loader.get_model.return_value = mock_model
    
    input_data = {
        "processingStatus": "INFERENCE_NOT_IMPLEMENTED",
        "categoryPrediction": "road_damage"
    }
    
    result = pipeline.run(input_data)
    
    # Model predict must NOT be called
    mock_model.predict.assert_not_called()
    assert result["processingStatus"] == "INFERENCE_NOT_IMPLEMENTED"
    assert "severity inference logic is strictly disabled" in result["message"]

def test_structured_output(pipeline):
    """Verify Structured output compatibility with aiAnalysis schema."""
    input_data = {
        "processingStatus": "MODEL_NOT_AVAILABLE",
        "categoryPrediction": "garbage"
    }
    
    result = pipeline.run(input_data)
    
    # Check that original keys are maintained and analyzedAt is added
    assert "categoryPrediction" in result
    assert result["categoryPrediction"] == "garbage"
    assert "analyzedAt" in result
    assert "processingStatus" in result
