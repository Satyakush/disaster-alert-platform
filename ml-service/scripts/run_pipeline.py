from pathlib import Path
import subprocess
import sys

BASE_DIR = Path(__file__).resolve().parents[1]
SCRIPTS_DIR = BASE_DIR / "scripts"
RAW_DIR = BASE_DIR / "data" / "raw"
STEPS = ["prepare_emdat.py", "validate_dataset.py", "train_model.py", "smoke_test.py"]

def run_step(filename):
    print(f"Running {filename}...")
    result = subprocess.run([sys.executable, str(SCRIPTS_DIR / filename)], cwd=BASE_DIR)
    if result.returncode != 0:
        raise SystemExit(result.returncode)

def main():
    inputs = [path for path in RAW_DIR.iterdir() if path.is_file() and path.name != ".gitkeep" and "usgs" not in path.name.lower()] if RAW_DIR.exists() else []
    if not inputs:
        raise FileNotFoundError("No permitted EM-DAT export found in ml-service/data/raw.")
    run_step("prepare_emdat.py")
    run_step("validate_dataset.py")
    validation_path = BASE_DIR / "data" / "processed" / "dataset_validation.json"
    if not validation_path.exists():
        raise FileNotFoundError("Dataset validation report was not created.")
    import json
    validation = json.loads(validation_path.read_text(encoding="utf-8"))
    if not validation.get("ready_for_training"):
        raise ValueError("Dataset validation failed. Review data/processed/dataset_validation.json before training.")
    run_step("train_model.py")
    run_step("smoke_test.py")
    print("ML pipeline completed successfully.")

if __name__ == "__main__":
    main()
