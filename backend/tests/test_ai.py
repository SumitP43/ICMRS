from backend.app.ai.classifier import classify_complaint_text
from backend.app.ai.priority import predict_priority_and_severity
from backend.app.ai.duplicate_detection import calculate_duplicate_score
from datetime import datetime, timezone

def test_classifier():
    cat, conf, dept, crew = classify_complaint_text(
        "Huge asphalt crater on bridge lane",
        "Deep pothole causing vehicle tire damage."
    )
    assert cat == "Roads & Bridges"
    assert conf >= 0.70

def test_priority_critical():
    prio, sev, exp = predict_priority_and_severity(
        "Live electrical wire sparking",
        "Open high voltage line touching puddles, electrocution risk.",
        "Electrical & Lighting"
    )
    assert prio == "Critical"
    assert sev >= 8.0

def test_duplicate_score():
    now = datetime.now(timezone.utc)
    score, text_s, loc_s, time_s = calculate_duplicate_score(
        text1="Large pothole near metro pillar 42",
        lat1=28.6328,
        lon1=77.2197,
        time1=now,
        text2="Deep crater near metro pillar 42",
        lat2=28.6329,
        lon2=77.2198,
        time2=now
    )
    assert score >= 0.60
