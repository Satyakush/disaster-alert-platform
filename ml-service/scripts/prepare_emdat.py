from pathlib import Path
import pandas as pd

BASE_DIR = Path(__file__).resolve().parents[1]
RAW_DIR = BASE_DIR / "data" / "raw"
PROCESSED_DIR = BASE_DIR / "data" / "processed"

OUTPUT_COLUMNS = [
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


def find_input():
    candidates = list(RAW_DIR.glob("*.csv")) + list(RAW_DIR.glob("*.xlsx")) + list(RAW_DIR.glob("*.xls"))
    candidates = [path for path in candidates if "usgs" not in path.name.lower()]
    if not candidates:
        raise FileNotFoundError("Place the permitted EM-DAT CSV/XLSX export in ml-service/data/raw before running this script.")
    return candidates[0]


def normalize_name(value):
    return "".join(character for character in str(value).lower() if character.isalnum())


def find_column(columns, aliases):
    normalized = {normalize_name(column): column for column in columns}
    for alias in aliases:
        if normalize_name(alias) in normalized:
            return normalized[normalize_name(alias)]
    return None


def numeric(frame, column):
    if not column:
        return pd.Series(float("nan"), index=frame.index)
    return pd.to_numeric(frame[column], errors="coerce")


def text(frame, column, default="unknown"):
    if not column:
        return pd.Series(default, index=frame.index, dtype="string")
    return frame[column].fillna(default).astype(str).replace({"nan": default, "NaN": default, "": default})


def severity_class(row):
    deaths = max(float(row["deaths"]), 0.0)
    affected = max(float(row["affected"]), 0.0)
    damage = max(float(row["damage_usd"]), 0.0)
    score = 0
    if deaths >= 1000:
        score += 3
    elif deaths >= 100:
        score += 2
    elif deaths >= 10:
        score += 1
    if affected >= 1000000:
        score += 3
    elif affected >= 100000:
        score += 2
    elif affected >= 10000:
        score += 1
    if damage >= 1_000_000_000:
        score += 3
    elif damage >= 100_000_000:
        score += 2
    elif damage >= 10_000_000:
        score += 1
    if score >= 6:
        return "critical"
    if score >= 4:
        return "high"
    if score >= 2:
        return "medium"
    return "low"


def main():
    input_path = find_input()
    if input_path.suffix.lower() in {".xlsx", ".xls"}:
        frame = pd.read_excel(input_path)
    else:
        frame = pd.read_csv(input_path, low_memory=False)

    disaster_type_column = find_column(frame.columns, ["Disaster Type", "Disaster Subgroup"])
    latitude_column = find_column(frame.columns, ["Latitude", "Lat"])
    longitude_column = find_column(frame.columns, ["Longitude", "Long", "Lon"])
    start_month_column = find_column(frame.columns, ["Start Month"])
    end_date_column = find_column(frame.columns, ["End Date"])
    start_date_column = find_column(frame.columns, ["Start Date"])
    deaths_column = find_column(frame.columns, ["Total Deaths", "Deaths"])
    affected_column = find_column(frame.columns, ["Total Affected", "Affected"])
    damage_column = find_column(frame.columns, ["Total Damage (000 US$)", "Total Damage"])

    prepared = pd.DataFrame(index=frame.index)
    prepared["disaster_type"] = text(frame, disaster_type_column).str.lower()
    prepared["latitude"] = numeric(frame, latitude_column)
    prepared["longitude"] = numeric(frame, longitude_column)
    prepared["month"] = numeric(frame, start_month_column)
    prepared["deaths"] = numeric(frame, deaths_column).fillna(0).clip(lower=0)
    prepared["affected"] = numeric(frame, affected_column).fillna(0).clip(lower=0)
    prepared["damage_usd"] = numeric(frame, damage_column).fillna(0).clip(lower=0) * 1000

    if start_date_column and end_date_column:
        start = pd.to_datetime(frame[start_date_column], errors="coerce")
        end = pd.to_datetime(frame[end_date_column], errors="coerce")
        prepared["duration_days"] = (end - start).dt.days.fillna(0).clip(lower=0)
    else:
        prepared["duration_days"] = 0

    prepared["severity_class"] = prepared.apply(severity_class, axis=1)
    prepared = prepared[OUTPUT_COLUMNS].dropna(subset=["disaster_type"])
    prepared = prepared[prepared["month"].between(1, 12) | prepared["month"].isna()].reset_index(drop=True)

    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    output_path = PROCESSED_DIR / "disaster_training.csv"
    prepared.to_csv(output_path, index=False)
    print(f"Prepared {len(prepared)} records: {output_path}")
    print(prepared["severity_class"].value_counts().to_string())


if __name__ == "__main__":
    main()
