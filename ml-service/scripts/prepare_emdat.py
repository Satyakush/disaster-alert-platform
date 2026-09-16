from pathlib import Path
import pandas as pd

BASE_DIR = Path(__file__).resolve().parents[1]
RAW_DIR = BASE_DIR / "data" / "raw"
PROCESSED_DIR = BASE_DIR / "data" / "processed"
OUTPUT_COLUMNS = ["disaster_type", "latitude", "longitude", "year", "month", "duration_days", "deaths", "affected", "damage_usd", "severity_class"]


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
    return next((normalized[normalize_name(alias)] for alias in aliases if normalize_name(alias) in normalized), None)


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
    score += 3 if deaths >= 1000 else 2 if deaths >= 100 else 1 if deaths >= 10 else 0
    score += 3 if affected >= 1000000 else 2 if affected >= 100000 else 1 if affected >= 10000 else 0
    score += 3 if damage >= 1_000_000_000 else 2 if damage >= 100_000_000 else 1 if damage >= 10_000_000 else 0
    return "critical" if score >= 6 else "high" if score >= 4 else "medium" if score >= 2 else "low"


def main():
    input_path = find_input()
    frame = pd.read_excel(input_path) if input_path.suffix.lower() in {".xlsx", ".xls"} else pd.read_csv(input_path, low_memory=False)
    disaster_type = find_column(frame.columns, ["Disaster Type", "Disaster Subgroup"])
    latitude = find_column(frame.columns, ["Latitude", "Lat"])
    longitude = find_column(frame.columns, ["Longitude", "Long", "Lon"])
    start_month = find_column(frame.columns, ["Start Month"])
    start_year = find_column(frame.columns, ["Start Year", "Year"])
    end_date = find_column(frame.columns, ["End Date"])
    start_date = find_column(frame.columns, ["Start Date"])
    deaths = find_column(frame.columns, ["Total Deaths", "Deaths"])
    affected = find_column(frame.columns, ["Total Affected", "Affected"])
    damage = find_column(frame.columns, ["Total Damage (000 US$)", "Total Damage"])
    prepared = pd.DataFrame(index=frame.index)
    prepared["disaster_type"] = text(frame, disaster_type).str.lower()
    prepared["latitude"] = numeric(frame, latitude)
    prepared["longitude"] = numeric(frame, longitude)
    prepared["year"] = numeric(frame, start_year)
    prepared["month"] = numeric(frame, start_month)
    prepared["deaths"] = numeric(frame, deaths).fillna(0).clip(lower=0)
    prepared["affected"] = numeric(frame, affected).fillna(0).clip(lower=0)
    prepared["damage_usd"] = numeric(frame, damage).fillna(0).clip(lower=0) * 1000
    if start_date and end_date:
        prepared["duration_days"] = (pd.to_datetime(frame[end_date], errors="coerce") - pd.to_datetime(frame[start_date], errors="coerce")).dt.days.fillna(0).clip(lower=0)
    else:
        prepared["duration_days"] = 0
    prepared["severity_class"] = prepared.apply(severity_class, axis=1)
    prepared = prepared[OUTPUT_COLUMNS].dropna(subset=["disaster_type"])
    prepared = prepared[(prepared["month"].between(1, 12) | prepared["month"].isna()) & (prepared["year"].between(1900, pd.Timestamp.utcnow().year + 1) | prepared["year"].isna())].reset_index(drop=True)
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    output_path = PROCESSED_DIR / "disaster_training.csv"
    prepared.to_csv(output_path, index=False)
    print(f"Prepared {len(prepared)} records: {output_path}")
    print(prepared["severity_class"].value_counts().to_string())


if __name__ == "__main__":
    main()
