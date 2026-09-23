from backend.app.schemas.common import ResponseEnvelope, PaginationParams, PaginatedResponse
from backend.app.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    RefreshTokenRequest,
    ChangePasswordRequest,
    UserResponse
)
from backend.app.schemas.departments import DepartmentCreate, DepartmentResponse
from backend.app.schemas.officers import OfficerCreate, OfficerResponse, AssignOfficerRequest
from backend.app.schemas.complaints import (
    CoordinatesSchema,
    OfficerNoteSchema,
    StatusHistoryEntrySchema,
    AttachmentSchema,
    ComplaintCreate,
    ComplaintPatch,
    ComplaintResponse,
    AIAnalysisResponse,
    ComplaintEvidenceCreate,
    ResolveComplaintRequest,
    CitizenFeedbackCreate
)
from backend.app.schemas.notifications import NotificationResponse
from backend.app.schemas.analytics import (
    CategoryBreakdown,
    DepartmentPerformance,
    SLAComplianceStats,
    HeatmapPoint,
    ResolutionTrend,
    DashboardStats
)

__all__ = [
    "ResponseEnvelope",
    "PaginationParams",
    "PaginatedResponse",
    "LoginRequest",
    "RegisterRequest",
    "TokenResponse",
    "RefreshTokenRequest",
    "ChangePasswordRequest",
    "UserResponse",
    "DepartmentCreate",
    "DepartmentResponse",
    "OfficerCreate",
    "OfficerResponse",
    "AssignOfficerRequest",
    "CoordinatesSchema",
    "OfficerNoteSchema",
    "StatusHistoryEntrySchema",
    "AttachmentSchema",
    "ComplaintCreate",
    "ComplaintPatch",
    "ComplaintResponse",
    "AIAnalysisResponse",
    "ComplaintEvidenceCreate",
    "ResolveComplaintRequest",
    "CitizenFeedbackCreate",
    "NotificationResponse",
    "CategoryBreakdown",
    "DepartmentPerformance",
    "SLAComplianceStats",
    "HeatmapPoint",
    "ResolutionTrend",
    "DashboardStats",
]
