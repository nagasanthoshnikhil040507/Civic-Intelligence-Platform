import pytest
from unittest.mock import patch, MagicMock
from pathlib import Path
from app.services.model_loader import model_loader

@pytest.fixture(autouse=True)
def reset_loader():
    """Reset the singleton before each test."""
    model_loader.clear_cache()
    yield
    model_loader.clear_cache()

@patch("tensorflow.keras.models.load_model")
@patch("pathlib.Path.exists")
def test_lazy_loading(mock_exists, mock_tf_load):
    """Verify lazy loading behavior."""
    mock_exists.return_value = True
    mock_tf_load.return_value = MagicMock(name="MockTFModel")
    
    assert not model_loader.is_model_loaded("road_damage")
    
    # get_model should trigger load_model lazily
    model = model_loader.get_model("road_damage")
    
    assert model is not None
    assert model_loader.is_model_loaded("road_damage")
    mock_tf_load.assert_called_once()

@patch("tensorflow.keras.models.load_model")
@patch("pathlib.Path.exists")
def test_cache_reuse(mock_exists, mock_tf_load):
    """Verify cache reuse (no duplicate loading)."""
    mock_exists.return_value = True
    mock_tf_load.return_value = MagicMock(name="MockTFModel")
    
    # Call multiple times
    model1 = model_loader.get_model("garbage")
    model2 = model_loader.get_model("garbage")
    model3 = model_loader.get_model("garbage")
    
    assert model1 is model2 is model3
    # tf.keras.models.load_model should only be called ONCE
    mock_tf_load.assert_called_once()

@patch("pathlib.Path.exists")
def test_missing_model_handling(mock_exists):
    """Verify missing model handling."""
    mock_exists.return_value = False
    
    model = model_loader.get_model("non_existent_model")
    
    assert model is None
    assert not model_loader.is_model_loaded("non_existent_model")

@patch("tensorflow.keras.models.load_model")
@patch("pathlib.Path.exists")
def test_unloading(mock_exists, mock_tf_load):
    """Verify unloading single model."""
    mock_exists.return_value = True
    mock_tf_load.return_value = MagicMock()
    
    model_loader.get_model("street_light")
    assert model_loader.is_model_loaded("street_light")
    
    success = model_loader.unload_model("street_light")
    assert success is True
    assert not model_loader.is_model_loaded("street_light")

@patch("tensorflow.keras.models.load_model")
@patch("pathlib.Path.exists")
def test_cache_clearing(mock_exists, mock_tf_load):
    """Verify cache clearing."""
    mock_exists.return_value = True
    mock_tf_load.return_value = MagicMock()
    
    model_loader.get_model("model1")
    model_loader.get_model("model2")
    
    assert len(model_loader.list_loaded_models()) == 2
    
    model_loader.clear_cache()
    
    assert len(model_loader.list_loaded_models()) == 0

@patch("tensorflow.keras.models.load_model")
@patch("pathlib.Path.exists")
def test_loaded_model_listing(mock_exists, mock_tf_load):
    """Verify loaded model listing."""
    mock_exists.return_value = True
    mock_tf_load.return_value = MagicMock()
    
    model_loader.get_model("water_leakage")
    model_loader.get_model("road_damage")
    
    loaded = model_loader.list_loaded_models()
    assert "water_leakage" in loaded
    assert "road_damage" in loaded
    assert len(loaded) == 2

def test_logging_verification(caplog):
    """Verify logging."""
    import logging
    with caplog.at_level(logging.INFO):
        model_loader.clear_cache()
    assert "Cleared all models from cache" in caplog.text
