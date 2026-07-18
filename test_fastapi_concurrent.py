import asyncio
import httpx
import time

async def trigger_analysis(complaint_id: str, client: httpx.AsyncClient):
    print(f"Triggering AI analysis for {complaint_id}...")
    start = time.time()
    try:
        response = await client.post(
            "http://127.0.0.1:8000/api/v1/analyze",
            json={
                "complaintId": complaint_id,
                "imageUrls": ["https://res.cloudinary.com/demo/image/upload/sample.jpg"],
                "latitude": 37.7749,
                "longitude": -122.4194,
                "description": "Test concurrent complaint"
            },
            timeout=15.0
        )
        print(f"[{complaint_id}] Response (Time: {time.time()-start:.2f}s): {response.json()}")
    except Exception as e:
        print(f"[{complaint_id}] Failed: {e}")

async def main():
    async with httpx.AsyncClient() as client:
        # We will trigger two analyses at exactly the same time.
        # This simulates Complaint A and Complaint B being processed concurrently.
        print("Starting concurrent FastAPI test...")
        tasks = [
            trigger_analysis("mock_complaint_A_12345", client),
            trigger_analysis("mock_complaint_B_67890", client)
        ]
        await asyncio.gather(*tasks)

if __name__ == "__main__":
    asyncio.run(main())
