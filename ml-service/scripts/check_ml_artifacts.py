from pathlib import Path
import json
import joblib
import sys

BASE_DIR = Path(__file__).resolve().parents[1]
MODEL_PATH = BASE_DIR / "models" / "disaster_severity_model.joblib"
EVALUATION_PATH = BASE_DIR / "models" / "evaluation.json"
VALIDATION_PATH = BASE_DIR / "data" / "processed" / "dataset_validation.json"
FEATURES = ["disaster_type", "latitude", "longitude", "year", "month"]


def main():
    missing = [str(path.relative_to(BASE_DIR)) for path in [MODEL_PATH, EVALUATION_PATH, VALIDATION_PATH] if not path.exists()]
    if missing:
        print("Missing ML artifacts:")
        print("\n".join(missing))
        sys.exit(1)
    evaluation = json.loads(EVALUATION_PATH.read_text(encoding="utf-8"))
    validation = json.loads(VALIDATION_PATH.read_text(encoding="utf-8"))
    model = joblib.load(MODEL_PATH)
    if not validation.get("ready_for_training", False):
        raise ValueError("Dataset validation is not marked ready for training.")
    if evaluation.get("selected_model") not in {"logistic_regression", "random_forest"}:
        raise ValueError("Unknown selected model.")
    if evaluation.get("features") != FEATURES:
        raise ValueError("Training feature schema does not match production schema.")
    if not hasattr(model, "predict"):
        raise ValueError("Persisted model does not expose predict().")
    print(f"Artifacts ready: {evaluation['selected_model']}")


if __name__ == "__main__":
    main()
