from pathlib import Path
from fastapi import FastAPI
from pydantic import BaseModel, Field
from typing import Any, Dict
import json
import joblib
import pandas as pd

app = FastAPI(title="Disaster Risk Intelligence Service", version="2.6.0")
BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "models" / "disaster_severity_model.joblib"
EVALUATION_PATH = BASE_DIR / "models" / "evaluation.json"
FEATURES = ["disaster_type", "latitude", "longitude", "year", "month"]
model = joblib.load(MODEL_PATH) if MODEL_PATH.exists() else None

class RiskRequest(BaseModel):
    region: Dict[str, Any]
    hazard: Dict[str, Any] = Field(default_factory=dict)
    meta: Dict[str, Any] = Field(default_factory=dict)

def number(data: Dict[str, Any], key: str, default: float = 0.0) -> float:
    value = data.get(key, default)
    try:
        return max(0.0, min(100.0, float(value)))
    except (TypeError, ValueError):
        return default

def integer(data: Dict[str, Any], key: str, default: int) -> int:
    value = data.get(key, default)
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return default

def coordinate(data: Dict[str, Any], keys: list[str], default: float = 0.0) -> float:
    for key in keys:
        value = data.get(key)
        try:
            return float(value)
        except (TypeError, ValueError):
            continue
    return default

def text(data: Dict[str, Any], key: str, default: str) -> str:
    value = data.get(key, default)
    return str(value).strip() or default

def level(score: float) -> str:
    if score >= 75:
        return "critical"
    if score >= 50:
        return "high"
    if score >= 25:
        return "medium"
    return "low"

def action_for(level_name: str, hazard_type: str) -> list[str]:
    actions = {
        "low": ["Continue monitoring local conditions."],
        "medium": ["Review local guidance and prepare essential supplies."],
        "high": ["Follow official instructions and prepare for possible evacuation."],
        "critical": ["Follow official emergency instructions immediately and move to a safe location if advised."],
    }
    result = actions[level_name].copy()
    if hazard_type in {"flood", "tsunami", "cyclone", "storm"}:
        result.append("Avoid low-lying areas and do not travel through moving water.")
    elif hazard_type in {"wildfire", "industrial"}:
        result.append("Avoid smoke or hazardous zones and follow evacuation boundaries.")
    elif hazard_type == "earthquake":
        result.append("Stay away from damaged structures and be prepared for aftershocks.")
    elif hazard_type == "heatwave":
        result.append("Limit heat exposure and stay hydrated in a cool location.")
    elif hazard_type == "landslide":
        result.append("Keep away from unstable slopes and recently affected areas.")
    return result

def baseline_prediction(data: RiskRequest):
    hazard = data.hazard
    region = data.region
    hazard_intensity = number(hazard, "intensity", number(region, "hazardIntensity"))
    hazard_probability = number(hazard, "probability", number(region, "hazardProbability"))
    exposure = number(region, "exposure", number(region, "populationDensity"))
    vulnerability = number(region, "vulnerability", number(region, "terrainVulnerability"))
    historical = number(region, "historicalRisk", number(region, "historicalDisasters"))
    components = [("hazard_intensity", hazard_intensity, 0.30, "scenario-input"), ("hazard_probability", hazard_probability, 0.20, "scenario-input"), ("exposure", exposure, 0.20, "scenario-input"), ("vulnerability", vulnerability, 0.20, "scenario-input"), ("historical_risk", historical, 0.10, "scenario-input")]
    score = round(sum(value * weight for _, value, weight, _ in components), 2)
    risk_level = level(score)
    supplied = sum(1 for value in [hazard.get("intensity"), hazard.get("probability"), region.get("exposure"), region.get("vulnerability"), region.get("historicalRisk")] if value is not None)
    confidence = round(0.55 + (supplied / 5) * 0.4, 2)
    factors = [{"name": name, "value": round(value, 2), "weight": weight, "contribution": round(value * weight, 2), "source": source} for name, value, weight, source in components]
    return {"riskScore": score, "riskLevel": risk_level, "confidence": confidence, "factors": factors, "recommendedActions": action_for(risk_level, text(hazard, "type", "other").lower()), "method": "weighted-risk-model-v1"}

def trained_prediction(data: RiskRequest):
    hazard = data.hazard
    region = data.region
    current_signal = region.get("currentSignal") or hazard.get("currentSignal") or data.meta.get("currentSignal") or {}
    current_time = pd.Timestamp.utcnow()
    signal_type = text(current_signal, "type", text(hazard, "type", "other")).lower()
    row = pd.DataFrame([{
        "disaster_type": signal_type,
        "latitude": coordinate(region, ["lat", "latitude"]),
        "longitude": coordinate(region, ["lng", "lon", "longitude"]),
        "year": integer(region, "year", current_time.year),
        "month": integer(region, "month", current_time.month),
    }], columns=FEATURES)
    prediction = str(model.predict(row)[0])
    probabilities = model.predict_proba(row)[0] if hasattr(model, "predict_proba") else []
    classes = model.classes_ if hasattr(model, "classes_") else []
    confidence = float(max(probabilities)) if len(probabilities) else 0.0
    probability_map = {str(label): round(float(value), 4) for label, value in zip(classes, probabilities)}
    score_map = {"low": 20, "medium": 45, "high": 70, "critical": 90}
    historical_score = round(sum(float(probability_map.get(name, 0.0)) * score for name, score in score_map.items()), 2)
    hazard_intensity = number(current_signal, "intensity", number(hazard, "intensity", number(region, "hazardIntensity")))
    hazard_probability = number(current_signal, "probability", number(hazard, "probability", number(region, "hazardProbability")))
    exposure = number(current_signal, "exposure", number(region, "exposure", number(region, "populationDensity")))
    vulnerability = number(current_signal, "vulnerability", number(region, "vulnerability", number(region, "terrainVulnerability")))
    current_source = text(current_signal, "source", "scenario-input")
    components = [
        ("hazard_intensity", hazard_intensity, 0.20, current_source),
        ("hazard_probability", hazard_probability, 0.15, current_source),
        ("exposure", exposure, 0.10, current_source),
        ("vulnerability", vulnerability, 0.10, current_source),
        ("historical_risk", historical_score, 0.45, "trained-model"),
    ]
    final_score = round(sum(value * weight for _, value, weight, _ in components), 2)
    risk_level = level(final_score)
    factors = [{"name": name, "value": round(value, 2), "weight": weight, "contribution": round(value * weight, 2), "source": source} for name, value, weight, source in components]
    return {
        "riskScore": final_score,
        "riskLevel": risk_level,
        "confidence": round(confidence, 4),
        "probabilities": probability_map,
        "historicalPrediction": prediction,
        "historicalScore": historical_score,
        "factors": factors,
        "currentSignal": {"type": signal_type, "source": current_source},
        "recommendedActions": action_for(risk_level, signal_type),
        "method": "hybrid-ml-risk-engine",
    }

@app.get("/health")
def health():
    return {"status": "ok", "service": "risk-intelligence", "modelLoaded": model is not None, "modelPath": str(MODEL_PATH), "features": FEATURES}

@app.get("/model-info")
def model_info():
    evaluation = {}
    if EVALUATION_PATH.exists():
        try:
            evaluation = json.loads(EVALUATION_PATH.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            evaluation = {}
    return {"modelLoaded": model is not None, "features": FEATURES, "target": "severity_class", "evaluation": evaluation}

@app.post("/analyze-risk")
def analyze_risk(data: RiskRequest):
    if model is not None:
        return trained_prediction(data)
    return baseline_prediction(data)
