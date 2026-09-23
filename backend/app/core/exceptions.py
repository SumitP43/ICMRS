from typing import Optional, Any, Dict
from fastapi import HTTPException, status

class ICMRSException(HTTPException):
    def __init__(
        self,
        status_code: int,
        message: str,
        error_code: str = "GENERIC_ERROR",
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(status_code=status_code, detail=message)
        self.message = message
        self.error_code = error_code
        self.details = details or {}

class NotFoundException(ICMRSException):
    def __init__(self, message: str = "Resource not found", error_code: str = "NOT_FOUND"):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            message=message,
            error_code=error_code
        )

class UnauthorizedException(ICMRSException):
    def __init__(self, message: str = "Authentication required or invalid credentials", error_code: str = "UNAUTHORIZED"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            message=message,
            error_code=error_code
        )

class ForbiddenException(ICMRSException):
    def __init__(self, message: str = "You do not have permission to perform this action", error_code: str = "FORBIDDEN"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            message=message,
            error_code=error_code
        )

class BadRequestException(ICMRSException):
    def __init__(self, message: str = "Bad request parameters", error_code: str = "BAD_REQUEST", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            message=message,
            error_code=error_code,
            details=details
        )

class ConflictException(ICMRSException):
    def __init__(self, message: str = "Resource conflict", error_code: str = "CONFLICT"):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            message=message,
            error_code=error_code
        )

class ValidationException(ICMRSException):
    def __init__(self, message: str = "Validation failed", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            message=message,
            error_code="VALIDATION_ERROR",
            details=details
        )

class SLABreachException(ICMRSException):
    def __init__(self, message: str = "Complaint SLA breached", error_code: str = "SLA_BREACHED"):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            message=message,
            error_code=error_code
        )
