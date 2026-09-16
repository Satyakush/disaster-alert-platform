# Disaster Risk ML Service

This service contains the disaster-risk prediction API and the reproducible supervised-learning pipeline.

## Architecture

React dashboard → Node.js risk controller → FastAPI → trained scikit-learn pipeline

If a trained model artifact is unavailable, FastAPI falls back to the deterministic weighted-risk model so the application remains usable during development.

## ML workflow

```text
Permitted EM-DAT export
        ↓
prepare_emdat.py
        ↓
disaster_training.csv
        ↓
validate_dataset.py
        ↓
train_model.py
        ↓
Model evaluation + joblib artifact
        ↓
smoke_test.py
        ↓
FastAPI inference
```

Run the complete local workflow with:

```bash
python scripts/run_pipeline.py
```

The workflow requires a permitted EM-DAT CSV/XLSX export in `ml-service/data/raw/`.

## Dataset strategy

The primary supervised-learning source is EM-DAT, the international disaster database maintained by the Centre for Research on the Epidemiology of Disasters (CRED). EM-DAT access and redistribution conditions must be respected; raw data is intentionally excluded from the repository.

A separate USGS earthquake acquisition script is available at `scripts/fetch_usgs_earthquakes.py`. It stores earthquake observations locally for future hazard-specific modeling. USGS data is not automatically mixed into the EM-DAT training set because the target definition and temporal/geospatial join must be established first.

## Target definition

The first supervised task predicts a historical disaster severity class: `low`, `medium`, `high`, or `critical`.

The severity label is derived from historical impact variables such as deaths, affected population, and economic damage. Those outcome variables are excluded from model features to prevent direct target leakage.

## Current model features

The current training and inference schema is intentionally aligned:

- disaster type
- latitude
- longitude
- event year
- event month

Categorical data is one-hot encoded. Numerical data uses median imputation and standardization. Logistic Regression and Random Forest are evaluated using a stratified train/test split plus stratified cross-validation, with weighted F1 used for model comparison.

Event impact fields such as deaths, affected population, damage, and duration are retained in the prepared dataset for validation and label construction but are not used as prediction features.

## Model persistence

The selected preprocessing-and-model pipeline is saved as `models/disaster_severity_model.joblib`. Evaluation metadata is written to `models/evaluation.json`. Generated datasets, model binaries, and evaluation artifacts are excluded from Git.

## Runtime behavior

FastAPI loads the trained artifact when it exists. The `/analyze-risk` endpoint returns the predicted severity, class probabilities when supported, confidence, risk score, recommended actions, and model method. Without a trained artifact, the endpoint uses the weighted-risk baseline.

## Model smoke test

After training, `smoke_test.py` loads the persisted pipeline and sends a representative inference row through the exact saved preprocessing/model chain. It verifies that the output is a supported severity class and that returned probabilities are valid when available.

## Interview explanation

The ML integration extends an existing deterministic risk baseline with a reproducible supervised-learning pipeline. Historical disaster data is cleaned and normalized, an impact-based severity target is defined, outcome variables are excluded from prediction features, the dataset is validated, mixed data types are preprocessed inside a single scikit-learn pipeline, multiple classifiers are compared with stratified validation, the selected pipeline is persisted with joblib, and FastAPI exposes the artifact through the existing risk-analysis boundary.
