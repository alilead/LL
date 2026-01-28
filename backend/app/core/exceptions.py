from fastapi import HTTPException, status

class LeadLabException(HTTPException):
    """Base exception for LeadLab"""
    def __init__(self, status_code: int, detail: str):
        super().__init__(status_code=status_code, detail=detail)

class DuplicateLeadError(LeadLabException):
    """Raised when trying to create a duplicate lead"""
    def __init__(self, detail: str = "Lead already exists"):
        super().__init__(status_code=status.HTTP_409_CONFLICT, detail=detail)

class InvalidCSVFormatError(LeadLabException):
    """Raised when CSV format is invalid"""
    def __init__(self, detail: str = "Invalid CSV format"):
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)

class InsufficientTokensError(LeadLabException):
    """Raised when user has insufficient tokens"""
    def __init__(self, detail: str = "Insufficient tokens"):
        super().__init__(status_code=status.HTTP_402_PAYMENT_REQUIRED, detail=detail)

class UnauthorizedError(LeadLabException):
    """Raised when user is unauthorized"""
    def __init__(self, detail: str = "Unauthorized"):
        super().__init__(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail)

class ForbiddenError(LeadLabException):
    """Raised when user is forbidden to access resource"""
    def __init__(self, detail: str = "Forbidden"):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail=detail)

class NotFoundError(LeadLabException):
    """Raised when resource is not found"""
    def __init__(self, detail: str = "Not found"):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, detail=detail)
