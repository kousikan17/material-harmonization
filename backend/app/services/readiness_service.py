import uuid
from typing import Dict, Any

def score_material_readiness(material_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Scores the data readiness of a material based on completeness and quality
    of descriptions, UOM, classification, specification, and MPN.
    """
    scores = {}
    
    # Description score
    desc = material_data.get("original_description") or ""
    if len(desc) > 20:
        scores["description_score"] = 1.0
    elif len(desc) > 5:
        scores["description_score"] = 0.5
    else:
        scores["description_score"] = 0.0

    # UOM score
    uom = material_data.get("uom") or ""
    if uom.strip().upper() not in ["", "NA", "N/A", "NONE", "UNSPECIFIED"]:
        scores["uom_score"] = 1.0
    else:
        scores["uom_score"] = 0.0

    # Classification score
    if material_data.get("classification"):
        scores["classification_score"] = 1.0
    else:
        scores["classification_score"] = 0.0

    # Technical spec score
    spec = material_data.get("technical_specification") or ""
    if len(spec) > 10:
        scores["technical_specification_score"] = 1.0
    else:
        scores["technical_specification_score"] = 0.0

    # Manufacturer score
    if material_data.get("manufacturer"):
        scores["manufacturer_score"] = 1.0
    else:
        scores["manufacturer_score"] = 0.0

    # MPN score
    if material_data.get("manufacturer_part_number"):
        scores["manufacturer_part_number_score"] = 1.0
    else:
        scores["manufacturer_part_number_score"] = 0.0

    # Attribute completeness score (if structured attributes exist)
    attrs = material_data.get("attributes_json")
    if attrs and isinstance(attrs, dict) and len(attrs) > 0:
        scores["attribute_completeness_score"] = 1.0
    else:
        scores["attribute_completeness_score"] = 0.0

    # Overall readiness score calculation
    # Weighted average:
    # Desc (30%), MPN (20%), UOM (10%), Spec (20%), Class (10%), Mfr (10%)
    overall_score = (
        scores["description_score"] * 0.3 +
        scores["manufacturer_part_number_score"] * 0.2 +
        scores["uom_score"] * 0.1 +
        scores["technical_specification_score"] * 0.2 +
        scores["classification_score"] * 0.1 +
        scores["manufacturer_score"] * 0.1
    )
    
    scores["overall_readiness_score"] = overall_score
    
    # Readiness band mapping
    if overall_score >= 0.8:
        scores["readiness_band"] = "READY"
    elif overall_score >= 0.5:
        scores["readiness_band"] = "MOSTLY_READY"
    elif overall_score >= 0.3:
        scores["readiness_band"] = "NEEDS_CLEANSING"
    else:
        scores["readiness_band"] = "NOT_READY"

    return scores
