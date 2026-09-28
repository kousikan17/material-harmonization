import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.cpse import CPSE
from app.models.material import CPSEMaterial
from app.models.harmonization import CommonMaterial, CommonMaterialMapping
from app.models.enums import MappingDecisionStatus

def test_demand_summary(client: TestClient, db: Session, test_user_headers: dict):
    response = client.get("/api/procurement/demand-summary", headers=test_user_headers)
    assert response.status_code == 200
    data = response.json()
    assert "materials_with_demand" in data
    assert "total_aggregated_demand" in data
    assert "procurement_opportunities" in data

def test_demand_aggregation(client: TestClient, db: Session, test_user_headers: dict):
    # Just basic availability since we don't know exact db state without creating fixtures
    response = client.get("/api/procurement/demand-aggregation", headers=test_user_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
