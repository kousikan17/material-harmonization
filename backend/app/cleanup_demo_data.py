import logging
import os
from sqlalchemy import text
from app.db.session import SessionLocal, engine
from app.models.cpse import CPSE
from app.models.material import CPSEMaterial
from app.models.procurement import ProcurementHistory
from app.models.source_connection import SourceConnection
from app.models.harmonization import CommonMaterialMapping, CommonMaterial
from app.models.matching import AIAnalysis
from app.db.base import Base

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("cleanup_demo")

def main():
    db = SessionLocal()
    try:
        logger.info("Starting demo data cleanup...")

        # 1. Get Demo Source Connections
        demo_source_connections = db.query(SourceConnection).filter(SourceConnection.is_demo == True).all()
        demo_conn_ids = [c.id for c in demo_source_connections]
        
        # 2. Get Demo CPSE Materials (both explicitly marked and from demo connections)
        demo_material_query = db.query(CPSEMaterial).filter(
            (CPSEMaterial.is_demo_data == True) | 
            (CPSEMaterial.source_connection_id.in_(demo_conn_ids) if demo_conn_ids else False)
        )
        demo_materials = demo_material_query.all()
        demo_material_ids = [m.id for m in demo_materials]
        
        if demo_material_ids:
            # Delete Procurement History
            deleted_proc = db.query(ProcurementHistory).filter(ProcurementHistory.cpse_material_id.in_(demo_material_ids)).delete(synchronize_session=False)
            logger.info(f"Deleted {deleted_proc} demo procurement history records.")
            
            # Delete Common Material Mappings
            deleted_mappings = db.query(CommonMaterialMapping).filter(CommonMaterialMapping.cpse_material_id.in_(demo_material_ids)).delete(synchronize_session=False)
            logger.info(f"Deleted {deleted_mappings} demo mappings.")
            
            # Get AI Analysis records to delete
            analysis_ids_query = db.query(AIAnalysis.id).filter(
                (AIAnalysis.material_id.in_(demo_material_ids)) | 
                (AIAnalysis.best_candidate_material_id.in_(demo_material_ids))
            )
            
            # Delete mappings that reference these AI analyses
            deleted_mappings_by_analysis = db.query(CommonMaterialMapping).filter(
                CommonMaterialMapping.ai_analysis_id.in_(analysis_ids_query)
            ).delete(synchronize_session=False)
            logger.info(f"Deleted {deleted_mappings_by_analysis} mappings referencing demo AI analysis.")

            # Delete associated AI Analysis records
            deleted_analysis = db.query(AIAnalysis).filter(
                AIAnalysis.id.in_(analysis_ids_query)
            ).delete(synchronize_session=False)
            logger.info(f"Deleted {deleted_analysis} demo ai analysis records.")
            
        # 3. Delete Demo Materials
        if demo_material_ids:
            deleted_mats = db.query(CPSEMaterial).filter(CPSEMaterial.id.in_(demo_material_ids)).delete(synchronize_session=False)
            logger.info(f"Deleted {deleted_mats} demo materials.")
        
        # 4. Clean up orphaned Common Materials
        db.execute(text("""
            DELETE FROM common_materials 
            WHERE id NOT IN (SELECT DISTINCT common_material_id FROM common_material_mappings)
        """))
        logger.info(f"Deleted orphaned common materials.")
        
        # 6. Delete Demo Source Connections
        deleted_conns = db.query(SourceConnection).filter(SourceConnection.is_demo == True).delete(synchronize_session=False)
        logger.info(f"Deleted {deleted_conns} demo source connections.")
        
        # 7. Delete Demo CPSEs
        # Only delete CPSEs that have no materials and no source connections
        cpses_with_materials = db.query(CPSEMaterial.cpse_id).distinct().all()
        cpses_with_connections = db.query(SourceConnection.cpse_id).distinct().all()
        active_cpse_ids = set([c[0] for c in cpses_with_materials] + [c[0] for c in cpses_with_connections])
        
        deleted_cpses = 0
        for cpse in db.query(CPSE).all():
            if cpse.id not in active_cpse_ids:
                db.delete(cpse)
                deleted_cpses += 1
                
        logger.info(f"Deleted {deleted_cpses} demo/empty CPSEs.")
        
        # 7. Drop demo tables
        DEMO_CPSES = ["IOCL", "ONGC", "BPCL"]
        for cpse_code in DEMO_CPSES:
            table = f"demo_source_{cpse_code.lower()}"
            db.execute(text(f"DROP TABLE IF EXISTS {table}"))
        logger.info("Dropped demo source tables.")

        db.commit()
        logger.info("Demo data cleanup complete.")
    except Exception as e:
        db.rollback()
        logger.error(f"Error during cleanup: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    main()
