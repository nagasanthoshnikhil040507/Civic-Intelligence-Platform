import cv2
import numpy as np
from typing import Dict, Any, Optional, List
import pymongo
import requests
from pathlib import Path
from datetime import datetime, timedelta, timezone
from difflib import SequenceMatcher

from app.utils.logger import logger
from app.config.settings import get_settings

class DuplicateComplaintDetectionPipeline:
    def __init__(self, db_uri: str, db_name: str = "civic_platform", similarity_threshold: float = 0.85) -> None:
        self.similarity_threshold = similarity_threshold
        try:
            self.client = pymongo.MongoClient(db_uri, serverSelectionTimeoutMS=2000)
            self.db = self.client[db_name]
            self.collection = self.db["complaints"]
            
            # Temporary startup verification logging
            host_only = "Unknown"
            if "@" in db_uri:
                host_only = db_uri.split("@")[1].split("/")[0]
            elif "://" in db_uri:
                host_only = db_uri.split("://")[1].split("/")[0]
                
            print("\n[DUPLICATE DB VERIFY]")
            print(f"mongodbHost: {host_only}")
            print(f"database: {db_name}")
            print("collection: complaints\n")
            
            logger.info("DuplicateDetectionPipeline successfully initialized MongoDB connection.")
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            self.client = None
            self.collection = None

    def calculate_image_hash(self, image_path: str) -> Optional[str]:
        try:
            if image_path.startswith("http://") or image_path.startswith("https://"):
                resp = requests.get(image_path, timeout=5)
                resp.raise_for_status()
                image_array = np.asarray(bytearray(resp.content), dtype=np.uint8)
                image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
            else:
                image = cv2.imread(image_path)
                
            if image is None:
                return None
            
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            resized = cv2.resize(gray, (8, 8), interpolation=cv2.INTER_AREA)
            avg = resized.mean()
            diff = resized > avg
            hash_str = ''.join(['1' if bit else '0' for bit in diff.flatten()])
            return hash_str
        except Exception as e:
            logger.error(f"Error calculating perceptual image hash: {e}")
            return None

    def find_nearby_complaints(self, latitude: float, longitude: float, radius_meters: int = 30) -> List[Dict[str, Any]]:
        if self.collection is None:
            return []

        try:
            # 7-day time window for duplicate detection
            time_threshold = datetime.utcnow() - timedelta(days=7)
            
            query = {
                "createdAt": {"$gte": time_threshold},
                "location": {
                    "$near": {
                        "$geometry": {
                            "type": "Point",
                            "coordinates": [longitude, latitude]
                        },
                        "$maxDistance": radius_meters
                    }
                }
            }
            
            cursor = self.collection.find(query)
            candidates = list(cursor)
            
            print(f"\n[DUPLICATE DB CHECK]")
            print(f"candidateCollectionCount: {len(candidates)}")
            print(f"queryCoordinates: [{longitude}, {latitude}]\n")
            
            return candidates
        except Exception as e:
            logger.error(f"Error executing geospatial 2dsphere query: {e}")
            return []

    def compare_hashes(self, hash1: str, hash2: str) -> float:
        if not hash1 or not hash2 or len(hash1) != len(hash2):
            return 0.0
        hamming_distance = sum(c1 != c2 for c1, c2 in zip(hash1, hash2))
        return 1.0 - (hamming_distance / len(hash1))
        
    def compare_description(self, desc1: str, desc2: str) -> float:
        if not desc1 or not desc2:
            return 0.0
        return SequenceMatcher(None, desc1.lower(), desc2.lower()).ratio()

    def run(self, image_urls: List[str], latitude: float, longitude: float, current_complaint_id: str, description: str = "", title: str = "") -> Dict[str, Any]:
        logger.info(f"Running Duplicate Detection Pipeline for coordinates: [{latitude}, {longitude}]")
        
        response = {
            "duplicateDetected": False,
            "matchedComplaintId": None,
            "similarity": 0.0,
            "confidence": 0.0,
            "duplicateLevel": "NONE",
            "locationScore": 0.0,
            "textScore": 0.0,
            "imageScore": None
        }
        
        # 1. Calculate new image hashes if available
        new_hashes = []
        for url in image_urls:
            h = self.calculate_image_hash(url)
            if h:
                new_hashes.append(h)
                
        # 2. Find nearby complaints
        nearby_complaints = self.find_nearby_complaints(latitude, longitude, radius_meters=500)
        logger.info(f"Found {len(nearby_complaints)} existing complaints within 500m radius and 7d window.")
        
        if not nearby_complaints:
            return response
            
        best_match_id = None
        best_confidence = 0.0
        best_scores = {}
        
        for complaint in nearby_complaints:
            try:
                comp_id = str(complaint.get("_id"))
                if comp_id == current_complaint_id:
                    continue
                    
                # Prepare comparison data
                stored_hashes = []
                stored_hash = complaint.get("imageHash")
                if not stored_hash and "aiInsights" in complaint:
                    stored_hash = complaint["aiInsights"].get("imageHash")
                    
                if stored_hash:
                    stored_hashes.append(stored_hash)
                elif "images" in complaint and complaint["images"]:
                    for img in complaint["images"]:
                        try:
                            img_url = img.get("url") if isinstance(img, dict) else img
                            if isinstance(img_url, dict):
                                img_url = img_url.get("url")
                            if img_url and isinstance(img_url, str):
                                if img_url.startswith("/uploads/") or img_url.startswith("uploads/"):
                                    base_dir = Path(__file__).resolve().parent.parent.parent.parent.parent
                                    img_url = str(base_dir / "server" / "public" / img_url.lstrip("/"))
                                h = self.calculate_image_hash(img_url)
                                if h:
                                    stored_hashes.append(h)
                        except Exception:
                            pass
                text_score = self.compare_description(description, complaint.get("description", ""))
                image_score = None
                if new_hashes and stored_hashes:
                    image_score = max([self.compare_hashes(h1, h2) for h1 in new_hashes for h2 in stored_hashes])
                
                # Assume location is nearby (since it passed geospatial query)
                location_score = 1.0
                
                # WEIGHTED CONFIDENCE CALCULATION
                if image_score is not None:
                    # CASE: Images exist
                    confidence = (text_score * 0.4) + (image_score * 0.4) + (location_score * 0.2)
                else:
                    # CASE: No images (or failed to hash)
                    confidence = (text_score * 0.7) + (location_score * 0.3)
                    
                print(f"\n[DUPLICATE DEBUG]")
                print(f"candidateId: {comp_id}")
                print(f"candidateTitle: {complaint.get('title', 'Unknown')}")
                print(f"distanceMeters: < 500m (GeoJSON match)")
                print(f"locationScore: {location_score:.2f}")
                print(f"textScore: {text_score:.2f}")
                print(f"imageScore: {image_score if image_score is not None else 'None'}")
                print(f"finalConfidence: {confidence:.2f}")
                
                if confidence > best_confidence:
                    best_confidence = confidence
                    best_match_id = comp_id
                    best_scores = {
                        "textScore": text_score,
                        "imageScore": image_score,
                        "locationScore": location_score
                    }
                    
            except Exception as e:
                logger.error(f"Error evaluating candidate complaint {complaint.get('_id')}: {e}")
                
        # Set Final Response
        response["confidence"] = round(best_confidence, 2)
        response["textScore"] = round(best_scores.get("textScore", 0.0), 2)
        response["locationScore"] = round(best_scores.get("locationScore", 0.0), 2)
        response["imageScore"] = round(best_scores.get("imageScore", 0.0), 2) if best_scores.get("imageScore") is not None else None
        
        if best_confidence >= 0.80:
            response["duplicateDetected"] = True
            response["duplicateLevel"] = "HIGH"
            response["matchedComplaintId"] = best_match_id
            response["similarity"] = round(best_confidence, 2)
        elif best_confidence >= 0.60:
            response["duplicateDetected"] = True
            response["duplicateLevel"] = "POSSIBLE"
            response["matchedComplaintId"] = best_match_id
            response["similarity"] = round(best_confidence, 2)
            
        print(f"[DUPLICATE DEBUG] duplicateLevel: {response['duplicateLevel']}\n")
        
        # Write debug data to disk
        try:
            import json
            debug_comparisons = []
            with open(f"C:/Users/chinn/Downloads/Civic Intelligence Platform/debug_dup_{current_complaint_id}.json", "w") as f:
                json.dump({
                    "new_complaint_id": current_complaint_id,
                    "new_hashes": new_hashes,
                    "nearby_complaints_count": len(nearby_complaints),
                    "comparisons": debug_comparisons if 'debug_comparisons' in locals() else [],
                    "best_match_id": best_match_id,
                    "query_latitude": latitude,
                    "query_longitude": longitude
                }, f)
        except Exception as e:
            logger.error(f"Failed to write debug file: {e}")
            
        return response
