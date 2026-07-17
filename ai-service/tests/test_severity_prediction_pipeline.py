import pytest
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

def test_severity_water_leakage(pipeline):
    input_data = {
        "processingStatus": "completed",
        "categoryPrediction": "water_leakage"
    }
    result = pipeline.run(input_data)
    assert result["processingStatus"] == "completed"
    assert result["severity"] == "critical"

def test_severity_road_damage(pipeline):
    input_data = {
        "processingStatus": "completed",
        "categoryPrediction": "road_damage"
    }
    result = pipeline.run(input_data)
    assert result["processingStatus"] == "completed"
    assert result["severity"] == "high"

def test_severity_garbage(pipeline):
    input_data = {
        "processingStatus": "completed",
        "categoryPrediction": "garbage"
    }
    result = pipeline.run(input_data)
    assert result["processingStatus"] == "completed"
    assert result["severity"] == "medium"

def test_severity_street_light(pipeline):
    input_data = {
        "processingStatus": "completed",
        "categoryPrediction": "street_light",
        "duplicateDetected": True
    }
    result = pipeline.run(input_data)
    assert result["processingStatus"] == "completed"
    assert result["severity"] == "low"
    # Duplicate logic runs seamlessly
