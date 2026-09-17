from pathlib import Path
from fastapi import FastAPI
from pydantic import BaseModel, Field
from typing import Any, Dict
import json
import math
from datetime import datetime, timezone
import joblib
import pandas as pd
import requests

app = FastAPI(title="Disaster Risk Intelligence Service", version="3.0.0")
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

def resource_signal(region: Dict[str, Any]) -> tuple[float, float, Dict[str, Any]]:
    reports = region.get("nearbyReports") or []
    shelters = region.get("nearbyShelters") or []
    infrastructure = region.get("nearbyInfrastructure") or []
    report_count = len(reports) if isinstance(reports, list) else int(region.get("nearbyReportCount", 0) or 0)
    shelter_capacity = 0.0
    if isinstance(shelters, list):
        shelter_capacity = sum(max(0.0, float(item.get("availableCapacity", 0) or 0)) for item in shelters if isinstance(item, dict))
    infrastructure_count = len(infrastructure) if isinstance(infrastructure, list) else int(region.get("nearbyInfrastructureCount", 0) or 0)
    vulnerable_infrastructure = 0
    if isinstance(infrastructure, list):
        vulnerable_infrastructure = sum(1 for item in infrastructure if isinstance(item, dict) and str(item.get("status", "")).lower() in {"damaged", "closed", "critical", "offline", "limited"})
    report_signal = min(100.0, report_count * 20.0)
    capacity_relief = min(30.0, shelter_capacity / 25.0)
    exposure = min(100.0, report_signal + infrastructure_count * 2.0)
    vulnerability = min(100.0, vulnerable_infrastructure * 12.0 + max(0.0, 20.0 - capacity_relief) + infrastructure_count * 1.5)
    metadata = {"verifiedReports": report_count, "availableShelterCapacity": round(shelter_capacity, 1), "infrastructureAssets": infrastructure_count, "vulnerableInfrastructure": vulnerable_infrastructure}
    return round(exposure, 2), round(vulnerability, 2), metadata

def usgs_signal(latitude: float, longitude: float, radius_km: float) -> Dict[str, Any]:
    try:
        params = {"format": "geojson", "latitude": latitude, "longitude": longitude, "maxradiuskm": max(1.0, min(radius_km, 500.0)), "minmagnitude": 4.0, "limit": 20, "orderby": "time-asc"}
        response = requests.get("https://earthquake.usgs.gov/fdsnws/event/1/query", params=params, timeout=3)
        response.raise_for_status()
        features = response.json().get("features", [])
        if not features:
            return {"available": True, "events": 0, "intensity": 0.0, "probability": 0.0, "source": "usgs-live"}
        magnitudes = [float(item.get("properties", {}).get("mag")) for item in features if item.get("properties", {}).get("mag") is not None]
        strongest = max(magnitudes) if magnitudes else 0.0
        intensity = min(100.0, max(0.0, (strongest - 3.0) * 20.0))
        probability = min(100.0, len(features) * 8.0 + intensity * 0.35)
        return {"available": True, "events": len(features), "strongestMagnitude": strongest, "intensity": round(intensity, 2), "probability": round(probability, 2), "source": "usgs-live"}
    except (requests.RequestException, ValueError, TypeError):
        return {"available": False, "events": 0, "intensity": 0.0, "probability": 0.0, "source": "usgs-unavailable"}

def enrich_current_signal(data: RiskRequest) -> tuple[Dict[str, Any], Dict[str, Any]]:
    region = data.region
    hazard = data.hazard
    current = region.get("currentSignal") or hazard.get("currentSignal") or data.meta.get("currentSignal") or {}
    signal_type = text(current, "type", text(hazard, "type", "other")).lower()
    exposure, vulnerability, resource_meta = resource_signal(region)
    if "exposure" in current:
        exposure = max(exposure, number(current, "exposure"))
    if "vulnerability" in current:
        vulnerability = max(vulnerability, number(current, "vulnerability"))
    live = {"source": "none"}
    if signal_type == "earthquake":
        lat = coordinate(region, ["lat", "latitude"])
        lon = coordinate(region, ["lng", "lon", "longitude"])
        radius_km = max(1.0, float(region.get("radius", 3000) or 3000) / 1000.0)
        live = usgs_signal(lat, lon, radius_km)
    intensity = number(current, "intensity", number(hazard, "intensity", number(region, "hazardIntensity")))
    probability = number(current, "probability", number(hazard, "probability", number(region, "hazardProbability")))
    if live.get("source") == "usgs-live":
        intensity = max(intensity, float(live.get("intensity", 0)))
        probability = max(probability, float(live.get("probability", 0)))
    signal = {"type": signal_type, "intensity": round(intensity, 2), "probability": round(probability, 2), "exposure": round(exposure, 2), "vulnerability": round(vulnerability, 2), "source": text(current, "source", live.get("source", "scenario-input")), "live": live, "resources": resource_meta}
    return signal, live

