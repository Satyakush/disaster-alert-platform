# Disaster Risk ML Service

This service contains the disaster-risk prediction API and the reproducible training pipeline.

## Architecture

React dashboard → Node.js risk controller → FastAPI → trained scikit-learn model

If a trained model artifact is not available, the API falls back to the deterministic weighted-risk model so the application remains usable during development.

## ML workflow

The complete local workflow is:

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
FastAPI inference
```

Run the complete pipeline with:

```bash
python scripts/run_pipeline.py
```

The pipeline requires a permitted EM-DAT CSV/XLSX export in `ml-service/data/raw/`.

## Dataset strategy

The primary supervised-learning source is EM-DAT, the international disaster database maintained by the Centre for Research on the Epidemiology of Disasters (CRED). EM-DAT access and redistribution conditions must be respected; raw data is intentionally excluded from the repository.

A separate USGS earthquake acquisition script is included at `scripts/fetch_usgs_earthquakes.py`. It uses the USGS FDSN Event Web Service and stores a local raw CSV for future earthquake-specific feature work. The USGS source is not mixed into the EM-DAT training set automatically because a valid temporal/geospatial join and target definition are required first.

Potential future enrichment sources include NOAA IBTrACS tropical-cyclone data and NASA/SEDAC geospatial disaster datasets. These should only be joined after defining a reproducible feature and label strategy.

## Target definition

The first supervised task predicts a historical disaster severity class: `low`, `medium`, `high`, or `critical`.

The severity label is derived from historical impact variables such as deaths, affected population, and economic damage. Those outcome variables are not used as model features, preventing direct target leakage.

## Current model features

The training pipeline uses features that can be supplied or derived at inference time:

- disaster type
- latitude
- longitude
- month
- event duration in days

Categorical data is one-hot encoded. Numerical data uses median imputation and standardization. Two candidate classifiers are evaluated: Logistic Regression and Random Forest. The selection metric is weighted F1, with stratified cross-validation used alongside the held-out test split.

## Model persistence

The selected preprocessing-and-model pipeline is saved as `models/disaster_severity_model.joblib`. Evaluation metadata is written to `models/evaluation.json`. Generated datasets, model binaries, and evaluation artifacts are excluded from Git.

## Runtime behavior

FastAPI loads the trained artifact when it exists. The `/analyze-risk` endpoint returns the predicted severity, class probabilities when supported, confidence, risk score, recommended actions, and the model method. Without a trained artifact, the endpoint uses the existing weighted-risk baseline.

## Interview explanation

The important distinction is between application integration and model training. The application already had a deterministic risk baseline. The ML phase adds a reproducible supervised-learning pipeline: obtain permitted historical data, clean and normalize it, define a non-leaking target, validate the dataset, preprocess mixed feature types, compare multiple classifiers, evaluate with stratified validation and weighted F1, persist the complete preprocessing/model pipeline, and expose the trained artifact through the existing FastAPI boundary.
