"""Verify template API endpoints."""
import sys
import io
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
    
    # 1. Test Bulk Validation with Valid Rows
    print("\n--- TEST BULK VALIDATION ---")
    bulk_csv = """cpse_code,original_material_code,original_description,material_type,material_grade,dimensions,technical_specification,uom,manufacturer,standard,function,classification,packaging,criticality,quantity
IOCL,MAT-1,Test Desc,Pipe,A,1,Spec,EA,Mfg,Std,Func,Class,Pkg,NORMAL,1
BPCL,MAT-2,Test Desc 2,Pipe,B,2,Spec,EA,Mfg,Std,Func,Class,Pkg,NORMAL,2
"""
    file_obj = io.BytesIO(bulk_csv.encode('utf-8'))
    resp = client.post("/api/materials/upload/validate", headers=headers, files={"file": ("test.csv", file_obj, "text/csv")})
    print("Status:", resp.status_code)
    try:
        print(resp.json())
    except:
        print(resp.text)

print("\nDone testing.")
