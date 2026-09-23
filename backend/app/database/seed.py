import uuid
from datetime import datetime, timezone, timedelta
from backend.app.database.session import SessionLocal, init_db
from backend.app.database.models.user import User
from backend.app.database.models.department import Department, Officer
from backend.app.database.models.complaint import (
    Complaint,
    ComplaintAIAnalysis,
    ComplaintEvidence,
    ComplaintUpdate
)
from backend.app.database.models.sla import SLARecord
from backend.app.core.security import get_password_hash
from backend.app.core.logging import logger

def seed_database():
    init_db()
    db = SessionLocal()
    try:
        # 1. Departments
        departments_data = [
            {
                "code": "ROADS",
                "name": "NDMC Roads & Infrastructure Directorate",
                "description": "Metropolitan civil works, arterial pavement maintenance, flyovers, and bridge safety.",
                "contact_email": "roads@ndmc.gov.in",
                "default_sla_hours": 24
            },
            {
                "code": "ELECTRICAL",
                "name": "BSES Power & Municipal Lighting Wing",
                "description": "High-voltage grid telemetry, luminaire illumination, transformer maintenance, and street electrical safety.",
                "contact_email": "lighting@bsesdelhi.com",
                "default_sla_hours": 12
            },
            {
                "code": "WATER",
                "name": "Delhi Jal Board Hydrology Unit",
                "description": "Potable pipeline networks, stormwater drainage, water supply mainlines, and sewer line remediation.",
                "contact_email": "hydrology@delhijalboard.nic.in",
                "default_sla_hours": 24
            },
            {
                "code": "TRANSIT",
                "name": "Delhi Traffic Police & PWD Telemetry",
                "description": "Automated traffic signal junctions, highway barrier safety, and pedestrian corridor security.",
                "contact_email": "traffic@delhipolice.gov.in",
                "default_sla_hours": 8
            },
            {
                "code": "PARKS",
                "name": "Municipal Parks & Forestry Directorate",
                "description": "Urban tree canopies, fallen branch emergency clearing, and public botanical grounds.",
                "contact_email": "horticulture@ndmc.gov.in",
                "default_sla_hours": 48
            },
            {
                "code": "WASTE",
                "name": "Clean Delhi Solid Waste Response",
                "description": "Municipal solid waste collection, overflow remediation, and sanitary bin deployment.",
                "contact_email": "cleandelhi@mcd.gov.in",
                "default_sla_hours": 12
            },
        ]

        dept_map = {}
        for d in departments_data:
            existing = db.query(Department).filter(Department.code == d["code"]).first()
            if not existing:
                dept = Department(
                    code=d["code"],
                    name=d["name"],
                    description=d["description"],
                    contact_email=d["contact_email"],
                    default_sla_hours=d["default_sla_hours"],
                    is_active=True
                )
                db.add(dept)
                db.commit()
                db.refresh(dept)
                dept_map[d["code"]] = dept
            else:
                dept_map[d["code"]] = existing

        # 2. Users
        default_pw = get_password_hash("Admin@123456")
        officer_pw = get_password_hash("Officer@123456")
        citizen_pw = get_password_hash("Citizen@123456")

        users_data = [
            {
                "email": "admin@icmrs.gov",
                "name": "Commissioner Rajesh Verma",
                "role": "admin",
                "pw": default_pw,
                "badge": "CMD-01",
                "ward": "Central Municipal HQ",
                "dept_code": "ROADS"
            },
            {
                "email": "officer@icmrs.gov",
                "name": "Inspector Vikram Malhotra",
                "role": "officer",
                "pw": officer_pw,
                "badge": "NDMC-ENG-4401",
                "ward": "District 04 (Central)",
                "dept_code": "ROADS"
            },
            {
                "email": "priya.sharma@ndmc.gov.in",
                "name": "Engineer Priya Sharma",
                "role": "officer",
                "pw": officer_pw,
                "badge": "BSES-ENG-9102",
                "ward": "Sector 07 (North)",
                "dept_code": "ELECTRICAL"
            },
            {
                "email": "marcus.vance@residence.net",
                "name": "Marcus Vance",
                "role": "citizen",
                "pw": citizen_pw,
                "badge": None,
                "ward": "Ward 12 (Connaught Place)",
                "dept_code": None
            },
            {
                "email": "citizen@icmrs.gov",
                "name": "Aarav Gupta",
                "role": "citizen",
                "pw": citizen_pw,
                "badge": None,
                "ward": "Ward 04 (Central)",
                "dept_code": None
            }
        ]

        user_map = {}
        for u in users_data:
            existing_user = db.query(User).filter(User.email == u["email"]).first()
            if not existing_user:
                dept = dept_map.get(u["dept_code"]) if u["dept_code"] else None
                user = User(
                    email=u["email"],
                    password_hash=u["pw"],
                    name=u["name"],
                    role=u["role"],
                    badge_number=u["badge"],
                    ward_or_sector=u["ward"],
                    department_id=dept.id if dept else None,
                    is_active=True
                )
                db.add(user)
                db.commit()
                db.refresh(user)
                user_map[u["email"]] = user

                # If officer, create officer record
                if u["role"] == "officer" and dept:
                    off = Officer(
                        user_id=user.id,
                        department_id=dept.id,
                        badge_number=u["badge"],
                        title="Senior Field Civil Engineer" if u["dept_code"] == "ROADS" else "Senior Grid Electrical Officer",
                        zone=u["ward"],
                        is_available=True,
                        active_complaint_count=1
                    )
                    db.add(off)
                    db.commit()
            else:
                user_map[u["email"]] = existing_user

        # 3. Seed Initial Complaints
        now = datetime.now(timezone.utc)
        complaints_seed = [
            {
                "number": "#ICMRS-2026-001245",
                "title": "Severe arterial road crater near metro pillar 42",
                "description": "A 1.8m wide, 18cm deep crater on the primary lane has caused multiple two-wheeler skids. Asphalt base has sheared away under monsoon drainage pressure.",
                "category": "Roads & Bridges",
                "location": "Pillar 42, Outer Ring Road, Connaught Place, New Delhi",
                "lat": 28.6328,
                "lng": 77.2197,
                "priority": "Critical",
                "status": "In Progress",
                "pipeline_step": 3,
                "pipeline_step_name": "Step 3 of 5: Engineering Crew Deployed On-Site",
                "pipeline_percent": 60,
                "time_delta_h": 2,
                "sla_hours": 24,
                "dept_code": "ROADS",
                "officer_email": "officer@icmrs.gov",
                "citizen_email": "marcus.vance@residence.net",
                "image_url": "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=1200&q=80",
                "notes": [
                    ("Civic Dispatch Bureau", "system", "Telemetry logged. Autonomous duplicate detection scored at 0.04 (unique incident). Routed to NDMC Roads Directorate."),
                    ("Inspector Vikram Malhotra", "officer", "Field inspection confirmed severe sub-base fracture. Compactor roller and cold-mix emulsion asphalt crew en route.")
                ]
            },
            {
                "number": "#ICMRS-2026-001246",
                "title": "Exposed high-voltage underground cable junction",
                "description": "Pedestrian pathway conduit cover dislodged after rain. High-voltage wiring exposed with visible water pooling nearby posing high electrocution risk.",
                "category": "Electrical & Lighting",
                "location": "Opposite Gate 4, Barakhamba Road, Connaught Place, New Delhi",
                "lat": 28.6294,
                "lng": 77.2255,
                "priority": "Critical",
                "status": "In Progress",
                "pipeline_step": 2,
                "pipeline_step_name": "Step 2 of 5: Emergency Isolation Crew Dispatched",
                "pipeline_percent": 40,
                "time_delta_h": 1,
                "sla_hours": 12,
                "dept_code": "ELECTRICAL",
                "officer_email": "priya.sharma@ndmc.gov.in",
                "citizen_email": "citizen@icmrs.gov",
                "image_url": "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1200&q=80",
                "notes": [
                    ("Emergency Grid Telemetry", "system", "AI Severity Score: 9.6/10. Live wire proximity alert triggered. Substation circuit breaker monitored."),
                    ("Engineer Priya Sharma", "officer", "Conduit barrier erected. Line de-energized on feeder 4B pending waterproof sleeve replacement.")
                ]
            },
            {
                "number": "#ICMRS-2026-001247",
                "title": "Subsurface mainline leak eroding roadway subgrade",
                "description": "Continuous high-volume clean water discharge surfacing through curb joints. Subgrade erosion suspected beneath sidewalk paving.",
                "category": "Water & Sanitation",
                "location": "Intersection of Janpath & Tolstoy Marg, New Delhi",
                "lat": 28.6245,
                "lng": 77.2188,
                "priority": "High",
                "status": "Assigned & Scheduled",
                "pipeline_step": 2,
                "pipeline_step_name": "Step 2 of 5: Hydro-Acoustic Team Assigned",
                "pipeline_percent": 40,
                "time_delta_h": 4,
                "sla_hours": 24,
                "dept_code": "WATER",
                "officer_email": None,
                "citizen_email": "marcus.vance@residence.net",
                "image_url": "https://images.unsplash.com/photo-1584467735815-f778f274e296?auto=format&fit=crop&w=1200&q=80",
                "notes": [
                    ("Delhi Jal Board Telemetry", "system", "Pipeline pressure drop registered at Sector 04 telemetry logger. Work order assigned.")
                ]
            },
            {
                "number": "#ICMRS-2026-001248",
                "title": "Malfunctioning smart traffic signal cycle at key roundabout",
                "description": "Traffic lights stuck on perpetual red sequence on north approach. Heavy queue buildup stretching 800 meters onto feeder boulevard.",
                "category": "Public Safety & Transit",
                "location": "Mandi House Traffic Circle, Central Delhi",
                "lat": 28.6258,
                "lng": 77.2345,
                "priority": "High",
                "status": "Dispatched",
                "pipeline_step": 3,
                "pipeline_step_name": "Step 3 of 5: Field Technician En Route",
                "pipeline_percent": 60,
                "time_delta_h": 1,
                "sla_hours": 8,
                "dept_code": "TRANSIT",
                "officer_email": None,
                "citizen_email": "citizen@icmrs.gov",
                "image_url": "https://images.unsplash.com/photo-1508873696983-2df5293cb32b?auto=format&fit=crop&w=1200&q=80",
                "notes": [
                    ("Traffic Command Hub", "system", "Optical loop detector fault detected. Manual controller override engaged.")
                ]
            },
            {
                "number": "#ICMRS-2026-001240",
                "title": "Fallen banyan tree limb blocking pedestrian promenade",
                "description": "Heavy mature branch snapped during thunderstorm, completely obstructing footpath and damaging municipal fencing.",
                "category": "Parks & Forestry",
                "location": "Lodhi Gardens, Western Gate Corridor, New Delhi",
                "lat": 28.5933,
                "lng": 77.2198,
                "priority": "Medium",
                "status": "Resolved",
                "pipeline_step": 5,
                "pipeline_step_name": "Step 5 of 5: Certified Sign-off & Cleared",
                "pipeline_percent": 100,
                "time_delta_h": 36,
                "sla_hours": 48,
                "dept_code": "PARKS",
                "officer_email": None,
                "citizen_email": "marcus.vance@residence.net",
                "image_url": "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1200&q=80",
                "notes": [
                    ("Forestry Rapid Crew", "officer", "Branch cleared and safely chipped into mulch. Pathway reopened and fencing repaired.")
                ]
            }
        ]

        for seed in complaints_seed:
            existing_c = db.query(Complaint).filter(Complaint.complaint_number == seed["number"]).first()
            if not existing_c:
                created_at = now - timedelta(hours=seed["time_delta_h"])
                dept = dept_map.get(seed["dept_code"])
                citizen = user_map.get(seed["citizen_email"])
                officer_user = user_map.get(seed["officer_email"]) if seed["officer_email"] else None
                officer_record = db.query(Officer).filter(Officer.user_id == officer_user.id).first() if officer_user else None

                c = Complaint(
                    complaint_number=seed["number"],
                    title=seed["title"],
                    description=seed["description"],
                    category=seed["category"],
                    location=seed["location"],
                    latitude=seed["lat"],
                    longitude=seed["lng"],
                    priority=seed["priority"],
                    status=seed["status"],
                    pipeline_step=seed["pipeline_step"],
                    pipeline_step_name=seed["pipeline_step_name"],
                    pipeline_percent=seed["pipeline_percent"],
                    citizen_id=citizen.id if citizen else None,
                    citizen_name=citizen.name if citizen else "Marcus Vance",
                    citizen_email=citizen.email if citizen else "citizen@icmrs.gov",
                    citizen_token="Verified Resident",
                    department_id=dept.id if dept else None,
                    assigned_officer_id=officer_record.id if officer_record else None,
                    assigned_crew=dept.name if dept else "Delhi Municipal Rapid Unit",
                    resolution_details="Remediated and certified safe." if seed["status"] == "Resolved" else None,
                    resolved_at=now if seed["status"] == "Resolved" else None,
                    created_at=created_at,
                    updated_at=now
                )
                db.add(c)
                db.commit()
                db.refresh(c)

                # SLA record
                sla = SLARecord(
                    complaint_id=c.id,
                    max_hours=seed["sla_hours"],
                    deadline=created_at + timedelta(hours=seed["sla_hours"]),
                    is_breached=False,
                    warning_sent=False,
                    escalation_level=0,
                    created_at=created_at
                )
                db.add(sla)

                # AI analysis record
                ai = ComplaintAIAnalysis(
                    complaint_id=c.id,
                    predicted_category=seed["category"],
                    predicted_priority=seed["priority"],
                    recommended_department_id=dept.id if dept else None,
                    recommended_crew=dept.name if dept else "Delhi Municipal Rapid Unit",
                    severity_score=9.2 if seed["priority"] == "Critical" else (7.8 if seed["priority"] == "High" else 5.5),
                    confidence_score=0.94,
                    explanation=f"Telemetry pattern verified for {seed['category']}. Hazard severity matched priority '{seed['priority']}'.",
                    model_version="gemini-3.8-flash",
                    created_at=created_at
                )
                db.add(ai)

                # Evidence image
                ev = ComplaintEvidence(
                    complaint_id=c.id,
                    uploaded_by_id=citizen.id if citizen else None,
                    evidence_type="initial_photo",
                    file_url=seed["image_url"],
                    file_name="Incident Photographic Evidence",
                    mime_type="image/jpeg",
                    description="High-resolution civic telemetry photo",
                    created_at=created_at
                )
                db.add(ev)

                # Timeline updates / notes
                for author, role, msg in seed["notes"]:
                    u = ComplaintUpdate(
                        complaint_id=c.id,
                        author_id=officer_user.id if (officer_user and role == "officer") else None,
                        author_name=author,
                        author_role=role,
                        update_type="note" if role == "officer" else "dispatch",
                        message=msg,
                        created_at=created_at + timedelta(minutes=15)
                    )
                    db.add(u)

                db.commit()

        logger.info("Database seeding successfully completed!")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
