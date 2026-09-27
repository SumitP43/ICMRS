from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.schemas.analytics import (
    DashboardStats,
    HeatmapPoint,
    ResolutionTrend
)
from backend.app.services.analytics import (
    get_dashboard_stats,
    get_heatmap_points,
    get_resolution_trends
)

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/dashboard", response_model=DashboardStats)
def dashboard_metrics(db: Session = Depends(get_db)):
    return get_dashboard_stats(db)

@router.get("/heatmap", response_model=List[HeatmapPoint])
def geospatial_heatmap(db: Session = Depends(get_db)):
    return get_heatmap_points(db)

@router.get("/trends", response_model=List[ResolutionTrend])
def trends_analytics(days: int = Query(default=7, ge=1, le=90), db: Session = Depends(get_db)):
    return get_resolution_trends(db, days=days)
