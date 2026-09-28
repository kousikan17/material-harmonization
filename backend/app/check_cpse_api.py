from fastapi.testclient import TestClient
from app.main import app
from app.api.deps import get_current_user
from app.models.user import User
from app.models.enums import RoleName
from app.models.role import Role
import uuid

def override_get_current_user():
    user = User(id=uuid.uuid4(), email="admin@example.com")
    user.role = Role(name=RoleName.ADMIN)
    return user

app.dependency_overrides[get_current_user] = override_get_current_user
client = TestClient(app)

response = client.get("/api/cpse")
print(f"CPSE Status Code: {response.status_code}")
if response.status_code != 200:
    print(f"Error: {response.json()}")
