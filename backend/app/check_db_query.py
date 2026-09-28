from app.db.session import SessionLocal
from app.models.cpse import AdministrativeMinistry

db = SessionLocal()
results = db.query(AdministrativeMinistry).filter(AdministrativeMinistry.is_active == True).all()
print(f"Results: {len(results)}")
for r in results:
    print(r.name)
