import os
import json
import tensorflow as tf
from pathlib import Path
from typing import Tuple, Dict, List
from app.utils.logger import logger

class DatasetLoader:
    def __init__(self, data_dir: str, target_size: Tuple[int, int] = (224, 224)):
        self.data_dir = Path(data_dir)
        self.target_size = target_size
        self.class_mapping = {}
        self.reverse_mapping = {}

    def _discover_classes(self):
        """Scans the data directory and assigns an integer ID to each dataset folder."""
        classes = [d.name for d in self.data_dir.iterdir() if d.is_dir() and not d.name.startswith('.')]
        classes.sort()
        for idx, cls_name in enumerate(classes):
            self.class_mapping[cls_name] = idx
            self.reverse_mapping[idx] = cls_name
        logger.info(f"Discovered {len(classes)} classes: {self.class_mapping}")

    def _parse_coco_json(self, json_path: Path) -> List[str]:
        """Reads COCO JSON and returns a list of valid image filenames."""
        valid_images = []
        try:
            with open(json_path, 'r') as f:
                data = json.load(f)
                for img in data.get('images', []):
                    valid_images.append(img['file_name'])
        except Exception as e:
            logger.error(f"Failed to parse COCO json {json_path}: {e}")
        return valid_images

    def _load_category_images(self, category_path: Path, split: str) -> Tuple[List[str], List[int]]:
        """Loads image paths and labels for a specific category and split (train/valid/test)."""
        split_dir = category_path / split
        if not split_dir.exists():
            return [], []

        category_name = category_path.name
        class_id = self.class_mapping[category_name]

        coco_json = split_dir / "_annotations.coco.json"
        if coco_json.exists():
            valid_filenames = self._parse_coco_json(coco_json)
            image_paths = [str(split_dir / fname) for fname in valid_filenames if (split_dir / fname).exists()]
        else:
            image_paths = [str(p) for p in split_dir.glob("*.jpg")] + [str(p) for p in split_dir.glob("*.png")]

        labels = [class_id] * len(image_paths)
        return image_paths, labels

    def load_dataset(self) -> Tuple[tf.data.Dataset, tf.data.Dataset, Dict[int, str]]:
        """
        Builds TensorFlow datasets for training and validation.
        """
        self._discover_classes()
        
        train_paths, train_labels = [], []
        val_paths, val_labels = [], []
        
        for category_dir in self.data_dir.iterdir():
            if not category_dir.is_dir() or category_dir.name.startswith('.'):
                continue
                
            t_paths, t_labels = self._load_category_images(category_dir, "train")
            train_paths.extend(t_paths)
            train_labels.extend(t_labels)
            
            v_paths, v_labels = self._load_category_images(category_dir, "test")
            val_paths.extend(v_paths)
            val_labels.extend(v_labels)

        logger.info(f"Loaded {len(train_paths)} training images and {len(val_paths)} validation images.")
        
        if len(train_paths) == 0:
            # Return empty datasets if no paths found (e.g. mock test)
            return None, None, self.reverse_mapping

        def load_and_preprocess(path, label):
            img_data = tf.io.read_file(path)
            img = tf.image.decode_jpeg(img_data, channels=3)
            img = tf.image.resize(img, self.target_size)
            img = img / 255.0
            return img, label

        train_ds = tf.data.Dataset.from_tensor_slices((train_paths, train_labels))
        train_ds = train_ds.shuffle(buffer_size=len(train_paths))
        train_ds = train_ds.map(load_and_preprocess, num_parallel_calls=tf.data.AUTOTUNE)
        
        val_ds = tf.data.Dataset.from_tensor_slices((val_paths, val_labels))
        val_ds = val_ds.map(load_and_preprocess, num_parallel_calls=tf.data.AUTOTUNE)
        
        return train_ds, val_ds, self.reverse_mapping
