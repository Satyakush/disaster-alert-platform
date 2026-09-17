# Disaster Risk ML Service

This service contains the disaster-risk prediction API and the reproducible supervised-learning pipeline.

## Architecture

React dashboard → Node.js risk controller → FastAPI → trained scikit-learn pipeline

The production risk engine combines the historical ML prediction with current application intelligence from active alerts, verified citizen reports, nearby shelters, infrastructure, and a live USGS earthquake signal for earthquake scenarios.

If a trained model artifact is unavailable, FastAPI falls back to the deterministic hybrid risk engine so the application remains usable during development.

## Complete workflow

```text
Permitted EM-DAT export
        ↓
prepare_emdat.py
        ↓
disaster_training.csv
        ↓
validate_dataset.py
        ↓
validation gate
        ↓
train_model.py
        ↓
model + evaluation.json
        ↓
smoke_test.py
        ↓
check_ml_artifacts.py
        ↓
FastAPI inference
        ↓
hybrid current intelligence
```

Run the complete local workflow with:

```bash
python scripts/run_pipeline.py
```

The workflow requires a permitted EM-DAT CSV/XLSX export in `ml-service/data/raw/`.

## Dataset strategy

The primary supervised-learning source is EM-DAT, the international disaster database maintained by the Centre for Research on the Epidemiology of Disasters (CRED). EM-DAT access and redistribution conditions must be respected; raw data is intentionally excluded from the repository.

A USGS earthquake acquisition script is available at `scripts/fetch_usgs_earthquakes.py` for reproducible historical collection. Production earthquake inference also queries the USGS event service near the selected region and uses the live signal when available. USGS observations are not mixed into the EM-DAT supervised training set because the target definition and temporal/geospatial join remain separate modeling concerns.

## Target definition

The first supervised task predicts a historical disaster severity class: `low`, `medium`, `high`, or `critical`.

The severity label is derived from historical impact variables such as deaths, affected population, and economic damage. Those outcome variables are excluded from model features to prevent direct target leakage.

## Current model features

The training and production inference schema is aligned:

- disaster type
- latitude
- longitude
- event year
- event month

Categorical data is one-hot encoded. Numerical data uses median imputation and standardization. Logistic Regression and Random Forest are evaluated using a stratified train/test split plus stratified cross-validation, with weighted F1 used for model comparison.

Event impact fields such as deaths, affected population, damage, and duration are retained in the prepared dataset for validation and label construction but are not used as prediction features.

## Current intelligence integration

Before every risk request, the client gathers geographically relevant application context using the selected risk radius:

- active and escalated alerts, including alert-radius overlap
- verified citizen reports
- nearby shelters and available capacity
- nearby infrastructure and operational status

The risk service derives exposure and vulnerability signals from this context. For earthquake scenarios it additionally queries the live USGS earthquake service near the selected coordinates and incorporates the strongest local signal when available.

The final trained-model score combines current hazard intensity, current hazard probability, current exposure, current vulnerability, and the historical ML risk estimate. The response includes factor values, sources, probabilities, confidence, historical prediction, live hazard metadata, and recommended actions.

## Validation and artifacts

`validate_dataset.py` checks schema, ranges, negative values, unexpected classes, missingness, and class distribution before training. `run_pipeline.py` stops before training when the validation report is not ready for training.

The selected preprocessing-and-model pipeline is saved as `models/disaster_severity_model.joblib`. Evaluation metadata is written to `models/evaluation.json`. `check_ml_artifacts.py` verifies the persisted artifact, evaluation metadata, validation state, production feature schema, and prediction interface.

Generated datasets, model binaries, and evaluation artifacts are excluded from Git.

## Runtime behavior

FastAPI loads the trained artifact when it exists. `/analyze-risk` returns predicted severity, class probabilities when supported, confidence, hybrid risk score, explainable factors, current intelligence, live hazard metadata, recommended actions, and model method. Without a trained artifact, the endpoint uses the hybrid deterministic fallback.

Operational endpoints:

- `GET /health` — service, model-loaded status, feature schema, and live-source status
- `GET /model-info` — model availability, target, feature schema, evaluation metadata, and engine information
- `POST /analyze-risk` — production hybrid risk inference

## Local setup

From `ml-service`:

```bash
python -m venv .venv
```

Windows:

```bash
.venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Place the permitted EM-DAT export in `data/raw/`, then run:

```bash
python scripts/run_pipeline.py
```

Start the API:

```bash
uvicorn main:app --reload --port 8000
```

The Node backend should use `ML_SERVICE_URL=http://localhost:8000`.

## Model smoke test

After training, `smoke_test.py` loads the persisted pipeline and sends a representative inference row through the exact saved preprocessing/model chain. It verifies that the output is a supported severity class and that probabilities are valid when available.

## Interview explanation

The ML integration extends an existing deterministic risk baseline with a reproducible supervised-learning pipeline. Historical disaster data is cleaned and normalized, an impact-based severity target is defined, outcome variables are excluded from prediction features, the dataset is validated before training, mixed data types are preprocessed inside a single scikit-learn pipeline, multiple classifiers are compared with stratified validation, the selected pipeline is persisted with joblib, artifacts are checked before use, and FastAPI exposes the trained model through the existing risk-analysis boundary.

At inference time, the system enriches the selected region with active alert overlap, verified reports, nearby shelter capacity, infrastructure status, and a live USGS earthquake signal when the selected hazard is an earthquake. These current signals are combined with the historical model probability to produce an explainable hybrid risk score and response guidance.

## Current integration boundary

React sends region and hazard information through the Node.js risk endpoint. The client enriches that request with nearby application intelligence. Node forwards the request to FastAPI. FastAPI converts the location into the exact five-feature model schema, performs historical prediction, combines it with current signals, and returns the complete risk result to Node and the client.

Actual model metrics depend on the permitted EM-DAT dataset available in the local environment and are not fabricated or hard-coded into the service.
