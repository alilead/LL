import os
import shutil
from typing import Optional
from fastapi import UploadFile
from pathlib import Path
from app.core.config import settings

UPLOAD_DIR = Path(settings.UPLOAD_DIR)

def ensure_upload_dir():
    """Ensure upload directory exists"""
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

def get_file_path(file_id: int, filename: str) -> Path:
    """Get full path for a file"""
    return UPLOAD_DIR / f"{file_id}_{filename}"

async def upload_file(file: UploadFile, file_id: int) -> str:
    """
    Upload a file to the upload directory.
    Returns the file path.
    """
    ensure_upload_dir()
    
    file_path = get_file_path(file_id, file.filename)
    
    try:
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    finally:
        file.file.close()
    
    return str(file_path)

def delete_file(file_path: Optional[str]) -> bool:
    """
    Delete a file from the upload directory.
    Returns True if successful, False otherwise.
    """
    if not file_path:
        return False
    
    path = Path(file_path)
    if path.exists():
        path.unlink()
        return True
    return False
