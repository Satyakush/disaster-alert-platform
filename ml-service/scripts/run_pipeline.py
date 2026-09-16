from pathlib import Path
import subprocess
import sys

BASE_DIR = Path(__file__).resolve().parents[1]
SCRIPTS_DIR = BASE_DIR / "scripts"
RAW_DIR = BASE_DIR / "data" / "raw"
STEPS = ["prepare_emdat.py", "validate_dataset.py", "train_model.py", "smoke_test.py"]

def main():
    inputs = [path for path in RAW_DIR.iterdir() if path.is_file() and path.name != ".gitkeep" and "usgs" not in path.name.lower()] if RAW_DIR.exists() else []
    if not inputs:
        raise FileNotFoundError("No permitted EM-DAT export found in ml-service/data/raw.")
    for filename in STEPS:
        print(f"Running {filename}...")
        result = subprocess.run([sys.executable, str(SCRIPTS_DIR / filename)], cwd=BASE_DIR)
        if result.returncode != 0:
            raise SystemExit(result.returncode)
    print("ML pipeline completed successfully.")

if __name__ == "__main__":
    main()
