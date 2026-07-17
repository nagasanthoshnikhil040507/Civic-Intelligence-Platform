import pytest
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

def test_priority_urgent(pipeline):
    input_data = {
        "processingStatus": "completed",
        "severity": "critical"
    }
    result = pipeline.run(input_data)
    assert result["processingStatus"] == "completed"
    assert result["priority"] == "urgent"

def test_priority_high(pipeline):
    input_data = {
        "processingStatus": "completed",
        "severity": "high"
    }
    result = pipeline.run(input_data)
    assert result["processingStatus"] == "completed"
    assert result["priority"] == "high"

def test_priority_medium(pipeline):
    input_data = {
        "processingStatus": "completed",
        "severity": "medium"
    }
    result = pipeline.run(input_data)
    assert result["processingStatus"] == "completed"
    assert result["priority"] == "medium"

def test_priority_low(pipeline):
    input_data = {
        "processingStatus": "completed",
        "severity": "low"
    }
    result = pipeline.run(input_data)
    assert result["processingStatus"] == "completed"
    assert result["priority"] == "low"
