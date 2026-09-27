from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class CategoryBreakdown(BaseModel):
    category: str
    count: int
    resolved_count: int
    avg_resolution_hours: float

class DepartmentPerformance(BaseModel):
    department: str
    active_count: int
    resolved_count: int
    sla_compliance_rate: float
    avg_resolution_hours: float

class SLAComplianceStats(BaseModel):
    total_complaints: int
    within_sla: int
    approaching_breach: int
    breached: int
    compliance_percentage: float

class HeatmapPoint(BaseModel):
    lat: float
    lng: float
    intensity: float
    title: str
    category: str
    priority: str
    complaint_id: str

class ResolutionTrend(BaseModel):
    date: str
    reported: int
    resolved: int

class DashboardStats(BaseModel):
    total_complaints: int
    active_complaints: int
    in_progress: int
    resolved_complaints: int
    critical_complaints: int
    sla_compliance_rate: float
    avg_turnaround_hours: float
    categories: List[CategoryBreakdown]
    departments: List[DepartmentPerformance]
    sla_stats: SLAComplianceStats
