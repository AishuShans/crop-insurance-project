from sqlalchemy import Column, Integer, String, Float, Text, Date
from database import Base

class Claim(Base):
    __tablename__ = "claims"

    id = Column(Integer, primary_key=True, index=True)
    claim_id = Column(String, unique=True, index=True)  # Auto-generated unique ID
    farmer_name = Column(String, index=True)
    phone_number = Column(String)
    village = Column(String)
    farmer_id = Column(String)
    
    crop_type = Column(String)
    sowing_date = Column(Date)
    expected_harvest_date = Column(Date)
    
    event_type = Column(String)
    event_start_date = Column(Date)
    event_end_date = Column(Date)
    
    polygon_geojson = Column(Text) # Stored as JSON string
    area_acres = Column(Float, nullable=True)
    area_hectares = Column(Float, nullable=True)

    # Claim Amounts
    requested_claim_amount = Column(Float, nullable=True)
    suggested_payout = Column(Float, nullable=True)

    # NDVI Processing Results
    ndvi_before_map = Column(String, nullable=True) # URL or Base64
    ndvi_after_map = Column(String, nullable=True)
    ndvi_diff_map = Column(String, nullable=True)
    damage_percentage = Column(Float, nullable=True)

    # ML Prediction and Admin Action
    ml_prediction = Column(String, nullable=True) # Accept, Review, Reject
    ml_confidence = Column(Float, nullable=True) # e.g. 0.95
    status = Column(String, default="Pending") # Pending, Verified, Approved, Rejected
    admin_notes = Column(Text, nullable=True)
    
    # AI Fraud Detection
    fraud_score = Column(Float, nullable=True)
    fraud_risk_level = Column(String, nullable=True) # Low, Medium, High
