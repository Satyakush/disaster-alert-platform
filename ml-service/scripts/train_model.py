from pathlib import Path
import json
import joblib
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report, f1_score
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

BASE_DIR = Path(__file__).resolve().parents[1]
DATA_PATH = BASE_DIR / "data" / "processed" / "disaster_training.csv"
MODEL_DIR = BASE_DIR / "models"

FEATURES = ["disaster_type", "latitude", "longitude", "month", "duration_days"]
TARGET = "severity_class"
CATEGORICAL = ["disaster_type"]
NUMERICAL = ["latitude", "longitude", "month", "duration_days"]


def build_preprocessor():
    categorical_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("encoder", OneHotEncoder(handle_unknown="ignore")),
    ])
    numerical_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler()),
    ])
    return ColumnTransformer([
        ("categorical", categorical_pipeline, CATEGORICAL),
        ("numerical", numerical_pipeline, NUMERICAL),
    ])


def evaluate(name, pipeline, x_train, x_test, y_train, y_test):
    pipeline.fit(x_train, y_train)
    predictions = pipeline.predict(x_test)
    folds = min(5, int(y_train.value_counts().min()))
    if folds < 2:
        raise ValueError("Each class needs at least two training samples for cross-validation.")
    cross_validation = StratifiedKFold(n_splits=folds, shuffle=True, random_state=42)
    cv_scores = cross_val_score(pipeline, x_train, y_train, cv=cross_validation, scoring="f1_weighted", n_jobs=-1)
    return {
        "model": name,
        "accuracy": round(float(accuracy_score(y_test, predictions)), 4),
        "weighted_f1": round(float(f1_score(y_test, predictions, average="weighted")), 4),
        "cv_weighted_f1_mean": round(float(cv_scores.mean()), 4),
        "cv_weighted_f1_std": round(float(cv_scores.std()), 4),
        "report": classification_report(y_test, predictions, output_dict=True, zero_division=0),
        "pipeline": pipeline,
    }


def main():
    if not DATA_PATH.exists():
        raise FileNotFoundError("Run prepare_emdat.py first.")

    frame = pd.read_csv(DATA_PATH)
    frame = frame.dropna(subset=[TARGET])
    if frame.empty:
        raise ValueError("Training dataset is empty.")
    class_counts = frame[TARGET].value_counts()
    if len(class_counts) < 2:
        raise ValueError("At least two severity classes are required for classification.")
    if int(class_counts.min()) < 2:
        raise ValueError("Each severity class needs at least two samples.")

    x = frame[FEATURES]
    y = frame[TARGET]

    x_train, x_test, y_train, y_test = train_test_split(
        x,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y,
    )

    models = [
        (
            "logistic_regression",
            Pipeline([
                ("preprocessor", build_preprocessor()),
                ("model", LogisticRegression(max_iter=1000, class_weight="balanced")),
            ]),
        ),
        (
            "random_forest",
            Pipeline([
                ("preprocessor", build_preprocessor()),
                ("model", RandomForestClassifier(n_estimators=300, random_state=42, class_weight="balanced_subsample", n_jobs=-1)),
            ]),
        ),
    ]

    results = [evaluate(name, pipeline, x_train, x_test, y_train, y_test) for name, pipeline in models]
    selected = max(results, key=lambda item: (item["cv_weighted_f1_mean"], item["weighted_f1"]))

    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(selected["pipeline"], MODEL_DIR / "disaster_severity_model.joblib")

    summary = {
        "selected_model": selected["model"],
        "accuracy": selected["accuracy"],
        "weighted_f1": selected["weighted_f1"],
        "cv_weighted_f1_mean": selected["cv_weighted_f1_mean"],
        "cv_weighted_f1_std": selected["cv_weighted_f1_std"],
        "class_distribution": y.value_counts().to_dict(),
        "test_size": 0.2,
        "random_state": 42,
        "features": FEATURES,
        "target": TARGET,
        "all_models": [
            {
                "model": item["model"],
                "accuracy": item["accuracy"],
                "weighted_f1": item["weighted_f1"],
                "cv_weighted_f1_mean": item["cv_weighted_f1_mean"],
                "cv_weighted_f1_std": item["cv_weighted_f1_std"],
            }
            for item in results
        ],
    }
    (MODEL_DIR / "evaluation.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
