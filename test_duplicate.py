import os
import sys
import pymongo
from pathlib import Path
from bson import ObjectId

# Add app to path
sys.path.append(str(Path(__file__).parent / "ai-service"))

from app.pipelines.duplicate_detection.pipeline import DuplicateComplaintDetectionPipeline

def test_duplicate():
    client = pymongo.MongoClient("mongodb://127.0.0.1:27017/civic_platform")
    db = client["civic_platform"]
    collection = db["complaints"]
    
    # Clean up old
    collection.delete_many({})
    
    # Ensure 2dsphere index!
    collection.create_index([("location", "2dsphere")])
    
    # Insert Complaint A
    complaint_a_id = ObjectId()
    collection.insert_one({
        "_id": complaint_a_id,
        "location": {
            "type": "Point",
            "coordinates": [-122.4194, 37.7749]
        },
        "images": [
            {"url": "https://res.cloudinary.com/demo/image/upload/sample.jpg"}
        ]
    })
    
    # Test DuplicateDetectionPipeline for Complaint B (which is identical to A)
    pipeline = DuplicateComplaintDetectionPipeline(db_uri="mongodb://127.0.0.1:27017/", db_name="civic_platform")
    
    complaint_b_id = str(ObjectId())
    
    res = pipeline.run(
        image_urls=["https://res.cloudinary.com/demo/image/upload/sample.jpg"],
        latitude=37.7749,
        longitude=-122.4194,
        current_complaint_id=complaint_b_id
    )
    
    print("Duplicate Detection Result:", res)

if __name__ == "__main__":
    test_duplicate()
