import uuid
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.evaluation import EvaluationDataset, EvaluationLabel, EvaluationRun
from app.models.matching import MaterialMatch

def create_dataset(db: Session, name: str, description: Optional[str] = None) -> EvaluationDataset:
    dataset = EvaluationDataset(name=name, description=description)
    db.add(dataset)
    db.commit()
    db.refresh(dataset)
    return dataset

def add_label(
    db: Session, 
    dataset_id: uuid.UUID, 
    material_a_id: uuid.UUID, 
    material_b_id: uuid.UUID, 
    expert_label: str
) -> EvaluationLabel:
    label = EvaluationLabel(
        dataset_id=dataset_id,
        material_a_id=material_a_id,
        material_b_id=material_b_id,
        expert_label=expert_label
    )
    db.add(label)
    db.commit()
    db.refresh(label)
    return label

def run_evaluation(db: Session, dataset_id: uuid.UUID) -> EvaluationRun:
    labels = db.query(EvaluationLabel).filter(EvaluationLabel.dataset_id == dataset_id).all()
    
    true_positives = 0
    false_positives = 0
    false_negatives = 0
    true_negatives = 0
    
    for label in labels:
        # Check what the AI decided
        # Using MaterialMatch table for pairwise decisions
        match = db.query(MaterialMatch).filter(
            MaterialMatch.material_id == label.material_a_id,
            MaterialMatch.candidate_material_id == label.material_b_id
        ).first()
        
        # If order is reversed
        if not match:
            match = db.query(MaterialMatch).filter(
                MaterialMatch.material_id == label.material_b_id,
                MaterialMatch.candidate_material_id == label.material_a_id
            ).first()
            
        ai_pred = match is not None and match.final_score > 80.0 # threshold
        
        is_duplicate = label.expert_label in ('IDENTICAL', 'DUPLICATE', 'NEAR_DUPLICATE')
        
        if ai_pred and is_duplicate:
            true_positives += 1
        elif ai_pred and not is_duplicate:
            false_positives += 1
        elif not ai_pred and is_duplicate:
            false_negatives += 1
        else:
            true_negatives += 1

    precision = true_positives / (true_positives + false_positives) if (true_positives + false_positives) > 0 else 0.0
    recall = true_positives / (true_positives + false_negatives) if (true_positives + false_negatives) > 0 else 0.0
    false_merge_rate = false_positives / len(labels) if len(labels) > 0 else 0.0

    run = EvaluationRun(
        dataset_id=dataset_id,
        precision=precision,
        recall=recall,
        false_merge_rate=false_merge_rate,
        notes=f"Evaluated {len(labels)} labels."
    )
    db.add(run)
    db.commit()
    db.refresh(run)
    
    return run
