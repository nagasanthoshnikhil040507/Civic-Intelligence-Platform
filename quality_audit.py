import os
import hashlib
from pathlib import Path
import cv2
import json

data_dir = Path("ai-service/datasets")
classes = ["garbage", "road_damage", "street_light", "water_leakage"]
splits = ["train", "valid", "test"]

def get_hash(filepath):
    h = hashlib.md5()
    with open(filepath, 'rb') as f:
        chunk = f.read(8192)
        while chunk:
            h.update(chunk)
            chunk = f.read(8192)
    return h.hexdigest()

print("================ DATASET QUALITY AUDIT ================")

class_counts = {c: 0 for c in classes}
all_hashes = {}
duplicates = []
corrupted = []

for cls in classes:
    cls_path = data_dir / cls
    if not cls_path.exists():
        continue
        
    for split in splits:
        split_path = cls_path / split
        if not split_path.exists():
            continue
            
        json_path = split_path / "_annotations.coco.json"
        has_json = json_path.exists()
        
        valid_files = set()
        if has_json:
            try:
                with open(json_path, 'r') as f:
                    data = json.load(f)
                    for img in data.get('images', []):
                        valid_files.add(img['file_name'])
            except:
                pass
                
        # Scan images
        for ext in ["*.jpg", "*.png"]:
            for img_path in split_path.glob(ext):
                fname = img_path.name
                if has_json and fname not in valid_files:
                    continue # Skip files not in COCO JSON if JSON exists
                
                class_counts[cls] += 1
                
                # Check corruption
                img = cv2.imread(str(img_path))
                if img is None:
                    corrupted.append(str(img_path))
                    continue
                    
                # Check duplicates
                h = get_hash(img_path)
                if h in all_hashes:
                    duplicates.append((str(img_path), all_hashes[h]))
                else:
                    all_hashes[h] = str(img_path)

print(f"\n--- CLASS IMBALANCE ---")
total_images = sum(class_counts.values())
for cls in classes:
    cnt = class_counts[cls]
    pct = (cnt / total_images * 100) if total_images > 0 else 0
    print(f"{cls}: {cnt} images ({pct:.2f}%)")

print(f"\n--- CORRUPTED IMAGES ({len(corrupted)}) ---")
for c in corrupted:
    print(f"  - {c}")

print(f"\n--- DUPLICATE IMAGES ({len(duplicates)}) ---")
for dup, orig in duplicates[:20]: # Print up to 20
    print(f"  - {dup} is a duplicate of {orig}")
if len(duplicates) > 20:
    print(f"  ... and {len(duplicates) - 20} more.")

