from typing import Tuple, Optional
from backend.app.config import settings
from backend.app.core.logging import logger

CATEGORIES = [
    "Roads & Bridges",
    "Electrical & Lighting",
    "Water & Sanitation",
    "Public Safety & Transit",
    "Parks & Forestry",
    "Waste Management",
]

CATEGORY_KEYWORDS = {
    "Roads & Bridges": ["pothole", "asphalt", "crater", "road", "pavement", "bridge", "flyover", "curb", "sidewalk", "divider"],
    "Electrical & Lighting": ["streetlight", "lamp", "luminaire", "light", "wire", "cable", "pole", "dark", "spark", "transformer", "power"],
    "Water & Sanitation": ["water", "leak", "pipe", "sewer", "drain", "drainage", "flood", "burst", "gutter", "manhole", "contamination"],
    "Public Safety & Transit": ["traffic", "signal", "sign", "junction", "crossing", "speed", "barrier", "accident", "bus", "hazard"],
    "Parks & Forestry": ["tree", "branch", "fallen", "park", "grass", "overgrown", "roots", "horticulture", "garden"],
    "Waste Management": ["garbage", "trash", "dump", "debris", "bin", "waste", "rubbish", "litter", "filth"],
}

DEPARTMENT_MAP = {
    "Roads & Bridges": "NDMC Roads & Infrastructure Directorate",
    "Electrical & Lighting": "BSES Power & Municipal Lighting Wing",
    "Water & Sanitation": "Delhi Jal Board Hydrology Unit",
    "Public Safety & Transit": "Delhi Traffic Police & PWD Telemetry",
    "Parks & Forestry": "Municipal Parks & Forestry Directorate",
    "Waste Management": "Clean Delhi Solid Waste Response",
}

CREW_MAP = {
    "Roads & Bridges": "NDMC Rapid Road Patch Unit (Central Zone)",
    "Electrical & Lighting": "BSES Yamuna / North MCD Grid Team",
    "Water & Sanitation": "Delhi Jal Board Hydro-Jet Suction Unit 08",
    "Public Safety & Transit": "Delhi PWD Signals & Traffic Maintenance Unit",
    "Parks & Forestry": "Municipal Forestry Emergency Clearance Unit",
    "Waste Management": "Delhi Municipal Waste Evacuation Team",
}

def classify_complaint_text(title: str, description: str) -> Tuple[str, float, str, str]:
    """
    Classify complaint text into category, confidence score, department, and recommended crew.
    Returns: (category, confidence, department_name, crew_name)
    """
    combined = f"{title} {description}".lower()
    best_cat = "Roads & Bridges"
    max_matches = 0
    total_matches = 0

    for cat, keywords in CATEGORY_KEYWORDS.items():
        matches = sum(1 for kw in keywords if kw in combined)
        total_matches += matches
        if matches > max_matches:
            max_matches = matches
            best_cat = cat

    confidence = 0.80
    if total_matches > 0:
        confidence = min(0.98, max(0.65, (max_matches / (total_matches + 1)) * 0.5 + 0.5))

    department_name = DEPARTMENT_MAP.get(best_cat, "District 04 Municipal Response Bureau")
    crew_name = CREW_MAP.get(best_cat, "Delhi Municipal Rapid Unit")
    return best_cat, confidence, department_name, crew_name
