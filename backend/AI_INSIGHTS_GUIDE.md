# 🤖 AI Insights - Ücretsiz AI ile Lead Analizi

LeadLab CRM'e entegre edilmiş ücretsiz AI Insights sistemi. Lead'lerin kişilik analizi, satış skorlaması ve öneriler üretir.

## 🎯 Özellikler

### ✨ **Kişilik Analizi**
- **DISC Profil Tahmini**: Job title ve sektör bazlı DISC analizi
- **İletişim Stili**: Lead'e uygun iletişim tarzı önerisi
- **Güçlü Yönler**: Kişilik tipine göre öne çıkan özellikler

### 📊 **Lead Skorlaması** 
- **Kalite Skoru**: Profil tamamlılığı ve veri kalitesi (0-100)
- **Öncelik Skoru**: Karar verici pozisyon ve seniority (0-100)
- **Güven Skoru**: AI tahmininin güvenilirlik oranı (0-1)

### 🎯 **Satış Önerileri**
- **Yaklaşım Stratejisi**: DISC profiline özel satış yaklaşımı
- **İletişim İpuçları**: Etkili iletişim için öneriler
- **Dikkat Edilecek Noktalar**: Kaçınılması gereken davranışlar

## 🔧 AI Sağlayıcıları

### 1. **Google Gemini** (Öncelik 1)
```bash
# .env dosyasına ekleyin
GEMINI_API_KEY=your-gemini-api-key
```
- **Ücretsiz Tier**: Ayda 15.000 istek
- **Kalite**: Yüksek doğruluk oranı
- **Hız**: ~2-3 saniye

### 2. **Hugging Face** (Öncelik 2)  
```bash
# .env dosyasına ekleyin
HUGGINGFACE_API_KEY=your-hf-token
```
- **Ücretsiz**: Sınırsız kullanım
- **Kalite**: Orta doğruluk
- **Hız**: ~5-10 saniye

### 3. **Rule-Based Fallback** (Öncelik 3)
- **Maliyet**: Tamamen ücretsiz
- **Kalite**: Temel seviye
- **Hız**: Anında

## 📡 API Endpoints

### Lead Analizi
```bash
GET /api/v1/leads/{lead_id}/insights?refresh=false
```

**Response:**
```json
{
  "lead_id": 123,
  "lead_score": {
    "quality": 85.5,
    "priority": 92.0,
    "confidence": 0.8
  },
  "personality": {
    "type": "D",
    "strengths": ["results-oriented", "decisive"],
    "communication": ["direct and brief"],
    "confidence": 0.7
  },
  "recommendations": {
    "approach": "Focus on results and ROI",
    "tips": ["Be direct", "Show numbers"],
    "challenges": ["Avoid details", "Time-conscious"]
  },
  "features_used": 25,
  "confidence_score": 0.8
}
```

### Toplu Analiz
```bash
POST /api/v1/leads/batch-analyze
Body: [123, 124, 125]
```

### Analytics
```bash
GET /api/v1/leads/analytics
```

### Yüksek Öncelikli Lead'ler
```bash
GET /api/v1/leads/high-priority?min_score=70&limit=10
```

## 💻 Frontend Entegrasyon

```typescript
import aiInsightsService from '@/services/aiInsightsService';

// Lead analizi al
const insights = await aiInsightsService.getLeadInsights(123);

// Toplu analiz başlat
await aiInsightsService.batchAnalyzeLeads([123, 124, 125]);

// Analytics
const analytics = await aiInsightsService.getAnalytics();

// DISC renk kodu
const color = aiInsightsService.getPersonalityColor('D'); // #ef4444

// Confidence badge
const badgeClass = aiInsightsService.getConfidenceBadgeColor(0.8);
```

## 🗄️ Database Schema

