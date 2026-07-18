import cv2
import numpy as np
from typing import Dict, Any, Optional, List
import pymongo
import requests
from pathlib import Path
import pymongo

from app.utils.logger import logger
from app.config.settings import get_settings

class DuplicateComplaintDetectionPipeline:
    """
    Pipeline responsible for detecting duplicate civic complaints by comparing
    perceptual image hashes of geographically nearby complaints using MongoDB.
    """

    def __init__(self, db_uri: str, db_name: str = "civic_platform", similarity_threshold: float = 0.90) -> None:
        """
        Initializes the DuplicateComplaintDetectionPipeline.

        Args:
            db_uri (str): MongoDB connection URI. Defaults to localhost.
            db_name (str): The name of the MongoDB database containing the complaints.
            similarity_threshold (float): Minimum similarity score [0.0-1.0] to classify 
                as a duplicate. Defaults to 0.90.
        """
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
        """
        Calculates a perceptual Average Hash (aHash) for the given image using OpenCV.
        This provides a 64-bit hash representing the structure of the image, making it
        resistant to minor scaling and compression artifacts.

        Args:
            image_path (str): The absolute or relative file path to the uploaded image.

        Returns:
            Optional[str]: The computed binary hash as a 64-character string of '0's and '1's, 
                or None if the image fails to load.
        """
        try:
            # Step 1: Load the uploaded complaint image using OpenCV
            if image_path.startswith("http://") or image_path.startswith("https://"):
                logger.info(f"Downloading image from URL: {image_path}")
                resp = requests.get(image_path, timeout=5)
                resp.raise_for_status()
                image_array = np.asarray(bytearray(resp.content), dtype=np.uint8)
                image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
            else:
                image = cv2.imread(image_path)
                
            if image is None:
                logger.error(f"Failed to load image at {image_path} for hashing.")
                return None
            
            # Step 2: Generate an image hash
            # Convert to grayscale and resize to an 8x8 block
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            resized = cv2.resize(gray, (8, 8), interpolation=cv2.INTER_AREA)
            
            # Compute average pixel intensity across the 64 pixels
            avg = resized.mean()
            
            # Construct the binary hash string (1 if pixel > avg else 0)
            diff = resized > avg
            hash_str = ''.join(['1' if bit else '0' for bit in diff.flatten()])
            return hash_str
            
        except Exception as e:
            logger.error(f"Error calculating perceptual image hash: {e}")
            return None

    def find_nearby_complaints(self, latitude: float, longitude: float, radius_meters: int = 100) -> List[Dict[str, Any]]:
        """
        Searches MongoDB for nearby complaints using a 2dsphere geospatial $near query.

        Args:
            latitude (float): GPS Latitude of the new complaint.
            longitude (float): GPS Longitude of the new complaint.
            radius_meters (int): Search radius in meters. Default is 100.

        Returns:
            List[Dict[str, Any]]: A list of nearby complaint MongoDB documents.
        """
        if self.collection is None:
            logger.warning("MongoDB collection not active. Returning empty nearby list.")
            return []

        try:
            # MongoDB $near requires a GeoJSON Point format. 
            # Note: GeoJSON strict ordering requires [Longitude, Latitude]
            query = {
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
            nearby_docs = list(cursor)
            return nearby_docs
        except Exception as e:
            logger.error(f"Error executing geospatial 2dsphere query: {e}")
            return []

    def compare_hashes(self, hash1: str, hash2: str) -> float:
        """
        Compares two perceptual string hashes and returns a similarity score.

        Args:
            hash1 (str): The first 64-bit string hash.
            hash2 (str): The second 64-bit string hash.

        Returns:
            float: Similarity score (1.0 = identical, 0.0 = completely different).
        """
        if not hash1 or not hash2 or len(hash1) != len(hash2):
            return 0.0
            
        # Calculate Hamming distance (count of differing bits)
        hamming_distance = sum(c1 != c2 for c1, c2 in zip(hash1, hash2))
        
        # Convert Hamming distance to a normalized similarity percentage (1.0 - (diff / length))
        similarity = 1.0 - (hamming_distance / len(hash1))
        return similarity

    def run(self, image_urls: List[str], latitude: float, longitude: float, current_complaint_id: str) -> Dict[str, Any]:
        """
        Executes the end-to-end duplicate complaint detection pipeline.

        Step 1: Load the image.
        Step 2: Generate an image hash.
        Step 3: Search for nearby complaints via geospatial queries.
        Step 4: Compare similarity against stored hashes.
        Step 5: Return duplicate matching results.

        Args:
            image_urls (List[str]): The paths to the newly uploaded complaint images.
            latitude (float): The geographical latitude.
            longitude (float): The geographical longitude.
            current_complaint_id (str): ID of the complaint being processed to exclude it.

        Returns:
            Dict[str, Any]: A dictionary containing duplicate detection results.
                Format: {"duplicateDetected": bool, "matchedComplaintId": str|None, "similarity": float}
        """
        logger.info(f"Running Duplicate Detection Pipeline for coordinates: [{latitude}, {longitude}]")
        
        # Base fallback response
        response = {
            "duplicateDetected": False,
            "matchedComplaintId": None,
            "similarity": 0.0
        }
        
        # Step 1 & 2: Calculate the perceptual hash of the incoming images
        new_hashes = []
        for url in image_urls:
            h = self.calculate_image_hash(url)
            if h:
                new_hashes.append(h)
                
        if not new_hashes:
            logger.warning("Skipping duplicate detection: Failed to generate perceptual hash for any image.")
            return response
            
        # Step 3: Fetch geographically proximate complaints
        nearby_complaints = self.find_nearby_complaints(latitude, longitude, radius_meters=100)
        logger.info(f"Found {len(nearby_complaints)} existing complaints within 100m radius.")
        
        best_match_id = None
        highest_similarity = 0.0
        
        # Step 4: Iterative Hash Comparison
        for complaint in nearby_complaints:
            comp_id = str(complaint.get("_id"))
            if comp_id == current_complaint_id:
                logger.info(f"Excluding current complaint {comp_id} from duplicate check.")
                continue
                
            stored_hashes = []
            
            # Extract stored image hash safely
            stored_hash = complaint.get("imageHash")
            if not stored_hash and "aiInsights" in complaint:
                stored_hash = complaint["aiInsights"].get("imageHash")
                
            if stored_hash:
                stored_hashes.append(stored_hash)
            elif "images" in complaint and complaint["images"]:
                logger.info(f"Computing hashes on-the-fly for complaint {comp_id}")
                for img in complaint["images"]:
                    img_url = img.get("url")
                    if img_url:
                        if img_url.startswith("/uploads/") or img_url.startswith("uploads/"):
                            base_dir = Path(__file__).resolve().parent.parent.parent.parent.parent
                            img_url = str(base_dir / "server" / "public" / img_url.lstrip("/"))
                        h = self.calculate_image_hash(img_url)
                        if h:
                            stored_hashes.append(h)
            
            for new_hash in new_hashes:
                for s_hash in stored_hashes:
                    similarity = self.compare_hashes(new_hash, s_hash)
                    logger.info(f"Comparing with {comp_id} -> Similarity: {similarity*100:.1f}%")
                    
                    if similarity > highest_similarity:
                        highest_similarity = similarity
                        best_match_id = comp_id
                    
        # Step 5: Decision Logic & Output Structuring
        if highest_similarity >= self.similarity_threshold and best_match_id:
            logger.info(f"Duplicate DETECTED! Matched Complaint ID: {best_match_id} (Similarity: {highest_similarity*100:.1f}%)")
            response["duplicateDetected"] = True
            response["matchedComplaintId"] = best_match_id
            response["similarity"] = round(highest_similarity, 4)
        else:
            logger.info(f"No duplicate detected. Highest local similarity was {highest_similarity*100:.1f}%.")
            response["similarity"] = round(highest_similarity, 4)
            
        return response
