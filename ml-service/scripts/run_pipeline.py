from pathlib import Path
import subprocess
import sys

BASE_DIR = Path(__file__).resolve().parents[1]
SCRIPTS_DIR = BASE_DIR / "scripts"

STEPS = [
    "prepare_emdat.py",
    "validate_dataset.py",
    "train_model.py",
]


def main():
    for filename in STEPS:
        print(f"Running {filename}...")
        result = subprocess.run([sys.executable, str(SCRIPTS_DIR / filename)], cwd=BASE_DIR)
        if result.returncode != 0:
            raise SystemExit(result.returncode)
    print("ML pipeline completed successfully.")


if __name__ == "__main__":
    main()
