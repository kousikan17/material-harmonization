import logging
from sqlalchemy import text
from app.db.session import SessionLocal

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("prototype_reset")

def reset_database():
    db = SessionLocal()
    try:
        logger.info("Starting prototype database reset...")

        # 1. Nullify user.cpse_id
        db.execute(text("UPDATE users SET cpse_id = NULL;"))
        logger.info("Nulled user.cpse_id references.")

        # 2. Delete all records from dependent tables
        # Use DELETE instead of TRUNCATE to respect foreign keys cleanly if needed, or TRUNCATE CASCADE.
        # Since we want to keep users, roles, etc., we carefully delete from specific tables.
        
        tables_to_clear = [
            "procurement_history",
            "common_material_mappings",
            "common_materials",
            "ai_analysis",
            "cpse_materials",
            "import_batches",
            "source_connections",
            "cpses"
        ]

        for table in tables_to_clear:
            db.execute(text(f"DELETE FROM {table};"))
            logger.info(f"Cleared table: {table}")

        # Drop any demo_source_* tables
        res = db.execute(text("SELECT table_name FROM information_schema.tables WHERE table_name LIKE 'demo_source_%';"))
        demo_tables = res.fetchall()
        for t in demo_tables:
            table_name = t[0]
            db.execute(text(f"DROP TABLE {table_name};"))
            logger.info(f"Dropped demo table: {table_name}")

        db.commit()
        logger.info("Database reset complete. All CPSEs and materials removed.")

    except Exception as e:
        db.rollback()
        logger.error(f"Error during reset: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    reset_database()
