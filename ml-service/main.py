from fastapi import FastAPI
from pydantic import BaseModel
from typing import Dict, Any
import random

app = FastAPI()

class RiskRequest(BaseModel):
    region: Dict[str, Any]   # GeoJSON or map-drawn region
    meta: Dict[str, Any] | None = None

@app.post("/analyze-risk")
def analyze_risk(data: RiskRequest):
    # TEMP LOGIC (will be replaced by ML model)
    risk_levels = ["low", "medium", "high"]

    risk = random.choices(
        risk_levels,
        weights=[0.4, 0.35, 0.25],
        k=1
    )[0]

    return {
        "riskLevel": risk,
        "confidence": round(random.uniform(0.7, 0.95), 2),
        "factors": [
            "historical_disasters",
            "population_density",
            "terrain_vulnerability"
        ]
    }
