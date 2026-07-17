import pytest
import logging
from app.pipelines.department_recommendation.pipeline import DepartmentRecommendationPipeline

@pytest.fixture
def pipeline():
    return DepartmentRecommendationPipeline()

def test_garbage_mapping(pipeline):
    result = pipeline.run({
        "processingStatus": "completed",
        "categoryPrediction": "garbage"
    })
    assert result.get("departmentRecommendation") == "Sanitation Department"
    print("\nPASS\nGarbage Mapping")

def test_road_damage_mapping(pipeline):
    result = pipeline.run({
        "processingStatus": "completed",
        "categoryPrediction": "road_damage"
    })
    assert result.get("departmentRecommendation") == "Roads & Buildings Department"
    print("\nPASS\nRoad Damage Mapping")

def test_street_light_mapping(pipeline):
    result = pipeline.run({
        "processingStatus": "completed",
        "categoryPrediction": "street_light"
    })
    assert result.get("departmentRecommendation") == "Electrical Department"
    print("\nPASS\nStreet Light Mapping")

def test_water_leakage_mapping(pipeline):
    result = pipeline.run({
        "processingStatus": "completed",
        "categoryPrediction": "water_leakage"
    })
    assert result.get("departmentRecommendation") == "Water Supply Department"
    print("\nPASS\nWater Leakage Mapping")

def test_unknown_category(pipeline):
    result = pipeline.run({
        "processingStatus": "completed",
        "categoryPrediction": "tree"
    })
    assert result.get("departmentRecommendation") == "Unknown Department"
    print("\nPASS\nUnknown Category")

def test_failed_status_handling(pipeline):
    result = pipeline.run({
        "processingStatus": "FAILED",
        "categoryPrediction": "garbage"
    })
    assert "departmentRecommendation" not in result
    print("\nPASS\nFailed Status Handling")

def test_model_not_available(pipeline):
    result = pipeline.run({
        "processingStatus": "MODEL_NOT_AVAILABLE"
    })
    assert "departmentRecommendation" not in result
    print("\nPASS\nMODEL_NOT_AVAILABLE")

def test_empty_dictionary(pipeline):
    result = pipeline.run({})
    assert result == {}
    print("\nPASS\nEmpty Dictionary")

def test_schema_integrity(pipeline):
    original = {
        "processingStatus": "completed",
        "categoryPrediction": "garbage",
        "confidence": 0.99,
        "analyzedAt": "2026-07-15T00:00:00Z"
    }
    result = pipeline.run(original)
    
    assert result["processingStatus"] == "completed"
    assert result["categoryPrediction"] == "garbage"
    assert result["confidence"] == 0.99
    assert result["analyzedAt"] == "2026-07-15T00:00:00Z"
    assert result["departmentRecommendation"] == "Sanitation Department"
    
    # Ensure original remains unmodified (pass by reference guard check)
    assert "departmentRecommendation" not in original
    print("\nPASS\nSchema Integrity")

def test_logging(pipeline, caplog):
    with caplog.at_level(logging.INFO):
        pipeline.run({
            "processingStatus": "FAILED",
            "categoryPrediction": "garbage"
        })
        assert "Skipping department recommendation" in caplog.text

    caplog.clear()
    
    with caplog.at_level(logging.INFO):
        pipeline.run({
            "processingStatus": "completed",
            "categoryPrediction": "road_damage"
        })
        assert "Executing department recommendation pipeline..." in caplog.text
        assert "Successfully mapped category 'road_damage' to 'Roads & Buildings Department'." in caplog.text
        
    print("\nPASS\nLogging")
