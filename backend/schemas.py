from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import date

class ClaimBase(BaseModel):
    farmer_name: str
    phone_number: str
    village: str
    farmer_id: str
    crop_type: str
    sowing_date: date
    expected_harvest_date: date
    event_type: str
    event_start_date: date
    event_end_date: date
    polygon_geojson: str
    requested_claim_amount: Optional[float] = 0.0
    area_acres: Optional[float] = None
    area_hectares: Optional[float] = None

class ClaimCreate(ClaimBase):
    pass

class ClaimResponse(ClaimBase):
    id: int
    claim_id: str
    
    suggested_payout: Optional[float] = None
    
    ndvi_before_map: Optional[str] = None
    ndvi_after_map: Optional[str] = None
    ndvi_diff_map: Optional[str] = None
    damage_percentage: Optional[float] = None
    
    ml_prediction: Optional[str] = None
    ml_confidence: Optional[float] = None
    status: str
    admin_notes: Optional[str] = None
    
    fraud_score: Optional[float] = None
    fraud_risk_level: Optional[str] = None

    class Config:
        from_attributes = True

class ClaimUpdateStatus(BaseModel):
    status: str
    admin_notes: Optional[str] = None

class ChatRequest(BaseModel):
    message: str
    language: Optional[str] = None
    
class ChatResponse(BaseModel):
    reply: str
    language: str