```sql
CREATE TABLE ai_insights (
  id INT AUTO_INCREMENT PRIMARY KEY,
  lead_id INT NOT NULL,
  user_id INT NOT NULL,
  organization_id INT NOT NULL,
  
  -- Scoring
  quality_score FLOAT NOT NULL DEFAULT 0.0,
  priority_score FLOAT NOT NULL DEFAULT 0.0,
  confidence_score FLOAT NOT NULL DEFAULT 0.0,
  
  -- Personality
  personality_type VARCHAR(10),
  disc_profile VARCHAR(20),
  communication_style VARCHAR(100),
  
  -- Analysis Results (JSON)
  strengths JSON,
  recommendations JSON,
  sales_approach TEXT,
  
  -- Metadata
  features_used INT DEFAULT 0,
  ai_model_version VARCHAR(50),
  analysis_provider VARCHAR(50) DEFAULT 'free_ai',
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign Keys
  FOREIGN KEY (lead_id) REFERENCES leads(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (organization_id) REFERENCES organizations(id),
  
  -- Indexes
  INDEX idx_lead_id (lead_id),
  INDEX idx_organization_id (organization_id),
  INDEX idx_priority_score (priority_score)
);
```

## 🚀 Kullanım Senaryoları

### 1. **Lead Detay Sayfasında**
```typescript
// Lead profil sayfasında AI insights widget'ı
const LeadAIInsights: React.FC = ({ leadId }) => {
  const [insights, setInsights] = useState<AIInsights | null>(null);
  
  useEffect(() => {
    aiInsightsService.getLeadInsights(leadId)
      .then(setInsights)
      .catch(console.error);
  }, [leadId]);
  
  if (!insights) return <div>Loading AI insights...</div>;
  
  return (
    <div className="bg-white rounded-lg p-6 shadow">
      <h3>🤖 AI Insights</h3>
      
      {/* Scores */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <span className="text-sm text-gray-500">Quality</span>
          <div className={`text-2xl font-bold ${aiInsightsService.getScoreColor(insights.lead_score.quality)}`}>
            {Math.round(insights.lead_score.quality)}
          </div>
        </div>
        <div>
          <span className="text-sm text-gray-500">Priority</span>
          <div className={`text-2xl font-bold ${aiInsightsService.getScoreColor(insights.lead_score.priority)}`}>
            {Math.round(insights.lead_score.priority)}
          </div>
        </div>
        <div>
          <span className="text-sm text-gray-500">Confidence</span>
          <span className={`px-2 py-1 rounded text-xs ${aiInsightsService.getConfidenceBadgeColor(insights.confidence_score)}`}>
            {aiInsightsService.formatConfidence(insights.confidence_score)}
          </span>
        </div>
      </div>
      
      {/* Personality */}
      <div className="mb-4">
        <h4 className="font-medium mb-2">👤 Personality Profile</h4>
        <div className="flex items-center gap-2 mb-2">
          <span 
            className="w-4 h-4 rounded"
            style={{ backgroundColor: aiInsightsService.getPersonalityColor(insights.personality.type) }}
          />
          <span className="font-medium">{insights.personality.type}</span>
          <span className="text-sm text-gray-500">
            {aiInsightsService.getDiscDescription(insights.personality.type)}
          </span>
        </div>
        <div className="text-sm text-gray-600">
          {aiInsightsService.getCommunicationEmoji(insights.personality.communication[0])} 
          {insights.personality.communication[0]}
        </div>
      </div>
      
      {/* Recommendations */}
      <div>
        <h4 className="font-medium mb-2">🎯 Sales Approach</h4>
        <p className="text-sm text-gray-600 mb-2">
          {insights.recommendations.approach}
        </p>
        <div className="space-y-1">
          {insights.recommendations.tips.slice(0, 3).map((tip, i) => (
            <div key={i} className="text-xs text-green-600 flex items-center gap-1">
              <span>✓</span> {tip}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
```

### 2. **Dashboard Analytics**
```typescript
const AIAnalyticsDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<AIAnalytics | null>(null);
  
  useEffect(() => {
    aiInsightsService.getAnalytics().then(setAnalytics);
  }, []);
  
  return (
    <div className="grid grid-cols-4 gap-4">
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-500">Total Insights</h3>
        <div className="text-2xl font-bold">{analytics?.total_insights || 0}</div>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-500">Avg Quality</h3>
        <div className="text-2xl font-bold text-blue-600">
          {Math.round(analytics?.avg_quality_score || 0)}
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-500">Avg Priority</h3>
        <div className="text-2xl font-bold text-green-600">
          {Math.round(analytics?.avg_priority_score || 0)}
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-500">Confidence</h3>
        <div className="text-2xl font-bold text-purple-600">
          {Math.round((analytics?.avg_confidence || 0) * 100)}%
        </div>
      </div>
    </div>
  );
};
```

