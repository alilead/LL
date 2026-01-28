from typing import Optional, Any, Dict, List
from pydantic import BaseModel

class GenericResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Dict[str, Any]] = None
