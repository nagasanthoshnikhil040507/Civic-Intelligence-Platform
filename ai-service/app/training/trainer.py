import json
from pathlib import Path
import tensorflow as tf
from app.utils.logger import logger
from app.training.dataset_loader import DatasetLoader

class ModelTrainer:
    def __init__(self, 
                 data_dir: str,
                 model_save_path: str,
                 epochs: int = 10,
                 batch_size: int = 32,
                 learning_rate: float = 0.001,
                 target_size: tuple = (224, 224)):
        self.data_dir = data_dir
        self.model_save_path = Path(model_save_path)
        self.epochs = epochs
        self.batch_size = batch_size
        self.learning_rate = learning_rate
        self.target_size = target_size
        
    def build_model(self, num_classes: int) -> tf.keras.Model:
        """Builds a MobileNetV2 transfer learning model."""
        logger.info(f"Building MobileNetV2 transfer learning model for {num_classes} classes...")
        
        base_model = tf.keras.applications.MobileNetV2(
            input_shape=(self.target_size[0], self.target_size[1], 3),
            include_top=False,
            weights='imagenet'
        )
        base_model.trainable = False
        
        inputs = tf.keras.Input(shape=(self.target_size[0], self.target_size[1], 3))
        # Note: input is expected to be [0, 1] based on our dataset loader
        x = base_model(inputs, training=False)
        x = tf.keras.layers.GlobalAveragePooling2D()(x)
        x = tf.keras.layers.Dropout(0.2)(x)
        outputs = tf.keras.layers.Dense(num_classes, activation='softmax')(x)
        
        model = tf.keras.Model(inputs, outputs)
        
        optimizer = tf.keras.optimizers.Adam(learning_rate=self.learning_rate)
        model.compile(
            optimizer=optimizer,
            loss='sparse_categorical_crossentropy',
            metrics=['accuracy']
        )
        
        logger.info("Model compiled successfully.")
        return model

    def save_label_mapping(self, mapping: dict):
        """Saves the class index to label string mapping."""
        mapping_path = self.model_save_path.parent / "label_mapping.json"
        self.model_save_path.parent.mkdir(parents=True, exist_ok=True)
        with open(mapping_path, 'w') as f:
            json.dump(mapping, f, indent=4)
        logger.info(f"Label mapping saved to {mapping_path}")

    def train(self):
        """Executes the training pipeline."""
        logger.info("Starting training pipeline...")
        
        loader = DatasetLoader(self.data_dir, target_size=self.target_size)
        train_ds, val_ds, label_mapping = loader.load_dataset()
        
        num_classes = len(label_mapping)
        if num_classes == 0:
            logger.error("No classes found. Aborting training.")
            return None

        self.save_label_mapping(label_mapping)

        # Apply batching if dataset is successfully loaded
        if train_ds is not None and val_ds is not None:
            train_ds = train_ds.batch(self.batch_size).prefetch(tf.data.AUTOTUNE)
            val_ds = val_ds.batch(self.batch_size).prefetch(tf.data.AUTOTUNE)
        else:
            logger.warning("Empty TF datasets returned. Check paths.")
            return None

        model = self.build_model(num_classes)
        
        self.model_save_path.parent.mkdir(parents=True, exist_ok=True)
        checkpoint_cb = tf.keras.callbacks.ModelCheckpoint(
            str(self.model_save_path),
            save_best_only=True,
            monitor='val_loss',
            mode='min'
        )

        logger.info(f"Training for {self.epochs} epochs with batch size {self.batch_size}")
        history = model.fit(
            train_ds,
            validation_data=val_ds,
            epochs=self.epochs,
            callbacks=[checkpoint_cb]
        )
        
        logger.info("Training completed successfully.")
        
        history_path = self.model_save_path.parent / "training_history.json"
        with open(history_path, 'w') as f:
            json.dump(history.history, f)
            
        return history

if __name__ == "__main__":
    import os
    
    # Configure paths
    BASE_DIR = Path(__file__).resolve().parent.parent.parent
    DATA_DIR = BASE_DIR / "datasets"
    MODEL_SAVE_PATH = BASE_DIR / "trained_models" / "civic_classifier.keras"
    
    logger.info("================================================")
    logger.info("Initializing Civic Intelligence Training Pipeline")
    logger.info("================================================")
    
    trainer = ModelTrainer(
        data_dir=str(DATA_DIR),
        model_save_path=str(MODEL_SAVE_PATH),
        epochs=10,
        batch_size=32,
        learning_rate=0.001
    )
    
    trainer.train()
