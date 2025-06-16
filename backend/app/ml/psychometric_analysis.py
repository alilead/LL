from typing import Dict, List, Any
import pandas as pd
import numpy as np
from sklearn.preprocessing import MinMaxScaler
from app.core.config import settings

class PsychometricAnalyzer:
    """Class for analyzing Crystal Knows data"""
    
    # DISC profilleri ve özellikleri
    DISC_PROFILES = {
        'D': {
            'strengths': ['Liderlik', 'İnisiyatif', 'Hızlı karar alma'],
            'communication': ['Direkt', 'Sonuç odaklı', 'Kısa ve öz'],
            'motivation': ['Başarı', 'Kontrol', 'Rekabet'],
            'decision_making': ['Hızlı', 'Risk alabilen', 'Bağımsız']
        },
        'I': {
            'strengths': ['İletişim', 'İkna', 'Networking'],
            'communication': ['Enerjik', 'İyimser', 'Sosyal'],
            'motivation': ['Tanınma', 'Sosyal etkileşim', 'Pozitif geri bildirim'],
            'decision_making': ['Sezgisel', 'Duygusal', 'Spontane']
        },
        'S': {
            'strengths': ['Patience', 'Teamwork', 'Reliability'],
            'communication': ['Sakin', 'Destekleyici', 'İyi dinleyici'],
            'motivation': ['İstikrar', 'Uyum', 'İşbirliği'],
            'decision_making': ['Temkinli', 'Konsensüs arayan', 'Metodolojik']
        },
        'C': {
            'strengths': ['Analitik', 'Detaycı', 'Sistematik'],
            'communication': ['Mantıksal', 'Veri odaklı', 'Kesin'],
            'motivation': ['Accuracy', 'Quality', 'Expertise'],
            'decision_making': ['Analitik', 'Sistematik', 'Detaylı']
        }
    }
    
    # Sales approach recommendations
    SALES_APPROACHES = {
        'D': {
            'approach': 'Sonuç Odaklı Satış',
            'tips': [
                'Kısa ve öz sunumlar yapın',
                'ROI ve somut faydaları vurgulayın',
                'Hızlı karar alma süreçleri sunun',
                'Kontrol ve başarı fırsatlarını öne çıkarın'
            ]
        },
        'I': {
            'approach': 'İlişki Odaklı Satış',
            'tips': [
                'Sosyal etkileşime önem verin',
                'Referanslar ve başarı hikayeleri kullanın',
                'Ürünün sosyal statü etkisini vurgulayın',
                'Eğlenceli ve enerjik bir satış deneyimi sunun'
            ]
        },
        'S': {
            'approach': 'Trust-Focused Sales',
            'tips': [
                'Detaylı ve adım adım süreç sunun',
                'Emphasize security and stability elements',
                'Uzun vadeli destek garantisi verin',
                'Değişimin minimum etkisini gösterin'
            ]
        },
        'C': {
            'approach': 'Analitik Satış',
            'tips': [
                'Detaylı teknik bilgi ve veri sunun',
                'Show quality standards and certifications',
                'Mantıksal argümanlar kullanın',
                'Yazılı dokümantasyon sağlayın'
            ]
        }
    }
    
    def analyze_personality(self, crystal_data: Dict[str, Any]) -> Dict[str, Any]:
        """Perform personality analysis from Crystal data"""
        
        personality_type = crystal_data.get('personality_type', '')
        disc_profile = personality_type[0] if personality_type else 'D'
        
        analysis = {
            'personality_profile': {
                'type': personality_type,
                'strengths': self.DISC_PROFILES[disc_profile]['strengths'],
                'communication_style': self.DISC_PROFILES[disc_profile]['communication'],
                'motivation_factors': self.DISC_PROFILES[disc_profile]['motivation'],
                'decision_making': self.DISC_PROFILES[disc_profile]['decision_making']
            },
            'sales_recommendations': {
                'approach': self.SALES_APPROACHES[disc_profile]['approach'],
                'tips': self.SALES_APPROACHES[disc_profile]['tips']
            },
            'communication_recommendations': self._generate_communication_recommendations(crystal_data),
            'negotiation_style': self._analyze_negotiation_style(crystal_data),
            'buying_behavior': self._analyze_buying_behavior(crystal_data)
        }
        
        return analysis
    
    def _generate_communication_recommendations(self, crystal_data: Dict[str, Any]) -> List[str]:
        """İletişim önerileri oluştur"""
        personality_type = crystal_data.get('personality_type', '')
        communication_style = crystal_data.get('communication_style', {})
        
        recommendations = []
        
        if 'D' in personality_type:
            recommendations.extend([
                'Kısa ve öz iletişim kurun',
                'Sonuçlara odaklanın',
                'Zaman yönetimine önem verin'
            ])
        
        if 'I' in personality_type:
            recommendations.extend([
                'Sosyal ve arkadaşça yaklaşın',
                'Hikayeler ve örnekler kullanın',
                'Pozitif ve enerjik olun'
            ])
        
        if 'S' in personality_type:
            recommendations.extend([
                'Sabırlı ve destekleyici olun',
                'Adım adım açıklamalar yapın',
                'Focus on building trust'
            ])
        
        if 'C' in personality_type:
            recommendations.extend([
                'Detaylı ve mantıksal olun',
                'Verilerle destekleyin',
                'Profesyonel mesafeyi koruyun'
            ])
        
        return recommendations
    
    def _analyze_negotiation_style(self, crystal_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze negotiation style"""
        personality_traits = crystal_data.get('personality_traits', {})
        
        return {
            'primary_style': self._determine_negotiation_style(personality_traits),
            'strengths': self._determine_negotiation_strengths(personality_traits),
            'challenges': self._determine_negotiation_challenges(personality_traits),
            'recommendations': self._generate_negotiation_recommendations(personality_traits)
        }
    
    def _analyze_buying_behavior(self, crystal_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze purchasing behavior"""
        personality_type = crystal_data.get('personality_type', '')
        traits = crystal_data.get('personality_traits', {})
        
        behavior = {
            'D': {
                'style': 'Hızlı ve Sonuç Odaklı',
                'priorities': ['ROI', 'Zaman tasarrufu', 'Rekabet avantajı'],
                'concerns': ['Zaman kaybı', 'Kontrol eksikliği', 'Düşük performans']
            },
            'I': {
                'style': 'Duygusal ve İlişki Odaklı',
                'priorities': ['İnovasyon', 'Sosyal etki', 'Kullanım kolaylığı'],
                'concerns': ['Sosyal kabul', 'Destek eksikliği', 'Karmaşıklık']
            },
            'S': {
                            'style': 'Cautious and Security-Focused',
            'priorities': ['Reliability', 'Stability', 'Support'],
                'concerns': ['Risk', 'Değişim', 'Belirsizlik']
            },
            'C': {
                'style': 'Analitik ve Detay Odaklı',
                'priorities': ['Quality', 'Accuracy', 'Logic'],
                'concerns': ['Hata riski', 'Veri eksikliği', 'Belirsiz şartlar']
            }
        }
        
        disc_type = personality_type[0] if personality_type else 'D'
        return behavior[disc_type]
    
    def _determine_negotiation_style(self, traits: Dict[str, float]) -> str:
        """Müzakere stilini belirle"""
        if traits.get('assertiveness', 0) > 0.7:
            return 'Rekabetçi'
        elif traits.get('supportiveness', 0) > 0.7:
            return 'İşbirlikçi'
        elif traits.get('stability', 0) > 0.7:
            return 'Uzlaşmacı'
        elif traits.get('conscientiousness', 0) > 0.7:
            return 'Analitik'
        else:
            return 'Dengeli'
    
    def _determine_negotiation_strengths(self, traits: Dict[str, float]) -> List[str]:
        """Identify negotiation strengths"""
        strengths = []
        
        if traits.get('assertiveness', 0) > 0.6:
            strengths.append('Taking strong positions')
        if traits.get('supportiveness', 0) > 0.6:
            strengths.append('İlişki kurma')
        if traits.get('stability', 0) > 0.6:
            strengths.append('Patient approach')
        if traits.get('conscientiousness', 0) > 0.6:
            strengths.append('Detailed analysis')
            
        return strengths
    
    def _determine_negotiation_challenges(self, traits: Dict[str, float]) -> List[str]:
        """Müzakere zorluklarını belirle"""
        challenges = []
        
        if traits.get('assertiveness', 0) < 0.4:
            challenges.append('Pozisyon almada zorluk')
        if traits.get('supportiveness', 0) < 0.4:
            challenges.append('İlişki kurmada zorluk')
        if traits.get('stability', 0) < 0.4:
            challenges.append('Sabırsızlık')
        if traits.get('conscientiousness', 0) < 0.4:
            challenges.append('Detay eksikliği')
            
        return challenges
    
    def _generate_negotiation_recommendations(self, traits: Dict[str, float]) -> List[str]:
        """Müzakere önerileri oluştur"""
        recommendations = []
        
        if traits.get('assertiveness', 0) < 0.5:
            recommendations.append('Take stronger positions')
        if traits.get('supportiveness', 0) < 0.5:
            recommendations.append('İlişki geliştirmeye odaklanın')
        if traits.get('stability', 0) < 0.5:
            recommendations.append('Daha sabırlı olun')
        if traits.get('conscientiousness', 0) < 0.5:
            recommendations.append('Conduct more detailed analysis')
            
        return recommendations
