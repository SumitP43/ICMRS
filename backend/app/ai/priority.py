from typing import Tuple

CRITICAL_KEYWORDS = [
    "spark", "wire", "live", "electrocution", "arcing", "explosion", "fire",
    "sinkhole", "burst main", "collapse", "gas", "fatal", "emergency", "danger"
]

HIGH_KEYWORDS = [
    "deep pothole", "hazard", "swerving", "arterial", "traffic", "school",
    "flood", "dark", "heavy", "overflow", "severe", "crater"
]

LOW_KEYWORDS = [
    "cosmetic", "paint", "faded", "minor", "small", "litter", "scratch", "trim"
]

def predict_priority_and_severity(title: str, description: str, category: str) -> Tuple[str, float, str]:
    """
    Evaluate civic hazard priority, numeric severity score (1.0 to 10.0), and diagnostic explanation.
    Returns: (priority, severity_score, explanation)
    """
    text = f"{title} {description}".lower()

    if any(k in text for k in CRITICAL_KEYWORDS):
        return (
            "Critical",
            9.2,
            "Immediate threat to public life or critical infrastructure safety detected (live wires / explosive / sinkhole risk)."
        )
    elif any(k in text for k in HIGH_KEYWORDS) or category in ["Roads & Bridges", "Electrical & Lighting"]:
        return (
            "High",
            7.8,
            "High vehicular or pedestrian disruption risk along high-density municipal corridors."
        )
    elif any(k in text for k in LOW_KEYWORDS):
        return (
            "Low",
            3.5,
            "Routine maintenance or non-urgent municipal upkeep."
        )
    else:
        return (
            "Medium",
            5.8,
            "Standard civic incident under standard SLA triage protocols."
        )
