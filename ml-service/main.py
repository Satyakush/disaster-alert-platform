from fastapi import FastAPI
from pydantic import BaseModel, Field
from typing import Any, Dict

app = FastAPI(title="Disaster Risk Intelligence Service", version="1.0.0")


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


@app.get("/health")
def health():
    return {"status": "ok", "service": "risk-intelligence"}


@app.post("/analyze-risk")
def analyze_risk(data: RiskRequest):
    hazard = data.hazard
    region = data.region

    hazard_intensity = number(hazard, "intensity", number(region, "hazardIntensity"))
    hazard_probability = number(hazard, "probability", number(region, "hazardProbability"))
    exposure = number(region, "exposure", number(region, "populationDensity"))
    vulnerability = number(region, "vulnerability", number(region, "terrainVulnerability"))
    historical = number(region, "historicalRisk", number(region, "historicalDisasters"))

    components = [
        ("hazard_intensity", hazard_intensity, 0.30),
        ("hazard_probability", hazard_probability, 0.20),
        ("exposure", exposure, 0.20),
        ("vulnerability", vulnerability, 0.20),
        ("historical_risk", historical, 0.10),
    ]

    score = round(sum(value * weight for _, value, weight in components), 2)
    risk_level = level(score)

    supplied = sum(
        1 for value in [
            hazard.get("intensity"),
            hazard.get("probability"),
            region.get("exposure"),
            region.get("vulnerability"),
            region.get("historicalRisk"),
        ] if value is not None
    )
    confidence = round(0.55 + (supplied / 5) * 0.4, 2)

    factors = [
        {
            "name": name,
            "value": round(value, 2),
            "weight": weight,
            "contribution": round(value * weight, 2),
        }
        for name, value, weight in components
    ]

    hazard_type = str(hazard.get("type", "other")).lower()

    return {
        "riskScore": score,
        "riskLevel": risk_level,
        "confidence": confidence,
        "factors": factors,
        "recommendedActions": action_for(risk_level, hazard_type),
        "method": "weighted-risk-model-v1",
    }
