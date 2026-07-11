import pytest
import tensorflow as tf
import numpy as np
from pathlib import Path
import json

from app.training.dataset_loader import DatasetLoader
from app.training.trainer import ModelTrainer

@pytest.fixture
def synthetic_data(tmp_path):
    data_dir = tmp_path / "datasets"
    rd_dir = data_dir / "road_damage" / "train"
    rd_dir.mkdir(parents=True)
    gb_dir = data_dir / "garbage" / "train"
    gb_dir.mkdir(parents=True)
    return str(data_dir)

def test_class_discovery_and_dataset_loader(synthetic_data):
    """Verify class discovery based on dataset directories."""
    loader = DatasetLoader(synthetic_data)
    loader._discover_classes()
    assert len(loader.class_mapping) == 2
    assert "garbage" in loader.class_mapping
    assert "road_damage" in loader.class_mapping

def test_model_creation_and_compilation(synthetic_data):
    """Verify TensorFlow MobileNetV2 creation and compilation."""
    trainer = ModelTrainer(data_dir=synthetic_data, model_save_path="dummy.keras")
    model = trainer.build_model(num_classes=4)
    
    assert isinstance(model, tf.keras.Model)
    assert model.output_shape == (None, 4)
    assert model.optimizer is not None
    assert model.loss == "sparse_categorical_crossentropy"

@pytest.mark.filterwarnings("ignore")
def test_successful_one_epoch_training(synthetic_data, tmp_path):
    """Verify one-epoch training execution and artifact generation."""
    save_path = tmp_path / "models" / "civic_classifier.keras"
    trainer = ModelTrainer(
        data_dir=synthetic_data, 
        model_save_path=str(save_path),
        epochs=1,
        batch_size=2
    )
    
    def mock_load_dataset():
        x = np.random.rand(4, 224, 224, 3).astype(np.float32)
        y = np.array([0, 1, 0, 1]).astype(np.int32)
        ds = tf.data.Dataset.from_tensor_slices((x, y))
        mapping = {0: "garbage", 1: "road_damage"}
        return ds, ds, mapping
        
    import app.training.trainer
    with pytest.MonkeyPatch.context() as m:
        m.setattr(app.training.trainer.DatasetLoader, "load_dataset", mock_load_dataset)
        
        history = trainer.train()
        
        # Verify training metrics recorded
        assert "loss" in history.history
        assert "accuracy" in history.history
        
        # Verify model saved successfully
        assert save_path.exists()
        
        # Verify label mapping saved
        mapping_path = save_path.parent / "label_mapping.json"
        assert mapping_path.exists()
        with open(mapping_path, "r") as f:
            mapping = json.load(f)
            assert mapping["0"] == "garbage"
            assert mapping["1"] == "road_damage"
