from pathlib import Path
import json
import pandas as pd

BASE_DIR = Path(__file__).resolve().parents[1]
PROCESSED_DIR = BASE_DIR / "data" / "processed"
INPUT_PATH = PROCESSED_DIR / "disaster_training.csv"
OUTPUT_PATH = PROCESSED_DIR / "dataset_validation.json"

REQUIRED_COLUMNS = [
    "disaster_type",
    "latitude",
    "longitude",
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
    invalid_months = int((frame["month"].notna() & ~frame["month"].between(1, 12)).sum())
    negative_duration = int((frame["duration_days"] < 0).sum())
    negative_deaths = int((frame["deaths"] < 0).sum())
    negative_affected = int((frame["affected"] < 0).sum())
    negative_damage = int((frame["damage_usd"] < 0).sum())
    invalid_latitude = int((frame["latitude"].notna() & ~frame["latitude"].between(-90, 90)).sum())
    invalid_longitude = int((frame["longitude"].notna() & ~frame["longitude"].between(-180, 180)).sum())
    missingness = frame[REQUIRED_COLUMNS].isna().mean().round(4).to_dict()
    class_distribution = frame["severity_class"].value_counts(dropna=False).to_dict()
    valid_classes = {"low", "medium", "high", "critical"}
    unexpected_classes = sorted(set(frame["severity_class"].dropna().unique()).difference(valid_classes))

    summary = {
        "rows": len(frame),
        "columns": list(frame.columns),
        "duplicate_rows": duplicate_rows,
        "invalid_months": invalid_months,
        "invalid_latitude": invalid_latitude,
        "invalid_longitude": invalid_longitude,
        "negative_duration": negative_duration,
        "negative_deaths": negative_deaths,
        "negative_affected": negative_affected,
        "negative_damage": negative_damage,
        "unexpected_classes": unexpected_classes,
        "missingness": missingness,
        "class_distribution": class_distribution,
        "ready_for_training": len(frame) > 0 and not unexpected_classes and all(value == 0 for value in [
            invalid_months,
            invalid_latitude,
            invalid_longitude,
            negative_duration,
            negative_deaths,
            negative_affected,
            negative_damage,
        ]),
    }

    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(summary, indent=2, default=str), encoding="utf-8")
    print(json.dumps(summary, indent=2, default=str))


if __name__ == "__main__":
    main()
