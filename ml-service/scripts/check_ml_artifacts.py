from pathlib import Path
import json
import sys

BASE_DIR = Path(__file__).resolve().parents[1]
MODEL_PATH = BASE_DIR / "models" / "disaster_severity_model.joblib"
EVALUATION_PATH = BASE_DIR / "models" / "evaluation.json"
VALIDATION_PATH = BASE_DIR / "data" / "processed" / "dataset_validation.json"


def main():
    missing = [str(path.relative_to(BASE_DIR)) for path in [MODEL_PATH, EVALUATION_PATH, VALIDATION_PATH] if not path.exists()]
    if missing:
        print("Missing ML artifacts:")
        print("\n".join(missing))
        sys.exit(1)
    evaluation = json.loads(EVALUATION_PATH.read_text(encoding="utf-8"))
    validation = json.loads(VALIDATION_PATH.read_text(encoding="utf-8"))
    if not validation.get("valid", False):
        raise ValueError("Dataset validation is not marked valid.")
    if evaluation.get("selected_model") not in {"logistic_regression", "random_forest"}:
        raise ValueError("Unknown selected model.")
    if evaluation.get("features") != ["disaster_type", "latitude", "longitude", "year", "month"]:
        raise ValueError("Training feature schema does not match production schema.")
    print(f"Artifacts ready: {evaluation['selected_model']}")


if __name__ == "__main__":
    main()
