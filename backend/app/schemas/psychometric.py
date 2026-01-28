from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

class PsychometricDataBase(BaseModel):
    disc_type: Optional[str]
    disc_d: Optional[int]
    disc_i: Optional[int]
    disc_s: Optional[int]
    disc_c: Optional[int]
    archetype: Optional[str]
    myers_briggs_type: Optional[str]
    overview: Optional[List[str]]
    behavior: Optional[List[str]]
    building_trust: Optional[List[str]]
    driving_action: Optional[List[str]]
    selling: Optional[List[str]]

class PsychometricDataCreate(PsychometricDataBase):
    lead_id: int

class PsychometricDataResponse(PsychometricDataBase):
    data_id: int
    lead_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True 