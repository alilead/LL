import os
import json
import joblib
import numpy as np
import pandas as pd
from typing import Dict, List, Optional
from datetime import datetime
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
from app.core.config import settings
from app.utils.logger import logger

class PersonalityPredictor:
    def __init__(self):
        self.model_path = "/home/httpdvic1/backend/app/ml/models"
        self.model_version = "v1.0"
        self.model = None
        self.label_encoders = {}
        self.feature_columns = [
            'sector', 'job_title', 'location',
            'linkedin_connections', 'email_type',
            'mobile_type', 'telephone_type'
        ]
        self.target_columns = [
            'personality_type', 'communication_style',
            'decision_making', 'leadership_style'
        ]
        self.load_model()
        
    def load_model(self):
        """Model ve label encoder'ları yükle"""
        try:
            model_file = os.path.join(self.model_path, f"personality_model_{self.model_version}.joblib")
            encoders_file = os.path.join(self.model_path, f"label_encoders_{self.model_version}.joblib")
            
            self.model = joblib.load(model_file)
            self.label_encoders = joblib.load(encoders_file)
            
            logger.info(f"Model loaded: {model_file}")
        except Exception as e:
            logger.error(f"Error loading model: {str(e)}")
            raise
            
    def save_model(self):
        """Model ve label encoder'ları kaydet"""
        try:
            os.makedirs(self.model_path, exist_ok=True)
            
            model_file = os.path.join(self.model_path, f"personality_model_{self.model_version}.joblib")
            encoders_file = os.path.join(self.model_path, f"label_encoders_{self.model_version}.joblib")
            
            joblib.dump(self.model, model_file)
            joblib.dump(self.label_encoders, encoders_file)
            
            logger.info(f"Model saved: {model_file}")
        except Exception as e:
            logger.error(f"Error saving model: {str(e)}")
            raise
            
    def preprocess_data(self, data: Dict) -> np.ndarray:
        """Veriyi model için hazırla"""
        try:
            # Eksik değerleri doldur
            for col in self.feature_columns:
                if col not in data or not data[col]:
                    if col in ['linkedin_connections']:
                        data[col] = 0
                    else:
                        data[col] = 'unknown'
                        
            # Kategorik değişkenleri encode et
            encoded_data = []
            for col in self.feature_columns:
                if col not in self.label_encoders:
                    self.label_encoders[col] = LabelEncoder()
                    
                if col == 'linkedin_connections':
                    encoded_data.append(data[col])
                else:
                    value = str(data[col]).lower()
                    if value not in self.label_encoders[col].classes_:
                        self.label_encoders[col].classes_ = np.append(
                            self.label_encoders[col].classes_, value
                        )
                    encoded_value = self.label_encoders[col].transform([value])[0]
                    encoded_data.append(encoded_value)
                    
            return np.array(encoded_data).reshape(1, -1)
            
        except Exception as e:
            logger.error(f"Error preprocessing data: {str(e)}")
            raise
            
    def predict(self, data: Dict) -> Dict:
        """Make personality prediction"""
        try:
            # Prepare data
            X = self.preprocess_data(data)
            
            # Make prediction
            predictions = self.model.predict(X)
            probabilities = self.model.predict_proba(X)
            
            # Sonuçları decode et
            results = {}
            for i, col in enumerate(self.target_columns):
                prediction = predictions[0][i]
                probs = probabilities[i][0]
                
                # Label'ı geri çevir
                if col in self.label_encoders:
                    prediction = self.label_encoders[col].inverse_transform([prediction])[0]
                    
                results[col] = {
                    'prediction': prediction,
                    'probability': float(max(probs)),
                    'alternatives': [
                        {
                            'value': self.label_encoders[col].inverse_transform([j])[0],
                            'probability': float(p)
                        }
                        for j, p in enumerate(probs)
                        if p > 0.1  # Sadece olasılığı %10'dan yüksek olanlar
                    ]
                }
                
            # Ek özellikler ekle
            results.update(self._generate_additional_insights(results))
            
            return results
            
        except Exception as e:
            logger.error(f"Error making prediction: {str(e)}")
            raise
            
    def batch_predict(self, data_list: List[Dict]) -> List[Dict]:
        """Make batch predictions"""
        return [self.predict(data) for data in data_list]
        
    def train(self, X_train: np.ndarray, y_train: np.ndarray) -> Dict:
        """Model'i eğit"""
        try:
            start_time = datetime.now()
            
            # Model'i eğit
            self.model = RandomForestClassifier(
                n_estimators=100,
                max_depth=10,
                random_state=42
            )
            self.model.fit(X_train, y_train)
            
            # Eğitim metriklerini hesapla
            y_pred = self.model.predict(X_train)
            metrics = {
                'accuracy': accuracy_score(y_train, y_pred),
                'precision': precision_score(y_train, y_pred, average='weighted'),
                'recall': recall_score(y_train, y_pred, average='weighted'),
                'f1': f1_score(y_train, y_pred, average='weighted')
            }
            
            # Model'i kaydet
            self.save_model()
            
            training_time = (datetime.now() - start_time).total_seconds()
            
            return {
                'status': 'success',
                'metrics': metrics,
                'training_time': training_time,
                'model_version': self.model_version
            }
            
        except Exception as e:
            logger.error(f"Error training model: {str(e)}")
            raise
            
    def get_performance_metrics(self, X_test: np.ndarray, y_test: np.ndarray) -> Dict:
        """Model performans metriklerini hesapla"""
        try:
            y_pred = self.model.predict(X_test)
            
            metrics = {
                'accuracy': accuracy_score(y_test, y_pred),
                'precision': precision_score(y_test, y_pred, average='weighted'),
                'recall': recall_score(y_test, y_pred, average='weighted'),
                'f1': f1_score(y_test, y_pred, average='weighted'),
                'confusion_matrix': confusion_matrix(y_test, y_pred).tolist()
            }
            
            return metrics
            
        except Exception as e:
            logger.error(f"Error calculating performance metrics: {str(e)}")
            raise
            
    def _generate_additional_insights(self, predictions: Dict) -> Dict:
        """Tahminlere dayalı ek özellikler üret"""
        insights = {}
        
                    # Strengths based on personality type
        personality_strengths = {
            'ISTJ': ['Organize', 'Güvenilir', 'Mantıklı'],
            'ISFJ': ['Yardımsever', 'Detaycı', 'Sadık'],
            'INFJ': ['İçgörülü', 'İdealist', 'Yaratıcı'],
            'INTJ': ['Stratejik', 'Bağımsız', 'Yenilikçi'],
            'ISTP': ['Esnek', 'Pratik', 'Problem çözücü'],
            'ISFP': ['Sanatsal', 'Esnek', 'Uyumlu'],
            'INFP': ['İdealist', 'Empatik', 'Yaratıcı'],
            'INTP': ['Mantıklı', 'Teorik', 'Yenilikçi'],
            'ESTP': ['Enerjik', 'Girişken', 'Pratik'],
            'ESFP': ['Sosyal', 'Spontane', 'Eğlenceli'],
            'ENFP': ['Hevesli', 'Yaratıcı', 'İlham verici'],
            'ENTP': ['Yenilikçi', 'Girişimci', 'Adaptif'],
            'ESTJ': ['Organize', 'Lider', 'Pratik'],
            'ESFJ': ['Yardımsever', 'Sosyal', 'Organize'],
            'ENFJ': ['Karizmatik', 'İdealist', 'Lider'],
            'ENTJ': ['Lider', 'Stratejik', 'Kararlı']
        }
        
        personality_type = predictions['personality_type']['prediction']
        if personality_type in personality_strengths:
            insights['strengths'] = personality_strengths[personality_type]
            
        # Zorluklar ve öneriler
        insights['challenges'] = self._get_challenges(predictions)
        insights['recommendations'] = self._get_recommendations(predictions)
        
        return insights
        
    def _get_challenges(self, predictions: Dict) -> List[str]:
        """Kişilik tipine göre olası zorlukları belirle"""
        personality_type = predictions['personality_type']['prediction']
        leadership_style = predictions['leadership_style']['prediction']
        
        challenges = []
        
        # Kişilik tipine göre zorluklar
        if personality_type.startswith('I'):  # Introvert
            challenges.append('Networking ve sosyal etkileşimlerde zorlanabilir')
        if personality_type.endswith('J'):  # Judging
            challenges.append('Beklenmedik değişimlere adaptasyonda zorlanabilir')
            
        # Liderlik stiline göre zorluklar
        if leadership_style == 'Authoritative':
            challenges.append('Takım üyeleriyle empati kurmada zorlanabilir')
        elif leadership_style == 'Democratic':
            challenges.append('Hızlı karar almada zorlanabilir')
            
        return challenges
        
    def _get_recommendations(self, predictions: Dict) -> List[str]:
        """Kişilik tipine göre öneriler oluştur"""
        personality_type = predictions['personality_type']['prediction']
        communication_style = predictions['communication_style']['prediction']
        
        recommendations = []
        
        # İletişim stiline göre öneriler
        if communication_style == 'Direct':
            recommendations.append('Daha empatik bir iletişim tarzı geliştirin')
        elif communication_style == 'Indirect':
            recommendations.append('Daha net ve doğrudan iletişim kurun')
            
        # Kişilik tipine göre öneriler
        if personality_type.startswith('I'):  # Introvert
            recommendations.append('Küçük gruplarla networking yapın')
        if personality_type.endswith('P'):  # Perceiving
            recommendations.append('Daha planlı ve organize çalışın')
            
        return recommendations
