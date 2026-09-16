from pathlib import Path
import json
import pandas as pd

BASE_DIR = Path(__file__).resolve().parents[1]
PROCESSED_DIR = BASE_DIR / "data" / "processed"
INPUT_PATH = PROCESSED_DIR / "disaster_training.csv"
OUTPUT_PATH = PROCESSED_DIR / "dataset_validation.json"

REQUIRED_COLUMNS = [
    "disaster_type",
    "country",
    "region",
    "year",
    "month",
    "duration_days",
    "deaths",
    "affected",
    "damage_usd",
    "severity_class",
]


def main():
    if not INPUT_PATH.exists():
        raise FileNotFoundError("Run prepare_emdat.py first.")

    frame = pd.read_csv(INPUT_PATH)
    missing_columns = [column for column in REQUIRED_COLUMNS if column not in frame.columns]
    if missing_columns:
        raise ValueError(f"Missing required columns: {missing_columns}")

    duplicate_rows = int(frame.duplicated().sum())
    invalid_months = int((~frame["month"].between(1, 12)).sum())
    invalid_years = int((~frame["year"].between(1900, pd.Timestamp.utcnow().year + 1)).sum())
    negative_duration = int((frame["duration_days"] < 0).sum())
    negative_deaths = int((frame["deaths"] < 0).sum())
    negative_affected = int((frame["affected"] < 0).sum())
    negative_damage = int((frame["damage_usd"] < 0).sum())
    missingness = frame[REQUIRED_COLUMNS].isna().mean().round(4).to_dict()
    class_distribution = frame["severity_class"].value_counts(dropna=False).to_dict()

    summary = {
        "rows": len(frame),
        "columns": list(frame.columns),
        "duplicate_rows": duplicate_rows,
        "invalid_months": invalid_months,
        "invalid_years": invalid_years,
        "negative_duration": negative_duration,
        "negative_deaths": negative_deaths,
        "negative_affected": negative_affected,
        "negative_damage": negative_damage,
        "missingness": missingness,
        "class_distribution": class_distribution,
        "ready_for_training": all(value == 0 for value in [
            invalid_months,
            invalid_years,
            negative_duration,
            negative_deaths,
            negative_affected,
            negative_damage,
        ]) and len(frame) > 0,
    }

    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(summary, indent=2, default=str), encoding="utf-8")
    print(json.dumps(summary, indent=2, default=str))


if __name__ == "__main__":
    main()