def baseline_prediction(data: RiskRequest):
    signal, live = enrich_current_signal(data)
    historical = number(data.region, "historicalRisk", number(data.region, "historicalDisasters"))
    components = [("hazard_intensity", signal["intensity"], 0.25, signal["source"]), ("hazard_probability", signal["probability"], 0.20, signal["source"]), ("exposure", signal["exposure"], 0.15, "current-intelligence"), ("vulnerability", signal["vulnerability"], 0.15, "current-intelligence"), ("historical_risk", historical, 0.25, "scenario-input")]
    score = round(sum(value * weight for _, value, weight, _ in components), 2)
    risk_level = level(score)
    factors = [{"name": name, "value": round(value, 2), "weight": weight, "contribution": round(value * weight, 2), "source": source} for name, value, weight, source in components]
    return {"riskScore": score, "riskLevel": risk_level, "confidence": 0.75, "probabilities": {}, "historicalPrediction": None, "historicalScore": historical, "factors": factors, "currentSignal": signal, "liveHazard": live, "recommendedActions": action_for(risk_level, signal["type"]), "method": "hybrid-fallback-risk-engine"}

def trained_prediction(data: RiskRequest):
    signal, live = enrich_current_signal(data)
    region = data.region
    current_time = datetime.now(timezone.utc)
    row = pd.DataFrame([{"disaster_type": signal["type"], "latitude": coordinate(region, ["lat", "latitude"]), "longitude": coordinate(region, ["lng", "lon", "longitude"]), "year": integer(region, "year", current_time.year), "month": integer(region, "month", current_time.month)}], columns=FEATURES)
    prediction = str(model.predict(row)[0])
    probabilities = model.predict_proba(row)[0] if hasattr(model, "predict_proba") else []
    classes = model.classes_ if hasattr(model, "classes_") else []
    confidence = float(max(probabilities)) if len(probabilities) else 0.0
    probability_map = {str(label): round(float(value), 4) for label, value in zip(classes, probabilities)}
    score_map = {"low": 20, "medium": 45, "high": 70, "critical": 90}
    historical_score = round(sum(float(probability_map.get(name, 0.0)) * score for name, score in score_map.items()), 2)
    components = [("hazard_intensity", signal["intensity"], 0.20, signal["source"]), ("hazard_probability", signal["probability"], 0.15, signal["source"]), ("exposure", signal["exposure"], 0.10, "current-intelligence"), ("vulnerability", signal["vulnerability"], 0.10, "current-intelligence"), ("historical_risk", historical_score, 0.45, "trained-model")]
    final_score = round(sum(value * weight for _, value, weight, _ in components), 2)
    risk_level = level(final_score)
    factors = [{"name": name, "value": round(value, 2), "weight": weight, "contribution": round(value * weight, 2), "source": source} for name, value, weight, source in components]
    return {"riskScore": final_score, "riskLevel": risk_level, "confidence": round(confidence, 4), "probabilities": probability_map, "historicalPrediction": prediction, "historicalScore": historical_score, "factors": factors, "currentSignal": signal, "liveHazard": live, "recommendedActions": action_for(risk_level, signal["type"]), "method": "hybrid-ml-risk-engine"}

@app.get("/health")
def health():
    return {"status": "ok", "service": "risk-intelligence", "modelLoaded": model is not None, "modelPath": str(MODEL_PATH), "features": FEATURES, "liveSources": ["USGS earthquake feed"]}

@app.get("/model-info")
def model_info():
    evaluation = {}
    if EVALUATION_PATH.exists():
        try:
            evaluation = json.loads(EVALUATION_PATH.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            evaluation = {}
    return {"modelLoaded": model is not None, "features": FEATURES, "target": "severity_class", "evaluation": evaluation, "liveSources": ["USGS earthquake feed"], "engine": "hybrid-ml-risk-engine"}

@app.post("/analyze-risk")
def analyze_risk(data: RiskRequest):
    if model is not None:
        return trained_prediction(data)
    return baseline_prediction(data)
