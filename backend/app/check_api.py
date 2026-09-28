"""Verify ministries API returns data with proper auth."""
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
    
    # Test ministries endpoint
    ministries_resp = client.get("/api/masters/administrative-ministries", headers=headers)
    print(f"\nMinistries API status: {ministries_resp.status_code}")
    if ministries_resp.status_code == 200:
        data = ministries_resp.json()
        print(f"Ministries count: {len(data)}")
        for m in data:
            print(f"  - {m['name']} ({m['code']})")
    else:
        print(f"Error: {ministries_resp.text}")
    
    # Test hierarchy endpoint
    hierarchy_resp = client.get("/api/masters/hierarchy", headers=headers)
    print(f"\nHierarchy API status: {hierarchy_resp.status_code}")
    if hierarchy_resp.status_code == 200:
        data = hierarchy_resp.json()
        print(f"Sectors count: {len(data)}")
        for s in data:
            cgs = s.get('cognate_groups', [])
            print(f"  - {s['name']}: {len(cgs)} cognate groups")
            for cg in cgs[:3]:
                print(f"      * {cg['name']}")
    else:
        print(f"Error: {hierarchy_resp.text}")
else:
    print(f"Login failed: {login_response.text}")
