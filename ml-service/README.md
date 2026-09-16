# Disaster Risk ML Service

This service contains the disaster-risk prediction API and the reproducible training pipeline.

## Current architecture

React dashboard → Node.js risk controller → FastAPI → trained scikit-learn model

If a trained model artifact is not available, the API falls back to the existing weighted risk model so the application remains usable during development.

## Dataset strategy

The training pipeline is designed around public historical disaster records. The primary source is EM-DAT, the international disaster database maintained by the Centre for Research on the Epidemiology of Disasters (CRED). EM-DAT access and redistribution conditions must be respected; the raw dataset is intentionally not committed to this repository.

Potential auxiliary sources for later feature enrichment include USGS earthquake data, NOAA IBTrACS tropical-cyclone data, and NASA/SEDAC geospatial disaster datasets. These sources are treated as feature-enrichment candidates rather than being mixed into the first model without a defined join strategy.

## Target definition

The first supervised model predicts a historical disaster severity class. Impact variables used to construct the label must not be used as prediction features, because doing so would leak the outcome into the model.

## Reproducible workflow

1. Obtain the permitted EM-DAT export and place it under `ml-service/data/raw/`.
2. Run the preparation script to create a clean training table.
3. Run the training script to split data, train candidate models, evaluate them, and save the selected pipeline.
4. The FastAPI service loads the saved artifact when present.
5. The dashboard sends current hazard and exposure features to the service for inference.

Raw datasets, generated processed datasets, model binaries, and evaluation artifacts are excluded from Git where appropriate.

## Interview explanation

The important distinction is between the application integration and the trained model. The FastAPI service was integrated first with a deterministic weighted-risk baseline. The supervised ML phase adds a real dataset, explicit target definition, preprocessing, train/test evaluation, model persistence, and inference through the same API boundary.
