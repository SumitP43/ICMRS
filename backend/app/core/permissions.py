import uuid
from typing import Optional, List, Callable
from fastapi import Depends, Header
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import JWTError
from backend.app.core.security import decode_token
from backend.app.core.exceptions import UnauthorizedException, ForbiddenException
from backend.app.database.session import get_db
from backend.app.database.models.user import User
from backend.app.database.models.department import Officer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)

def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db)
) -> User:
    raw_token = token
    if not raw_token and authorization and authorization.startswith("Bearer "):
        raw_token = authorization.split(" ")[1]
        
    if not raw_token:
        raise UnauthorizedException("Authorization token missing")

    try:
        payload = decode_token(raw_token)
        user_id_str: str = payload.get("sub")
        if not user_id_str:
            raise UnauthorizedException("Invalid token payload: missing sub")
        user_id = uuid.UUID(user_id_str)
    except (JWTError, ValueError) as exc:
        raise UnauthorizedException(f"Could not validate credentials: {str(exc)}")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise UnauthorizedException("User no longer exists in system")
    if not user.is_active:
        raise ForbiddenException("User account has been deactivated")
    return user

def get_optional_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db)
) -> Optional[User]:
    try:
        return get_current_user(token, authorization, db)
    except Exception:
        return None

def require_role(allowed_roles: List[str]) -> Callable:
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise ForbiddenException(
                f"Access forbidden: role '{current_user.role}' is not in allowed roles {allowed_roles}"
            )
        return current_user
    return role_checker

def get_current_officer(
    current_user: User = Depends(require_role(["officer", "admin"])),
    db: Session = Depends(get_db)
) -> tuple[User, Optional[Officer]]:
    officer = db.query(Officer).filter(Officer.user_id == current_user.id).first()
    return current_user, officer

def get_current_admin(
    current_user: User = Depends(require_role(["admin"]))
) -> User:
    return current_user
