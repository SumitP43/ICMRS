import random
from datetime import datetime, timezone

def generate_complaint_number() -> str:
    """Generate complaint tracking identifier e.g. #ICMRS-2026-001245 or #ICMRS-2026-XXXXXX."""
    year = datetime.now(timezone.utc).year
    rand_part = random.randint(100000, 999999)
    return f"#ICMRS-{year}-{rand_part}"
