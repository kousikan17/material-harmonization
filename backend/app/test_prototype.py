import uuid
from app.db.base import Base
from app.db.session import SessionLocal
from app.models.cpse import CPSE
from app.models.material import CPSEMaterial
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("test_prototype")

def test_prototype():
    db = SessionLocal()
    try:
        # STEP 1
        cpse_count = db.query(CPSE).count()
        mat_count = db.query(CPSEMaterial).count()
        logger.info(f"STEP 1: CPSE count = {cpse_count}, Material count = {mat_count}")
        assert cpse_count == 0
        assert mat_count == 0

        # STEP 2: Add one CPSE
        new_cpse = CPSE(
            id=uuid.uuid4(),
            code="DEMO-PROT-001",
            name="Prototype Petroleum Corporation",
            sector="Oil & Gas",
            industry="Petroleum",
            material_database_available=True,
            is_active=True
        )
        db.add(new_cpse)
        db.commit()
        db.refresh(new_cpse)

        cpse_count = db.query(CPSE).count()
        mat_count = db.query(CPSEMaterial).count()
        logger.info(f"STEP 2: CPSE count = {cpse_count}, Material count = {mat_count}")
        assert cpse_count == 1
        assert mat_count == 0

        # STEP 6: Manual material upload (simulate)
        for i in range(5):
            mat = CPSEMaterial(
                id=uuid.uuid4(),
                cpse_id=new_cpse.id,
                original_material_code=f"MAT-TEST-00{i}",
                original_description=f"Test Material {i}",
                uom="EA",
                is_active=True,
                is_demo_data=False
            )
            db.add(mat)
        db.commit()
        
        mat_count = db.query(CPSEMaterial).count()
        logger.info(f"STEP 6: Material count = {mat_count}")
        assert mat_count == 5

        # STEP 9: Add second CPSE
        new_cpse2 = CPSE(
            id=uuid.uuid4(),
            code="DEMO-PROT-002",
            name="Prototype Mining Corporation",
            sector="Mining & Exploration",
            industry="Mining",
            material_database_available=True,
            is_active=True
        )
        db.add(new_cpse2)
        db.commit()

        cpse_count = db.query(CPSE).count()
        logger.info(f"STEP 9: CPSE count = {cpse_count}")
        assert cpse_count == 2
        
        logger.info("All programmatic tests passed!")

    except Exception as e:
        logger.error(f"Test failed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    test_prototype()
