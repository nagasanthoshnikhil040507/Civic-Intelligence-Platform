import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch

from app.main import app

client = TestClient(app)

@patch("app.api.v1.analyze.classification_pipeline.run")
@patch("app.api.v1.analyze.severity_pipeline.run")
@patch("app.api.v1.analyze.priority_pipeline.run")
def test_successful_end_to_end_analysis(mock_priority, mock_severity, mock_classification):
    """Verify Successful end-to-end AI analysis."""
    mock_classification.return_value = {
        "processingStatus": "completed",
        "categoryPrediction": "road_damage",
        "confidence": 0.95,
        "inferenceTimeMs": 35.0,
        "analyzedAt": "2026-07-11T00:00:00Z"
    }
    
    mock_severity.return_value = {
        "processingStatus": "SEVERITY_MODEL_NOT_AVAILABLE",
        "categoryPrediction": "road_damage",
        "confidence": 0.95,
        "analyzedAt": "2026-07-11T00:00:00Z"
    }
    
    mock_priority.return_value = {
        "processingStatus": "SEVERITY_MODEL_NOT_AVAILABLE",
        "categoryPrediction": "road_damage",
        "confidence": 0.95,
        "message": "Severity model missing",
        "analyzedAt": "2026-07-11T00:00:00Z"
    }

    # The prefix might be /api/v1 or just / depending on how TestClient interprets app routing,
    # but standard is /api/v1/analyze
    response = client.post("/api/v1/analyze", json={
        "complaintId": "123",
        "imageUrls": ["/uploads/test.jpg"]
    })

    assert response.status_code == 200
    data = response.json()
    assert data["processingStatus"] == "SEVERITY_MODEL_NOT_AVAILABLE"
    assert data["categoryPrediction"] == "road_damage"
    assert data["confidence"] == 0.95
    assert "totalInferenceTimeMs" in data

def test_missing_image_handling():
    """Verify Missing image handling."""
    response = client.post("/api/v1/analyze", json={
        "complaintId": "123",
        "imageUrls": []
    })
    
    assert response.status_code == 200
    data = response.json()
    assert data["processingStatus"] == "FAILED"
    assert "No images provided" in data["message"]

def test_invalid_request_handling():
    """Verify Invalid request handling."""
    # Missing complaintId
    response = client.post("/api/v1/analyze", json={
        "imageUrls": ["/uploads/test.jpg"]
    })
    
    # FastAPI schema validation throws 422 Unprocessable Entity
    assert response.status_code == 422

@patch("app.api.v1.analyze.classification_pipeline.run")
@patch("app.api.v1.analyze.severity_pipeline.run")
@patch("app.api.v1.analyze.priority_pipeline.run")
def test_missing_model_handling(mock_priority, mock_severity, mock_classification):
    """Verify Missing model handling correctly propagates."""
    mock_classification.return_value = {
        "processingStatus": "MODEL_NOT_AVAILABLE",
        "message": "Model not trained yet.",
        "analyzedAt": "2026-07-11T00:00:00Z"
    }
    
    mock_severity.return_value = mock_classification.return_value
    mock_priority.return_value = mock_severity.return_value

    response = client.post("/api/v1/analyze", json={
        "complaintId": "456",
        "imageUrls": ["/uploads/test.jpg"]
    })

    assert response.status_code == 200
    data = response.json()
    assert data["processingStatus"] == "MODEL_NOT_AVAILABLE"
    assert data["message"] == "Model not trained yet."
    # Ensure correct schema fields are returned despite failure
    assert "analyzedAt" in data
    assert "totalInferenceTimeMs" in data
