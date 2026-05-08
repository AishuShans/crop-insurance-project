import os
import joblib
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split

MODEL_PATH = "rf_model.joblib"

def train_and_save_model():
    # Generate some synthetic data for training
    np.random.seed(42)
    n_samples = 1000
    
    # Features
    damage_percentage = np.random.uniform(0, 100, n_samples)
    
    # Categorical features mock (encoded as integers for simplicity in this baseline)
    # real app would use OneHotEncoder
    crop_type_encoded = np.random.randint(0, 5, n_samples)
    soil_type_encoded = np.random.randint(0, 3, n_samples)
    irrigation_type_encoded = np.random.randint(0, 2, n_samples)
    event_type_encoded = np.random.randint(0, 4, n_samples)
    
    # Target rules:
    # High damage > 70% -> Accept
    # Low damage < 20% -> Reject
    # Else -> Manual Review
    
    y = []
    for damage in damage_percentage:
        if damage > 70:
            y.append('Accept')
        elif damage < 20:
            y.append('Reject')
        else:
            y.append('Review')
            
    X = pd.DataFrame({
        'damage_percentage': damage_percentage,
        'crop_type': crop_type_encoded,
        'soil_type': soil_type_encoded,
        'irrigation_type': irrigation_type_encoded,
        'event_type': event_type_encoded
    })
    # Save training data for researchers (with label)
    df_save = X.copy()
    df_save['claim_status'] = y
    df_save.to_csv("claims_training_dataset.csv", index=False)

    clf = RandomForestClassifier(n_estimators=100, random_state=42)
    clf.fit(X, y)
    
    # Save model
    joblib.dump(clf, MODEL_PATH)
    print("Model trained and saved to", MODEL_PATH)

def load_model():
    if not os.path.exists(MODEL_PATH):
        train_and_save_model()
    return joblib.load(MODEL_PATH)

def calculate_fraud_score(claim_data: dict, polygon_geojson: str) -> tuple:
    """Calculate an AI fraud risk score based on various heuristics."""
    score = 0.0
    
    # Heuristic 1: Extremely high claim amount requested for small typical acreage
    if claim_data.get('requested_claim_amount', 0) > 100000:
        score += 30.0
        
    # Heuristic 2: Unrealistic NDVI damage percentage (e.g. 100% is very rare)
    damage_pct = claim_data.get('damage_percentage', 0)
    if damage_pct > 95:
        score += 20.0
    elif damage_pct < 5 and claim_data.get('requested_claim_amount', 0) > 5000:
        score += 40.0
        
    # Heuristic 3: Duplicate/Overlapping coordinates (simulated check here)
    if polygon_geojson and len(polygon_geojson) < 50:
        score += 50.0 # Invalid polygon
        
    # Cap score at 100
    score = min(score, 100.0)
    
    # Determine risk level
    if score < 30:
        risk_level = "Low"
    elif score < 70:
        risk_level = "Medium"
    else:
        risk_level = "High"
        
    return score, risk_level

def predict_claim(damage_pct: float, crop_type: str, event_type: str) -> tuple:
    """Predict Accept/Reject/Review for a new claim, along with confidence."""
    model = load_model()
    
    # Dummy encoding for inference
    crop_encoded = hash(crop_type) % 5
    event_encoded = hash(event_type) % 4
    
    # Dummy soil/irrigation
    soil_encoded = 1
    irrigation_encoded = 1
    
    features = pd.DataFrame({
        'damage_percentage': [damage_pct],
        'crop_type': [crop_encoded],
        'soil_type': [soil_encoded],
        'irrigation_type': [irrigation_encoded],
        'event_type': [event_encoded]
    })
    
    prediction = model.predict(features)[0]
    
    # Get prediction probabilities for confidence score
    probs = model.predict_proba(features)[0]
    confidence = float(max(probs))
    
    return prediction, confidence
