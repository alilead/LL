from typing import List, Dict, Any, Optional
import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator
from lightgbm import LGBMClassifier
from category_encoders import TargetEncoder
from feature_engine.encoding import RareLabelEncoder
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
import joblib
from app.core.config import settings
from app.ml.features import (
    extract_features,
    preprocess_features,
    create_feature_importance
)

class LeadScoringModel:
    def __init__(self):
        self.model: Optional[Pipeline] = None
        self.feature_names: List[str] = []
        self.target_encoder: Optional[TargetEncoder] = None
        self.rare_encoder: Optional[RareLabelEncoder] = None
        self.scaler: Optional[StandardScaler] = None
        
    def create_pipeline(self) -> Pipeline:
        """ML pipeline oluştur"""
        return Pipeline([
            ('rare_encoder', RareLabelEncoder(tol=0.05, n_categories=1)),
            ('target_encoder', TargetEncoder()),
            ('scaler', StandardScaler()),
            ('classifier', LGBMClassifier(
                n_estimators=100,
                learning_rate=0.1,
                max_depth=5,
                num_leaves=31,
                random_state=42
            ))
        ])
    
    def train(self, X: pd.DataFrame, y: pd.Series) -> None:
        """Modeli eğit"""
        self.feature_names = X.columns.tolist()
        self.model = self.create_pipeline()
        self.model.fit(X, y)
        
    def predict(self, features: Dict[str, Any]) -> Dict[str, Any]:
        """Tahmin yap"""
        if not self.model:
            raise ValueError("Model henüz eğitilmemiş!")
            
        # Feature'ları hazırla
        X = pd.DataFrame([features])
        X = X[self.feature_names]
        
        # Tahmin yap
        proba = self.model.predict_proba(X)[0]
        prediction = self.model.predict(X)[0]
        
        return {
            "prediction": int(prediction),
            "probability": float(proba.max()),
            "confidence": float(proba.max()),
            "feature_importance": create_feature_importance(
                self.model, self.feature_names
            )
        }
    
    def save(self, path: str) -> None:
        """Modeli kaydet"""
        if not self.model:
            raise ValueError("Model henüz eğitilmemiş!")
        joblib.dump(self.model, path)
    
    def load(self, path: str) -> None:
        """Modeli yükle"""
        self.model = joblib.load(path)

class LeadQualityModel(LeadScoringModel):
    """Custom model for lead quality"""
    def create_pipeline(self) -> Pipeline:
        return Pipeline([
            ('rare_encoder', RareLabelEncoder(tol=0.03, n_categories=1)),
            ('target_encoder', TargetEncoder()),
            ('scaler', StandardScaler()),
            ('classifier', LGBMClassifier(
                n_estimators=200,
                learning_rate=0.05,
                max_depth=7,
                num_leaves=63,
                random_state=42
            ))
        ])

class LeadPriorityModel(LeadScoringModel):
    """Custom model for lead prioritization"""
    def create_pipeline(self) -> Pipeline:
        return Pipeline([
            ('rare_encoder', RareLabelEncoder(tol=0.04, n_categories=1)),
            ('target_encoder', TargetEncoder()),
            ('scaler', StandardScaler()),
            ('classifier', LGBMClassifier(
                n_estimators=150,
                learning_rate=0.08,
                max_depth=6,
                num_leaves=47,
                random_state=42
            ))
        ])
