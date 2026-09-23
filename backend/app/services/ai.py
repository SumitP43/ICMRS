from typing import Tuple, Optional
from sqlalchemy.orm import Session
from backend.app.database.models.complaint import Complaint, ComplaintAIAnalysis
from backend.app.database.models.department import Department
from backend.app.ai.classifier import classify_complaint_text
from backend.app.ai.priority import predict_priority_and_severity
from backend.app.ai.duplicate_detection import find_duplicate_complaint
from backend.app.services.audit import record_audit_log
from backend.app.core.logging import logger

def run_ai_complaint_analysis(
    db: Session,
    complaint: Complaint
) -> Tuple[ComplaintAIAnalysis, bool, Optional[Complaint], float]:
    """
    Run full AI analysis pipeline on complaint:
    1. Category classification
    2. Priority & severity estimation
    3. Department and crew recommendation
    4. Duplicate incident detection
    """
    # 1. Classification
    cat, cat_conf, dept_name, crew = classify_complaint_text(complaint.title, complaint.description)
    
    # 2. Priority & Severity
    prio, severity, explanation = predict_priority_and_severity(complaint.title, complaint.description, cat)

    # 3. Find matching department in DB
    dept = db.query(Department).filter(
        (Department.name.ilike(f"%{dept_name}%")) | (Department.name == dept_name)
    ).first()

    # 4. Duplicate Detection
    is_dup, parent_dup, dup_score = find_duplicate_complaint(
        db=db,
        title=complaint.title,
        description=complaint.description,
        lat=complaint.latitude,
        lon=complaint.longitude,
        exclude_id=str(complaint.id)
    )

    if is_dup and parent_dup:
        complaint.is_duplicate = True
        complaint.duplicate_of_id = parent_dup.id
        complaint.duplicate_score = dup_score
        explanation += f" Note: Flagged as probable duplicate of ticket {parent_dup.complaint_number} (confidence {dup_score:.0%})."

    # 5. Persist AI Analysis
    existing_analysis = db.query(ComplaintAIAnalysis).filter(
        ComplaintAIAnalysis.complaint_id == complaint.id
    ).first()

    if existing_analysis:
        existing_analysis.predicted_category = cat
        existing_analysis.predicted_priority = prio
        existing_analysis.recommended_department_id = dept.id if dept else None
        existing_analysis.recommended_crew = crew
        existing_analysis.severity_score = severity
        existing_analysis.confidence_score = cat_conf
        existing_analysis.explanation = explanation
        db.commit()
        db.refresh(existing_analysis)
        analysis_record = existing_analysis
    else:
        analysis_record = ComplaintAIAnalysis(
            complaint_id=complaint.id,
            predicted_category=cat,
            predicted_priority=prio,
            recommended_department_id=dept.id if dept else None,
            recommended_crew=crew,
            severity_score=severity,
            confidence_score=cat_conf,
            explanation=explanation,
            model_version="gemini-3.8-flash"
        )
        db.add(analysis_record)
        db.commit()
        db.refresh(analysis_record)

    record_audit_log(
        db,
        entity_type="complaint",
        entity_id=str(complaint.complaint_number),
        action="AI_ANALYSIS",
        change_summary=f"AI Triage completed: category '{cat}', priority '{prio}', severity {severity}/10."
    )

    return analysis_record, is_dup, parent_dup, dup_score
