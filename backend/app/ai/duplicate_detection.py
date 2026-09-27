from datetime import datetime, timezone
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from backend.app.config import settings
from backend.app.utils.geo import haversine_distance_meters
from backend.app.ai.embeddings import calculate_text_similarity
from backend.app.database.models.complaint import Complaint

def calculate_duplicate_score(
    text1: str,
    lat1: float,
    lon1: float,
    time1: datetime,
    text2: str,
    lat2: float,
    lon2: float,
    time2: datetime,
) -> Tuple[float, float, float, float]:
    """
    Calculate composite duplicate score.
    Returns: (total_score, text_sim, loc_sim, time_sim)
    """
    # 1. Text Similarity (0.0 to 1.0)
    text_sim = calculate_text_similarity(text1, text2)

    # 2. Location Similarity (0.0 to 1.0 within DUPLICATE_RADIUS_METERS)
    dist_meters = haversine_distance_meters(lat1, lon1, lat2, lon2)
    max_radius = settings.DUPLICATE_RADIUS_METERS
    if dist_meters <= max_radius:
        loc_sim = 1.0 - (dist_meters / max_radius)
    else:
        loc_sim = 0.0

    # 3. Time Proximity (0.0 to 1.0 within DUPLICATE_TIME_WINDOW_DAYS)
    diff_days = abs((time1 - time2).total_seconds()) / 86400.0
    max_days = float(settings.DUPLICATE_TIME_WINDOW_DAYS)
    if diff_days <= max_days:
        time_sim = 1.0 - (diff_days / max_days)
    else:
        time_sim = 0.0

    # Image similarity placeholder weight (redistributed if images not compared)
    w_text = settings.DUPLICATE_WEIGHT_TEXT + (settings.DUPLICATE_WEIGHT_IMAGE / 2.0)
    w_loc = settings.DUPLICATE_WEIGHT_LOCATION + (settings.DUPLICATE_WEIGHT_IMAGE / 2.0)
    w_time = settings.DUPLICATE_WEIGHT_TIME

    composite = (text_sim * w_text) + (loc_sim * w_loc) + (time_sim * w_time)
    return composite, text_sim, loc_sim, time_sim

def find_duplicate_complaint(
    db: Session,
    title: str,
    description: str,
    lat: float,
    lon: float,
    exclude_id: Optional[str] = None
) -> Tuple[bool, Optional[Complaint], float]:
    """
    Search recent active complaints for duplicates.
    Returns: (is_duplicate, matched_complaint, confidence_score)
    """
    now = datetime.now(timezone.utc)
    # Query non-resolved complaints in system
    query = db.query(Complaint).filter(Complaint.status != "Resolved")
    if exclude_id:
        query = query.filter(Complaint.id != exclude_id)
        
    candidates: List[Complaint] = query.all()
    best_candidate: Optional[Complaint] = None
    highest_score: float = 0.0

    current_text = f"{title} {description}"

    for cand in candidates:
        cand_created = cand.created_at
        if cand_created.tzinfo is None:
            cand_created = cand_created.replace(tzinfo=timezone.utc)
            
        score, text_s, loc_s, time_s = calculate_duplicate_score(
            text1=current_text,
            lat1=lat,
            lon1=lon,
            time1=now,
            text2=f"{cand.title} {cand.description}",
            lat2=cand.latitude,
            lon2=cand.longitude,
            time2=cand_created
        )

        if score > highest_score:
            highest_score = score
            best_candidate = cand

    if highest_score >= settings.DUPLICATE_THRESHOLD and best_candidate:
        return True, best_candidate, round(highest_score, 3)

    return False, None, round(highest_score, 3)
