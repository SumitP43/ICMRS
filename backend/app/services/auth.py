import uuid
from datetime import datetime, timezone
from typing import Optional, Tuple
from sqlalchemy.orm import Session
from backend.app.database.models.user import User, RefreshToken
from backend.app.database.models.department import Officer, Department
from backend.app.schemas.auth import RegisterRequest, LoginRequest
from backend.app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token
)
from backend.app.core.exceptions import (
    UnauthorizedException,
    ConflictException,
    NotFoundException,
    BadRequestException
)
from backend.app.services.audit import record_audit_log
from backend.app.config import settings

def register_user(db: Session, data: RegisterRequest) -> User:
    """Register new citizen, officer, or admin user."""
    existing = db.query(User).filter(User.email == data.email.lower()).first()
    if existing:
        raise ConflictException("An account with this email address already exists")

    hashed_pw = get_password_hash(data.password)
    user = User(
        email=data.email.lower(),
        password_hash=hashed_pw,
        name=data.name,
        role=data.role or "citizen",
        phone=data.phone,
        ward_or_sector=data.ward_or_sector,
        badge_number=data.badge_number,
        department_id=data.department_id,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # If role is officer, auto-provision officer profile if department exists
    if user.role == "officer":
        dept_id = data.department_id
        if not dept_id:
            dept = db.query(Department).first()
            if dept:
                dept_id = dept.id
        if dept_id:
            badge = data.badge_number or f"BADGE-{user.name[:3].upper()}-{str(user.id)[:4]}"
            officer = Officer(
                user_id=user.id,
                department_id=dept_id,
                badge_number=badge,
                title="Municipal Field Officer",
                zone=data.ward_or_sector or "District 04 (Central)",
                is_available=True
            )
            db.add(officer)
            db.commit()

    record_audit_log(
        db,
        entity_type="user",
        entity_id=str(user.id),
        action="CREATE",
        actor_id=user.id,
        actor_email=user.email,
        actor_role=user.role,
        change_summary=f"User {user.name} registered with role {user.role}."
    )

    return user

def authenticate_user(db: Session, email: str, password: str) -> User:
    """Validate credentials and return authenticated user."""
    user = db.query(User).filter(User.email == email.lower()).first()
    if not user:
        raise UnauthorizedException("Invalid email or password")
    if not verify_password(password, user.password_hash):
        raise UnauthorizedException("Invalid email or password")
    if not user.is_active:
        raise UnauthorizedException("User account is inactive")

    record_audit_log(
        db,
        entity_type="user",
        entity_id=str(user.id),
        action="LOGIN",
        actor_id=user.id,
        actor_email=user.email,
        actor_role=user.role,
        change_summary=f"User {user.name} logged in successfully."
    )
    return user

def create_user_tokens(db: Session, user: User) -> Tuple[str, str, int]:
    """Generate and persist JWT access token and refresh token."""
    access_token = create_access_token(
        subject=str(user.id),
        role=user.role,
        additional_claims={
            "email": user.email,
            "name": user.name,
            "badgeNumber": user.badge_number,
            "department": user.department.name if user.department else None
        }
    )

    raw_refresh_token, token_hash, expires_at = create_refresh_token(subject=str(user.id))
    
    # Store refresh token record in DB
    rt_record = RefreshToken(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=expires_at,
        is_revoked=False
    )
    db.add(rt_record)
    db.commit()

    expires_in = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    return access_token, raw_refresh_token, expires_in

def refresh_access_token(db: Session, raw_refresh_token: str) -> Tuple[str, str, int]:
    """Exchange valid refresh token for a new access token and rotated refresh token."""
    now = datetime.now(timezone.utc)
    # Query active refresh tokens
    tokens = db.query(RefreshToken).filter(
        RefreshToken.is_revoked == False,
        RefreshToken.expires_at > now
    ).all()

    matched_rt: Optional[RefreshToken] = None
    for token_record in tokens:
        if verify_password(raw_refresh_token, token_record.token_hash):
            matched_rt = token_record
            break

    if not matched_rt:
        raise UnauthorizedException("Invalid or expired refresh token")

    user = db.query(User).filter(User.id == matched_rt.user_id).first()
    if not user or not user.is_active:
        raise UnauthorizedException("User inactive or no longer exists")

    # Rotate refresh token
    matched_rt.is_revoked = True
    db.commit()

    return create_user_tokens(db, user)

def revoke_user_tokens(db: Session, user_id: uuid.UUID) -> int:
    """Revoke all active refresh tokens for user (logout all sessions)."""
    count = db.query(RefreshToken).filter(
        RefreshToken.user_id == user_id,
        RefreshToken.is_revoked == False
    ).update({"is_revoked": True})
    db.commit()
    return count

def change_password(db: Session, user: User, old_pw: str, new_pw: str):
    if not verify_password(old_pw, user.password_hash):
        raise BadRequestException("Current password is incorrect")
    user.password_hash = get_password_hash(new_pw)
    db.commit()
    # Revoke tokens for security
    revoke_user_tokens(db, user.id)
    record_audit_log(
        db,
        entity_type="user",
        entity_id=str(user.id),
        action="UPDATE",
        actor_id=user.id,
        change_summary="Password changed successfully."
    )
