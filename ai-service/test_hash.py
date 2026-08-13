import cv2
import numpy as np
import requests
import sys

def calculate_image_hash(image_path: str):
    try:
        print(f"Fetching {image_path}...")
        resp = requests.get(image_path, timeout=5)
        print(f"Status: {resp.status_code}")
        resp.raise_for_status()
        
        image_array = np.asarray(bytearray(resp.content), dtype=np.uint8)
        image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
        
        if image is None:
            print("CV2 failed to decode image!")
            return None
            
        print("Image decoded successfully!")
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        resized = cv2.resize(gray, (8, 8), interpolation=cv2.INTER_AREA)
        avg = resized.mean()
        diff = resized > avg
        hash_str = ''.join(['1' if bit else '0' for bit in diff.flatten()])
        return hash_str
    except Exception as e:
        print(f"Error: {e}")
        return None

def test():
    h1 = calculate_image_hash('https://res.cloudinary.com/nz2zm3kv/image/upload/v1786638005/complaints/tccjjtu71uf1udoqeuyv.jpg')
    h2 = calculate_image_hash('https://res.cloudinary.com/nz2zm3kv/image/upload/v1786638019/complaints/ekweaaidq3fpyfdju80e.jpg')
    print("Hash 1:", h1)
    print("Hash 2:", h2)
    if h1 and h2:
        hamming_distance = sum(c1 != c2 for c1, c2 in zip(h1, h2))
        sim = 1.0 - (hamming_distance / len(h1))
        print(f"Similarity: {sim*100}%")

test()
