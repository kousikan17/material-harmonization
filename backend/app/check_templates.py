"""Verify template API endpoints."""
import sys
sys.path.insert(0, '/app')

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

# Login with correct admin credentials
login_response = client.post("/api/auth/login", json={
    "username": "admin",
    "password": "Admin@123"
})
print(f"Login status: {login_response.status_code}")

if login_response.status_code == 200:
    token = login_response.json().get("access_token")
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test standard template
    resp1 = client.get("/api/materials/upload/template", headers=headers)
    print("\n--- STANDARD TEMPLATE ---")
    print(resp1.text.strip())
    print("Has cpse_code:", "cpse_code" in resp1.text)

    # Test single company template
    resp2 = client.get("/api/materials/upload/template?mode=single", headers=headers)
    print("\n--- SINGLE COMPANY TEMPLATE ---")
    print(resp2.text.strip())
    print("Has cpse_code:", "cpse_code" in resp2.text)

print("\nDone testing template endpoints.")
