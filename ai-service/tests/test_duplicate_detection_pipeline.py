import pytest
import logging
import numpy as np
from unittest.mock import patch, MagicMock
from app.pipelines.duplicate_detection.pipeline import DuplicateComplaintDetectionPipeline

@pytest.fixture
@patch('pymongo.MongoClient')
def pipeline(mock_mongo):
    # Mocking MongoDB initialization
    mock_client = MagicMock()
    mock_db = MagicMock()
    mock_collection = MagicMock()
    
    mock_client.__getitem__.return_value = mock_db
    mock_db.__getitem__.return_value = mock_collection
    mock_mongo.return_value = mock_client
    
    pipe = DuplicateComplaintDetectionPipeline(db_uri="mock://", db_name="test_db")
    # Replace collection with mock for easier querying
    pipe.collection = mock_collection
    return pipe

@patch('cv2.imread')
def test_image_hash_generation(mock_imread, pipeline):
    # Create a synthetic image (10x10 white square)
    mock_image = np.ones((10, 10, 3), dtype=np.uint8) * 255
    mock_imread.return_value = mock_image
    
    hash_str = pipeline.calculate_image_hash("mock_path.jpg")
    
    assert hash_str is not None
    assert len(hash_str) == 64
    assert all(c in '01' for c in hash_str)
    print("\nPASS\nImage Hash Generation")

@patch('cv2.imread')
def test_invalid_image(mock_imread, pipeline):
    mock_imread.return_value = None
    
    hash_str = pipeline.calculate_image_hash("invalid_path.jpg")
    assert hash_str is None
    print("\nPASS\nInvalid Image Handling")

def test_hash_comparison(pipeline):
    hash1 = "1" * 64
    hash2 = "1" * 64
    
    similarity = pipeline.compare_hashes(hash1, hash2)
    assert similarity == 1.0
    print("\nPASS\nHash Comparison")

def test_different_hashes(pipeline):
    hash1 = "1" * 64
    hash2 = "0" * 64
    
    similarity = pipeline.compare_hashes(hash1, hash2)
    assert similarity == 0.0
    assert similarity < pipeline.similarity_threshold
    print("\nPASS\nDifferent Hashes")

def test_nearby_complaint_search(pipeline):
    # Mock return value from MongoDB find()
    mock_cursor = MagicMock()
    mock_cursor.__iter__.return_value = [{"_id": "123", "location": {}}]
    pipeline.collection.find.return_value = mock_cursor
    
    results = pipeline.find_nearby_complaints(0.0, 0.0)
    assert len(results) == 1
    assert results[0]["_id"] == "123"
    print("\nPASS\nNearby Complaint Search")

@patch.object(DuplicateComplaintDetectionPipeline, 'calculate_image_hash')
def test_duplicate_detected(mock_hash, pipeline):
    # Simulate a hash
    mock_hash.return_value = "1" * 64
    
    # Mock MongoDB return value with identical hash
    mock_cursor = MagicMock()
    mock_cursor.__iter__.return_value = [
        {"_id": "duplicate_id", "imageHash": "1" * 64}
    ]
    pipeline.collection.find.return_value = mock_cursor
    
    result = pipeline.run("test.jpg", 10.0, 20.0)
    
    assert result["duplicateDetected"] is True
    assert result["matchedComplaintId"] == "duplicate_id"
    assert result["similarity"] == 1.0
    print("\nPASS\nDuplicate Detection")

@patch.object(DuplicateComplaintDetectionPipeline, 'calculate_image_hash')
def test_no_duplicate(mock_hash, pipeline):
    # Simulate a hash
    mock_hash.return_value = "1" * 64
    
    # Mock MongoDB return value with completely different hash
    mock_cursor = MagicMock()
    mock_cursor.__iter__.return_value = [
        {"_id": "diff_id", "imageHash": "0" * 64}
    ]
    pipeline.collection.find.return_value = mock_cursor
    
    result = pipeline.run("test.jpg", 10.0, 20.0)
    
    assert result["duplicateDetected"] is False
    assert result["matchedComplaintId"] is None
    assert result["similarity"] == 0.0
    print("\nPASS\nNo Duplicate")

@patch.object(DuplicateComplaintDetectionPipeline, 'calculate_image_hash')
def test_no_nearby_complaints(mock_hash, pipeline):
    mock_hash.return_value = "1" * 64
    
    # Mock MongoDB return value with empty list
    mock_cursor = MagicMock()
    mock_cursor.__iter__.return_value = []
    pipeline.collection.find.return_value = mock_cursor
    
    result = pipeline.run("test.jpg", 10.0, 20.0)
    
    assert result["duplicateDetected"] is False
    print("\nPASS\nNo Nearby Complaints")

def test_empty_database(pipeline):
    # Ensure no exceptions are thrown when the DB connection is None
    pipeline.collection = None
    results = pipeline.find_nearby_complaints(0.0, 0.0)
    assert results == []
    print("\nPASS\nEmpty Database")

@patch.object(DuplicateComplaintDetectionPipeline, 'calculate_image_hash')
def test_logging(mock_hash, pipeline, caplog):
    mock_hash.return_value = None
    
    with caplog.at_level(logging.WARNING):
        pipeline.run("invalid.jpg", 0.0, 0.0)
        
    assert "Failed to generate perceptual hash." in caplog.text
    print("\nPASS\nLogging")

@patch.object(DuplicateComplaintDetectionPipeline, 'calculate_image_hash')
def test_schema_integrity(mock_hash, pipeline):
    mock_hash.return_value = None
    result = pipeline.run("test.jpg", 0.0, 0.0)
    
    assert "duplicateDetected" in result
    assert "matchedComplaintId" in result
    assert "similarity" in result
    print("\nPASS\nSchema Integrity")
    
    print("\n======================")
    print("All Tests Passed")
    print("======================")
