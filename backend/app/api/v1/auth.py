from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.schemas.common import ResponseEnvelope
from backend.app.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    RefreshTokenRequest,
    ChangePasswordRequest,
    UserResponse
)
from backend.app.database.models.user import User
from backend.app.services.auth import (
    register_user,
    authenticate_user,
    create_user_tokens,
    refresh_access_token,
    revoke_user_tokens,
    change_password
)
from backend.app.core.permissions import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    user = register_user(db, data)
    dept_name = user.department.name if user.department else None
    access_token, refresh_token, expires_in = create_user_tokens(db, user)
    user_dict = {
        "id": str(user.id),
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "department": dept_name,
        "badgeNumber": user.badge_number,
        "wardOrSector": user.ward_or_sector,
        "phoneNumber": user.phone
    }
    return {
        "success": True,
        "message": "User registered successfully",
        "token": access_token,
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": expires_in,
        "user": user_dict,
        "data": user_dict
    }

@router.post("/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, data.email, data.password)
    access_token, refresh_token, expires_in = create_user_tokens(db, user)
    dept_name = user.department.name if user.department else None

    user_dict = {
        "id": str(user.id),
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "department": dept_name,
        "badgeNumber": user.badge_number,
        "wardOrSector": user.ward_or_sector,
        "phoneNumber": user.phone
    }

    return {
        "success": True,
        "message": "Authentication successful",
        "token": access_token,
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": expires_in,
        "user": user_dict,
        "data": {
            "token": access_token,
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": expires_in,
            "user": user_dict
        }
    }

@router.post("/refresh", response_model=ResponseEnvelope[TokenResponse])
def refresh_token_endpoint(data: RefreshTokenRequest, db: Session = Depends(get_db)):
    access_token, new_refresh_token, expires_in = refresh_access_token(db, data.refresh_token)
    return ResponseEnvelope(
        success=True,
        message="Token refreshed successfully",
        data=TokenResponse(
            access_token=access_token,
            refresh_token=new_refresh_token,
            token_type="bearer",
            expires_in=expires_in
        )
    )

@router.post("/logout")
def logout(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    revoked = revoke_user_tokens(db, current_user.id)
    return {
        "success": True,
        "message": f"Logged out successfully. Revoked {revoked} session(s)."
    }

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    dept_name = current_user.department.name if current_user.department else None
    user_dict = {
        "id": str(current_user.id),
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role,
        "department": dept_name,
        "badgeNumber": current_user.badge_number,
        "wardOrSector": current_user.ward_or_sector,
        "phoneNumber": current_user.phone
    }
    return {
        "success": True,
        "user": user_dict,
        "data": user_dict
    }

@router.post("/change-password", response_model=ResponseEnvelope[dict])
def change_pwd(
    data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    change_password(db, current_user, data.old_password, data.new_password)
    return ResponseEnvelope(
        success=True,
        message="Password changed successfully. Please log in with your new password."
    )

@router.post("/google")
def google_auth(payload: dict, db: Session = Depends(get_db)):
    """
    Google OAuth login & registration.
    Accepts credential / idToken from Google Identity Services.
    """
    credential = payload.get("credential") or payload.get("idToken") or payload.get("token")
    email = payload.get("email")
    name = payload.get("name")

    # If credential is a JWT, attempt to decode claims safely
    if credential and not email:
        try:
            # Decode unverified claims from Google JWT token
            import json, base64
            parts = credential.split(".")
            if len(parts) >= 2:
                padded = parts[1] + "=" * ((4 - len(parts[1]) % 4) % 4)
                claims = json.loads(base64.urlsafe_b64decode(padded).decode("utf-8"))
                email = claims.get("email")
                name = claims.get("name") or claims.get("given_name")
        except Exception:
            pass

    if not email:
        raise AuthenticationException("Could not extract valid Google account information.")

    user = db.query(User).filter(User.email == email.lower().strip()).first()
    if not user:
        # Create citizen user for Google sign-in
        import uuid
        from backend.app.core.security import get_password_hash
        user = User(
            email=email.lower().strip(),
            password_hash=get_password_hash(uuid.uuid4().hex),
            name=name or email.split("@")[0].capitalize(),
            role="citizen",
            phone=None,
            ward_or_sector="Google Verified Resident",
            badge_number="Citizen Google Auth",
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    access_token, refresh_token, expires_in = create_user_tokens(db, user)
    dept_name = user.department.name if user.department else None

    user_dict = {
        "id": str(user.id),
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "department": dept_name,
        "badgeNumber": user.badge_number,
        "wardOrSector": user.ward_or_sector,
        "phoneNumber": user.phone
    }

    return {
        "success": True,
        "message": "Google authentication successful",
        "token": access_token,
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": expires_in,
        "user": user_dict,
        "data": user_dict
    }
