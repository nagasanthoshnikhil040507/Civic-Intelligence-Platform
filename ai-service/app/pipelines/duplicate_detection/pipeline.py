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
            return list(cursor)
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
                    
                    "stored_hashes": stored_hashes
                })
                
                # Dynamic Duplicate Rule:
                # Rule A: Image >= 85%
                # Rule B: Description >= 80%
                # Rule C: Image >= 70% AND Description >= 60%
                is_duplicate = False
                if max_sim_for_this_complaint >= 0.85:
                    is_duplicate = True
                elif desc_sim >= 0.80:
                    is_duplicate = True
                elif max_sim_for_this_complaint >= 0.70 and desc_sim >= 0.60:
                    is_duplicate = True

                if is_duplicate:
                    if max_sim_for_this_complaint > highest_image_sim or desc_sim > highest_desc_sim:
                        highest_image_sim = max(highest_image_sim, max_sim_for_this_complaint)
                        highest_desc_sim = max(highest_desc_sim, desc_sim)
                        best_match_id = comp_id
                        best_match_complaint = complaint
            except Exception as e:
                logger.error(f"EXCEPTION during comparison with {complaint.get('_id', 'unknown')}: {e}")
                    
        if best_match_id and best_match_complaint:
            logger.info(f"Duplicate DETECTED! Matched Complaint ID: {best_match_id}")
            
            # Extract duplicate context
            report_count = int(best_match_complaint.get("reportCount", 1))
            created_at = best_match_complaint.get("createdAt")
            age_hours = 0.0
            if created_at:
                # Ensure timezone aware
                if created_at.tzinfo is None:
                    created_at = created_at.replace(tzinfo=timezone.utc)
                age_delta = datetime.now(timezone.utc) - created_at
                age_hours = age_delta.total_seconds() / 3600.0
            
            # Dynamic Confidence Score (0-100) based on similarities and report count
            # Base confidence from similarities
            base_conf = ((highest_image_sim * 0.7) + (highest_desc_sim * 0.3)) * 100
            # Boost based on report count (max +15)
            boost = min(report_count * 5, 15)
            final_conf = min(base_conf + boost, 100.0)
            
            response["duplicateDetected"] = True
            response["matchedComplaintId"] = best_match_id
            response["similarity"] = round(highest_image_sim, 4)
            response["reportCount"] = report_count
            response["complaintAgeHours"] = round(age_hours, 2)
            response["confidenceScore"] = round(final_conf, 2)
        else:
            logger.info(f"No duplicate detected.")
            # Default confidence for non-duplicates based strictly on the current image and desc? 
        # Write debug data to disk
        try:
            import json
            debug_comparisons = []
            if 'best_match_id' not in locals(): best_match_id = None
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
