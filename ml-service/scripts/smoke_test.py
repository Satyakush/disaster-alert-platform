from pathlib import Path
import joblib
import pandas as pd

BASE_DIR = Path(__file__).resolve().parents[1]
MODEL_PATH = BASE_DIR / "models" / "disaster_severity_model.joblib"
FEATURES = ["disaster_type", "latitude", "longitude", "year", "month"]


def main():
    if not MODEL_PATH.exists():
        raise FileNotFoundError("Trained model artifact not found. Run run_pipeline.py first.")
    model = joblib.load(MODEL_PATH)
    sample = pd.DataFrame([{
        "disaster_type": "flood",
        "latitude": 22.7,
        "longitude": 75.9,
        "year": pd.Timestamp.utcnow().year,
        "month": pd.Timestamp.utcnow().month,
    }], columns=FEATURES)
    prediction = str(model.predict(sample)[0])
    probabilities = model.predict_proba(sample)[0] if hasattr(model, "predict_proba") else []
    if prediction not in {"low", "medium", "high", "critical"}:
        raise ValueError(f"Unexpected model output: {prediction}")
    if len(probabilities) and abs(float(sum(probabilities)) - 1.0) > 0.001:
        raise ValueError("Model probabilities do not sum to one.")
    print(f"Smoke test passed: prediction={prediction}")


if __name__ == "__main__":
    main()
