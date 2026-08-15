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
            # 24-hour time window
            time_threshold = datetime.utcnow() - timedelta(hours=24)
            
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

    def run(self, image_urls: List[str], latitude: float, longitude: float, current_complaint_id: str, description: str = "") -> Dict[str, Any]:
        logger.info(f"Running Duplicate Detection Pipeline for coordinates: [{latitude}, {longitude}]")
        
        response = {
            "duplicateDetected": False,
            "matchedComplaintId": None,
            "similarity": 0.0,
            "reportCount": 1,
            "complaintAgeHours": 0.0,
            "confidenceScore": 0.0
        }
        
        import traceback
        
        debug_comparisons = []
        new_hashes = []
        for url in image_urls:
            h = self.calculate_image_hash(url)
            if h:
                new_hashes.append(h)
                
        if not new_hashes:
            logger.warning("Skipping duplicate detection: Failed to generate perceptual hash.")
            return response
            
        nearby_complaints = self.find_nearby_complaints(latitude, longitude, radius_meters=30)
        logger.info(f"Found {len(nearby_complaints)} existing complaints within 30m radius and 24h window.")
        
        best_match_id = None
        highest_image_sim = 0.0
        highest_desc_sim = 0.0
        best_match_complaint = None
        
        for complaint in nearby_complaints:
            try:
                comp_id = str(complaint.get("_id"))
                if comp_id == current_complaint_id:
                    continue
                    
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
                        except Exception as inner_e:
                            pass
                
                # Image Similarity
                max_sim_for_this_complaint = 0.0
                for new_hash in new_hashes:
                    for s_hash in stored_hashes:
                        sim = self.compare_hashes(new_hash, s_hash)
                        if sim > max_sim_for_this_complaint:
                            max_sim_for_this_complaint = sim
                            
                # Description Similarity
                stored_desc = complaint.get("description", "")
                desc_sim = self.compare_description(description, stored_desc)
                
                logger.info(f"Comparing with {comp_id} -> Img Sim: {max_sim_for_this_complaint*100:.1f}%, Desc Sim: {desc_sim*100:.1f}%")
                
                debug_comparisons.append({
                    "comp_id": comp_id,
                    "img_sim": max_sim_for_this_complaint,
                    "desc_sim": desc_sim,
                    "new_hashes": new_hashes,
                    "stored_hashes": stored_hashes
                })
                
                # Rule: Image >= 85% AND Desc >= 70%
                if max_sim_for_this_complaint >= 0.85 and desc_sim >= 0.70:
                    if max_sim_for_this_complaint > highest_image_sim:
                        highest_image_sim = max_sim_for_this_complaint
                        highest_desc_sim = desc_sim
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
