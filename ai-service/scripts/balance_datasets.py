import os
import shutil
import random
import logging
import json
from pathlib import Path

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

def filter_coco_json(json_path: Path, kept_filenames: set):
    """
    Updates a COCO JSON file to keep only annotations and metadata 
    for the provided kept_filenames.
    """
    if not json_path.exists():
        return

    try:
        with open(json_path, 'r') as f:
            data = json.load(f)
            
        original_images_count = len(data.get('images', []))
        original_annotations_count = len(data.get('annotations', []))
        
        # Filter images
        kept_images = []
        kept_image_ids = set()
        
        for img in data.get('images', []):
            if img.get('file_name') in kept_filenames:
                kept_images.append(img)
                kept_image_ids.add(img.get('id'))
                
        # Filter annotations
        kept_annotations = []
        for ann in data.get('annotations', []):
            if ann.get('image_id') in kept_image_ids:
                kept_annotations.append(ann)
                
        data['images'] = kept_images
        data['annotations'] = kept_annotations
        
        # Save back
        with open(json_path, 'w') as f:
            json.dump(data, f, indent=4)
            
        logger.debug(f"Updated {json_path.name}: Images {original_images_count}->{len(kept_images)}, Annotations {original_annotations_count}->{len(kept_annotations)}")
            
    except Exception as e:
        logger.error(f"Error processing {json_path}: {e}")

def balance_datasets(base_dir: Path, backup_dir: Path, target_counts: dict):
    classes = [d.name for d in base_dir.iterdir() if d.is_dir() and not d.name.startswith('.')]
    splits = ["train", "valid", "test"]
    
    # Pre-flight check and summary preparation
    summary_lines = []
    actions_to_take = [] # (split_dir, kept_files, files_to_delete, json_path)
    
    for cls in classes:
        cls_path = base_dir / cls
        summary_lines.append(f"\nCategory: {cls}")
        
        for split in splits:
            split_path = cls_path / split
            target = target_counts.get(split, 0)
            
            if not split_path.exists():
                summary_lines.append(f"{split.capitalize():<5} : Missing")
                continue
                
            json_path = split_path / "_annotations.coco.json"
            
            # Gather all image files
            image_files = []
            for ext in ["*.jpg", "*.png", "*.jpeg"]:
                image_files.extend(list(split_path.glob(ext)))
                
            total_images = len(image_files)
            
            if total_images > target:
                # Need to downsample
                random.seed(42)
                kept_files = random.sample(image_files, target)
                kept_names = {f.name for f in kept_files}
                files_to_delete = [f for f in image_files if f.name not in kept_names]
                
                summary_lines.append(f"{split.capitalize():<5} : {total_images} -> {target}")
                actions_to_take.append((split_path, kept_names, files_to_delete, json_path))
            else:
                summary_lines.append(f"{split.capitalize():<5} : {total_images} -> {total_images} (Warning: Below target {target})")
                if total_images < target:
                    logger.warning(f"{cls}/{split} has only {total_images} images (Target: {target})")

    # Print summary
    print("\n================ DATASET BALANCING SUMMARY ================")
    for line in summary_lines:
        print(line)
    print("===========================================================\n")
    
    if not actions_to_take:
        print("No actions required. Datasets are already balanced or below targets.")
        return

    # Ask for confirmation
    choice = input(f"Are you sure you want to proceed with balancing? This will create a backup at {backup_dir.name} (Y/N): ")
    if choice.strip().upper() != 'Y':
        print("Aborted by user.")
        return
        
    print(f"\nCreating backup at: {backup_dir}")
    try:
        if backup_dir.exists():
            shutil.rmtree(backup_dir)
        shutil.copytree(base_dir, backup_dir)
        print("Backup created successfully.")
    except Exception as e:
        logger.error(f"Failed to create backup: {e}")
        print("Aborting to prevent data loss.")
        return

    print("\nBalancing datasets...")
    for split_path, kept_names, files_to_delete, json_path in actions_to_take:
        # Delete images
        for f in files_to_delete:
            try:
                f.unlink()
            except Exception as e:
                logger.error(f"Failed to delete {f}: {e}")
                
        # Filter JSON
        filter_coco_json(json_path, kept_names)
        
    print("Dataset balancing completed successfully.")

if __name__ == "__main__":
    BASE_DIR = Path(__file__).resolve().parent.parent / "datasets"
    BACKUP_DIR = Path(__file__).resolve().parent.parent / "datasets_backup"
    
    TARGET_COUNTS = {
        "train": 140,
        "valid": 30,
        "test": 30
    }
    
    if not BASE_DIR.exists():
        logger.error(f"Dataset directory not found: {BASE_DIR}")
    else:
        balance_datasets(BASE_DIR, BACKUP_DIR, TARGET_COUNTS)
