from typing import Optional
from pydantic import BaseModel, Field
from datetime import datetime

# Shared properties
class LeadStageBase(BaseModel):
    name: str = Field(..., description="Aşama adı", example="İlk Görüşme")
    description: Optional[str] = Field(None, description="Aşama açıklaması", example="Potansiyel müşteri ile ilk görüşme")
    order: int = Field(..., description="Aşama sırası", example=1)
    organization_id: int = Field(..., description="Aşamanın ait olduğu organizasyon ID'si")

# Properties to receive on lead stage creation
class LeadStageCreate(LeadStageBase):
    pass

# Properties to receive on lead stage update
class LeadStageUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    order: Optional[int] = None

# Properties shared by models stored in DB
class LeadStageInDBBase(LeadStageBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Properties to return to client
class LeadStageResponse(LeadStageInDBBase):
    pass

# Additional properties stored in DB
class LeadStageInDB(LeadStageInDBBase):
    pass

# Properties to return to client
class LeadStage(LeadStageInDBBase):
    pass
