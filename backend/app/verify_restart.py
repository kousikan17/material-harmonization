from app.db.base import Base
from app.db.session import SessionLocal
from app.models.cpse import CPSE
from app.models.material import CPSEMaterial
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("verify_restart")

def verify():
    db = SessionLocal()
    try:
        cpse_count = db.query(CPSE).count()
        mat_count = db.query(CPSEMaterial).count()
        logger.info(f"After restart: CPSE count = {cpse_count}, Material count = {mat_count}")
        assert cpse_count == 2
        assert mat_count == 5
        logger.info("Verification passed: Data persists and no demo data appeared.")
    except Exception as e:
        logger.error(f"Verification failed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    verify()
