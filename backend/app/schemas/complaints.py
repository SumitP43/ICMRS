import uuid
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

class CoordinatesSchema(BaseModel):
    lat: float
    lng: float

class OfficerNoteSchema(BaseModel):
    id: str
    author: str
    role: str
    time: str
    text: str

class StatusHistoryEntrySchema(BaseModel):
    status: str
    timestamp: str
    updatedBy: str
    role: Optional[str] = None
    notes: Optional[str] = None

class AttachmentSchema(BaseModel):
    id: str
    name: str
    url: str
    type: str = "image/jpeg"
    size: Optional[int] = None
    uploadedAt: str

class ComplaintCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    description: str = Field(..., min_length=5)
    category: str = Field(..., min_length=2, max_length=100)
    location: str = Field(..., min_length=2, max_length=255)
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    coordinates: Optional[CoordinatesSchema] = None
    priority: Optional[str] = "Medium"
    citizenName: Optional[str] = None
    citizenEmail: Optional[str] = None
    imageUrl: Optional[str] = None
    department: Optional[str] = None
    assignedCrew: Optional[str] = None
    attachments: Optional[List[AttachmentSchema]] = None

class ComplaintPatch(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    location: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    pipelineStep: Optional[int] = None
    pipelineStepName: Optional[str] = None
    pipelinePercent: Optional[int] = None
    assignedOfficer: Optional[str] = None
    assignedOfficerId: Optional[uuid.UUID] = None
    assignedCrew: Optional[str] = None
    department: Optional[str] = None
    departmentId: Optional[uuid.UUID] = None
    resolutionDetails: Optional[str] = None
    resolvedTime: Optional[str] = None
    statusNote: Optional[str] = None
    updateNote: Optional[str] = None
    updatedBy: Optional[str] = None
    updaterRole: Optional[str] = None
    officerNotes: Optional[List[OfficerNoteSchema]] = None
    coordinates: Optional[CoordinatesSchema] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class AIAnalysisResponse(BaseModel):
    predicted_category: str
    predicted_priority: str
    recommended_department: Optional[str] = None
    recommended_crew: Optional[str] = None
    severity_score: float
    confidence_score: float
    explanation: str
    is_duplicate: bool = False
    duplicate_of: Optional[str] = None
    duplicate_score: Optional[float] = None

class ComplaintResponse(BaseModel):
    id: str
    complaintNumber: str
    title: str
    description: str
    category: str
    location: str
    coordinates: CoordinatesSchema
    latitude: float
    longitude: float
    status: str
    priority: str
    citizenName: str
    citizenEmail: str
    citizenToken: str = "Verified Resident"
    department: Optional[str] = None
    assignedOfficer: Optional[str] = None
    assignedCrew: Optional[str] = None
    pipelineStep: int = 1
    pipelineStepName: str = "Step 1 of 5: Telemetry Received & Dispatched"
    pipelinePercent: int = 20
    timeLogged: str = "Just now"
    slaRemaining: str = "24h 00m SLA nominal"
    totalSlaHours: int = 24
    slaStatus: str = "nominal"
    imageUrl: Optional[str] = None
    imageAlt: Optional[str] = None
    beforeImageUrl: Optional[str] = None
    afterImageUrl: Optional[str] = None
    gpsTagged: bool = True
    resolutionDetails: Optional[str] = None
    resolvedTime: Optional[str] = None
    rating: Optional[int] = None
    officerNotes: List[OfficerNoteSchema] = []
    attachments: List[AttachmentSchema] = []
    statusHistory: List[StatusHistoryEntrySchema] = []
    aiAnalysis: Optional[AIAnalysisResponse] = None
    is_duplicate: bool = False
    duplicate_of_id: Optional[str] = None
    duplicate_score: Optional[float] = None
    createdAt: str
    updatedAt: str

class ComplaintEvidenceCreate(BaseModel):
    evidence_type: str = "investigation"
    file_url: str
    file_name: str
    file_size: Optional[int] = None
    mime_type: str = "image/jpeg"
    description: Optional[str] = None

class ResolveComplaintRequest(BaseModel):
    resolution_details: str = Field(..., min_length=5)
    after_image_url: Optional[str] = None
    status_note: Optional[str] = "Remediation verified and signed off."

class CitizenFeedbackCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None
