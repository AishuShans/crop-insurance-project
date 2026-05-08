from fastapi import FastAPI, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any
import uuid
from starlette.responses import StreamingResponse
import io

from database import engine, get_db, Base
from models import Claim
from schemas import ClaimCreate, ClaimResponse, ClaimUpdateStatus, ChatRequest, ChatResponse
from gee_processor import process_ndvi
from ml_model import predict_claim, calculate_fraud_score
from pdf_report import generate_claim_pdf
from chat import generate_chat_response
from dotenv import load_dotenv

load_dotenv()

# Create db tables
Base.metadata.create_all(bind=engine)

from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

app = FastAPI(title="Crop Insurance API")

app.mount("/static", StaticFiles(directory="static"), name="static")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/claims", response_model=ClaimResponse)
def submit_claim(claim: ClaimCreate, db: Session = Depends(get_db)):
    # Create unique claim ID
    claim_id_str = f"CLM-{str(uuid.uuid4())[:8].upper()}"
    
    # 1. Process NDVI data using dummy Earth Engine
    ndvi_result = process_ndvi(
        polygon_geojson=claim.polygon_geojson,
        event_start=claim.event_start_date.isoformat(),
        event_end=claim.event_end_date.isoformat()
    )
    
    # 2. Predict ML outcome and get confidence
    ml_pred, ml_conf = predict_claim(
        damage_pct=ndvi_result['damage_percentage'],
        crop_type=claim.crop_type,
        event_type=claim.event_type
    )

    # 3. Calculate suggested payout
    dmg_pct = ndvi_result['damage_percentage'] or 0.0
    sugg_payout = claim.requested_claim_amount * (dmg_pct / 100.0)
    
    # 4. Calculate Fraud Risk
    claim_dict = claim.dict()
    claim_dict['damage_percentage'] = dmg_pct
    f_score, f_risk = calculate_fraud_score(claim_dict, claim.polygon_geojson)

    db_claim = Claim(
        **claim.dict(),
        claim_id=claim_id_str,
        ndvi_before_map=ndvi_result['ndvi_before_map'],
        ndvi_after_map=ndvi_result['ndvi_after_map'],
        ndvi_diff_map=ndvi_result['ndvi_diff_map'],
        damage_percentage=ndvi_result['damage_percentage'],
        ml_prediction=ml_pred,
        ml_confidence=ml_conf,
        suggested_payout=sugg_payout,
        fraud_score=f_score,
        fraud_risk_level=f_risk,
        status="Pending"
    )
    
    db.add(db_claim)
    db.commit()
    db.refresh(db_claim)
    return db_claim

@app.get("/api/admin/claims/export")
def export_claims_csv(db: Session = Depends(get_db)):
    claims = db.query(Claim).all()
    
    output = io.StringIO()
    import csv
    writer = csv.writer(output)
    
    # Header
    writer.writerow(['Claim ID', 'Farmer Name', 'Crop', 'Event', 'Requested Amount', 'Damage Pct', 'ML Prediction', 'Confidence', 'Fraud Risk', 'Status'])
    
    for c in claims:
        writer.writerow([
            c.claim_id, c.farmer_name, c.crop_type, c.event_type, 
            c.requested_claim_amount, c.damage_percentage, 
            c.ml_prediction, c.ml_confidence, c.fraud_risk_level, c.status
        ])
        
    response = StreamingResponse(iter([output.getvalue()]), media_type="text/csv")
    response.headers["Content-Disposition"] = "attachment; filename=claims_export.csv"
    return response

@app.get("/api/claims/{claim_id}", response_model=ClaimResponse)
def get_claim(claim_id: str, db: Session = Depends(get_db)):
    db_claim = db.query(Claim).filter((Claim.claim_id == claim_id) | (Claim.phone_number == claim_id)).first()
    if db_claim is None:
        raise HTTPException(status_code=404, detail="Claim not found")
    return db_claim

@app.get("/api/admin/claims", response_model=List[ClaimResponse])
def get_all_claims(
    crop_type: str = None, 
    event_type: str = None, 
    status: str = None,
    db: Session = Depends(get_db)
):
    query = db.query(Claim)
    if crop_type:
        query = query.filter(Claim.crop_type == crop_type)
    if event_type:
        query = query.filter(Claim.event_type == event_type)
    if status:
        query = query.filter(Claim.status == status)
    return query.all()

@app.put("/api/admin/claims/{claim_id}", response_model=ClaimResponse)
def update_claim_status(claim_id: str, update_data: ClaimUpdateStatus, db: Session = Depends(get_db)):
    db_claim = db.query(Claim).filter(Claim.claim_id == claim_id).first()
    if not db_claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    
    db_claim.status = update_data.status
    db_claim.admin_notes = update_data.admin_notes
    db.commit()
    db.refresh(db_claim)
    return db_claim

@app.get("/api/admin/dashboard")
def get_dashboard_stats(db: Session = Depends(get_db)):
    total = db.query(Claim).count()
    status_counts = db.query(Claim.status, func.count(Claim.id)).group_by(Claim.status).all()
    crop_counts = db.query(Claim.crop_type, func.count(Claim.id)).group_by(Claim.crop_type).all()
    event_counts = db.query(Claim.event_type, func.count(Claim.id)).group_by(Claim.event_type).all()
    
    return {
        "total_claims": total,
        "status_distribution": {k: v for k, v in status_counts},
        "crop_distribution": {k: v for k, v in crop_counts},
        "event_distribution": {k: v for k, v in event_counts}
    }

@app.get("/api/claims/{claim_id}/pdf")
def download_claim_pdf(claim_id: str, lang: str = "en", db: Session = Depends(get_db)):
    db_claim = db.query(Claim).filter(Claim.claim_id == claim_id).first()
    if not db_claim:
        raise HTTPException(status_code=404, detail="Claim not found")
        
    pdf_bytes = generate_claim_pdf(db_claim, lang=lang)
    
    return StreamingResponse(
        io.BytesIO(pdf_bytes), 
        media_type="application/pdf", 
        headers={"Content-Disposition": f"attachment; filename=claim_{claim_id}.pdf"}
    )

@app.post("/api/chat", response_model=ChatResponse)
def handle_chat(request: ChatRequest):
    return generate_chat_response(request)
