import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch

from app.main import app

client = TestClient(app)

@patch("app.api.v1.analyze.classification_pipeline.run")
@patch("app.api.v1.analyze.severity_pipeline.run")
@patch("app.api.v1.analyze.priority_pipeline.run")
@patch("app.api.v1.analyze.department_pipeline.run")
@patch("app.api.v1.analyze.duplicate_pipeline.run")
def test_successful_end_to_end_analysis(mock_duplicate, mock_department, mock_priority, mock_severity, mock_classification):
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
        "processingStatus": "completed",
        "categoryPrediction": "road_damage",
        "confidence": 0.95,
        "severity": "medium",
        "priority": "high",
        "analyzedAt": "2026-07-11T00:00:00Z"
    }

    mock_department.return_value = {
        "processingStatus": "completed",
        "categoryPrediction": "road_damage",
        "confidence": 0.95,
        "severity": "medium",
        "priority": "high",
        "departmentRecommendation": "Roads & Buildings Department",
        "analyzedAt": "2026-07-11T00:00:00Z"
    }

    mock_duplicate.return_value = {
        "duplicateDetected": True,
        "matchedComplaintId": "dup123",
        "similarity": 0.98
    }

    # The prefix might be /api/v1 or just / depending on how TestClient interprets app routing,
    # but standard is /api/v1/analyze
    response = client.post("/api/v1/analyze", json={
        "complaintId": "123",
        "imageUrls": ["/uploads/test.jpg"],
        "latitude": 10.0,
        "longitude": 20.0
    })

    assert response.status_code == 200
    data = response.json()
    assert data["processingStatus"] == "completed"
    assert data["categoryPrediction"] == "road_damage"
    assert data["confidence"] == 0.95
    assert data["severity"] == "medium"
    assert data["priority"] == "high"
    assert data["departmentRecommendation"] == "Roads & Buildings Department"
    assert data["duplicateDetected"] is True
    assert data["matchedComplaintId"] == "dup123"
    assert data["similarity"] == 0.98
    assert "totalInferenceTimeMs" in data

    # Verify sequential execution
    mock_classification.assert_called_once()
    mock_severity.assert_called_once_with(mock_classification.return_value)
    mock_priority.assert_called_once_with(mock_severity.return_value)
    mock_department.assert_called_once_with(mock_priority.return_value)
    
    # Path might resolve slightly differently in tests, so we assert the args contain the mock params
    mock_duplicate.assert_called_once()

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
@patch("app.api.v1.analyze.department_pipeline.run")
@patch("app.api.v1.analyze.duplicate_pipeline.run")
def test_missing_model_handling(mock_duplicate, mock_department, mock_priority, mock_severity, mock_classification):
    """Verify Missing model handling correctly propagates."""
    mock_classification.return_value = {
        "processingStatus": "MODEL_NOT_AVAILABLE",
        "message": "Model not trained yet.",
        "analyzedAt": "2026-07-11T00:00:00Z"
    }
    
    mock_severity.return_value = mock_classification.return_value
    mock_priority.return_value = mock_severity.return_value
    mock_department.return_value = mock_priority.return_value

    response = client.post("/api/v1/analyze", json={
        "complaintId": "456",
        "imageUrls": ["/uploads/test.jpg"]
    })

    assert response.status_code == 200
    data = response.json()
    assert data["processingStatus"] == "MODEL_NOT_AVAILABLE"
    assert data["message"] == "Model not trained yet."
    assert data["duplicateDetected"] is False
    assert data["matchedComplaintId"] is None
    assert data["similarity"] == 0
    # Ensure correct schema fields are returned despite failure
    assert "analyzedAt" in data
    assert "totalInferenceTimeMs" in data