### 3. **Lead Listesinde AI Skorları**
```typescript
const LeadsList: React.FC = () => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr>
            <th>Name</th>
            <th>Company</th>
            <th>🎯 AI Quality</th>
            <th>📈 AI Priority</th>
            <th>👤 Personality</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr key={lead.id}>
              <td>{lead.first_name} {lead.last_name}</td>
              <td>{lead.company}</td>
              <td>
                <span className={`font-medium ${aiInsightsService.getScoreColor(lead.ai_quality_score || 0)}`}>
                  {Math.round(lead.ai_quality_score || 0)}
                </span>
              </td>
              <td>
                <span className={`font-medium ${aiInsightsService.getScoreColor(lead.ai_priority_score || 0)}`}>
                  {Math.round(lead.ai_priority_score || 0)}
                </span>
              </td>
              <td>
                {lead.ai_personality_type && (
                  <span 
                    className="w-3 h-3 rounded-full inline-block"
                    style={{ backgroundColor: aiInsightsService.getPersonalityColor(lead.ai_personality_type) }}
                    title={aiInsightsService.getDiscDescription(lead.ai_personality_type)}
                  />
                )}
              </td>
              <td>
                <button 
                  onClick={() => analyzeLeadAI(lead.id)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  🤖 Analyze
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

## 🔑 API Keys Alma Rehberi

### Google Gemini API Key
1. [Google AI Studio](https://aistudio.google.com/app/apikey)'ya gidin
2. "Get API Key" tıklayın
3. Yeni API key oluşturun
4. `.env` dosyasına `GEMINI_API_KEY=your-key` ekleyin

### Hugging Face Token
1. [Hugging Face](https://huggingface.co/settings/tokens)'e kayıt olun
2. Settings > Access Tokens'a gidin
3. "New Token" oluşturun (Read yetkisi yeterli)
4. `.env` dosyasına `HUGGINGFACE_API_KEY=your-token` ekleyin

## 🎭 DISC Kişilik Profilleri

| Tip | Özellik | İletişim | Satış Yaklaşımı |
|-----|----------|----------|----------------|
| **D** Dominant | Sonuç odaklı, kararlı | Direkt, kısa | ROI, verimlilik vurgusu |
| **I** Influential | Sosyal, coşkulu | Samimi, heyecanlı | İlişki kurma, sosyal kanıt |
| **S** Steady | Sabırlı, destekleyici | Nazik, anlayışlı | Güvenilirlik, istikrar |
| **C** Compliant | Analitik, sistematik | Detaylı, kanıta dayalı | Kalite, teknik özellikler |

## 🚀 Deployment

1. **Database Migration** (zaten yapıldı):
   ```sql
   -- ai_insights tablosu oluşturuldu
   ```

2. **Environment Variables**:
   ```bash
   # Opsiyonel - Daha iyi AI için
   GEMINI_API_KEY=your-gemini-key
   HUGGINGFACE_API_KEY=your-hf-token
   ```

3. **Dependencies** (zaten mevcut):
   ```bash
   # httpx==0.25.1 - API çağrıları için
   ```

4. **Frontend Service**:
   ```typescript
   // services/aiInsightsService.ts zaten oluşturuldu
   ```

## 📈 Performans

- **Rule-based**: <100ms (anında)
- **Hugging Face**: 2-10 saniye  
- **Gemini**: 1-3 saniye
- **Database Cache**: Tekrar analizlerde <100ms

## 🛠️ Geliştirme Notları

- AI insights database'e cache'lenir
- `refresh=true` parametresi ile yeniden analiz
- Background task ile toplu işlem
- Fallback mekanizmaları mevcut
- TypeScript tip desteği tam

## 🎉 Özet

✅ **Tamamen ücretsiz** çalışır (rule-based fallback)  
✅ **API key'ler opsiyonel** (Gemini/HF için kalite artırır)  
✅ **Database'e kayıt** edilir (hızlı erişim)  
✅ **Frontend entegrasyon** hazır  
✅ **TypeScript desteği** tam  
✅ **Responsive design** uyumlu

Bu rehber ile AI Insights özelliği tamamen çalışır durumda ve üretim ortamında kullanılabilir! 🚀 