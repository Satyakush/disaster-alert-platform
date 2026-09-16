from pathlib import Path
import json
import requests
import pandas as pd

BASE_DIR = Path(__file__).resolve().parents[1]
RAW_DIR = BASE_DIR / "data" / "raw"
OUTPUT_PATH = RAW_DIR / "usgs_earthquakes.csv"
API_URL = "https://earthquake.usgs.gov/fdsnws/event/1/query"

def main():
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    params = {
        "format": "geojson",
        "starttime": "2000-01-01",
        "endtime": pd.Timestamp.utcnow().strftime("%Y-%m-%dT%H:%M:%S"),
        "minmagnitude": 4.5,
        "limit": 20000,
        "orderby": "time-asc",
    }
    response = requests.get(API_URL, params=params, timeout=60)
    response.raise_for_status()
    payload = response.json()
    rows = []
    for feature in payload.get("features", []):
        properties = feature.get("properties") or {}
        geometry = feature.get("geometry") or {}
        coordinates = geometry.get("coordinates") or []
        if len(coordinates) < 2:
            continue
        rows.append({
            "event_id": feature.get("id"),
            "time": properties.get("time"),
            "updated": properties.get("updated"),
            "magnitude": properties.get("mag"),
            "place": properties.get("place"),
            "felt": properties.get("felt"),
            "cdi": properties.get("cdi"),
            "mmi": properties.get("mmi"),
            "alert": properties.get("alert"),
            "tsunami": properties.get("tsunami"),
            "status": properties.get("status"),
            "longitude": coordinates[0],
            "latitude": coordinates[1],
            "depth_km": coordinates[2] if len(coordinates) > 2 else None,
        })
    frame = pd.DataFrame(rows)
    if frame.empty:
        raise RuntimeError("USGS returned no earthquake events for the requested range.")
    frame["time"] = pd.to_datetime(frame["time"], unit="ms", utc=True, errors="coerce")
    frame["updated"] = pd.to_datetime(frame["updated"], unit="ms", utc=True, errors="coerce")
    frame["year"] = frame["time"].dt.year
    frame["month"] = frame["time"].dt.month
    frame["day_of_year"] = frame["time"].dt.dayofyear
    frame["alert"] = frame["alert"].fillna("none")
    frame["tsunami"] = frame["tsunami"].fillna(0).astype(int)
    frame.to_csv(OUTPUT_PATH, index=False)
    metadata = {"source": "USGS Earthquake Catalog", "endpoint": API_URL, "starttime": params["starttime"], "endtime": params["endtime"], "minmagnitude": params["minmagnitude"], "rows": len(frame), "output": str(OUTPUT_PATH.relative_to(BASE_DIR))}
    (RAW_DIR / "usgs_earthquakes_metadata.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    print(json.dumps(metadata, indent=2))

if __name__ == "__main__":
    main()
