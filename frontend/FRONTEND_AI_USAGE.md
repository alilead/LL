# 🚀 Frontend'de AI Insights Kullanım Rehberi

## 📋 **İçindekiler**

1. [Lead Detay Sayfasında](#1-lead-detay-sayfasında)
2. [Lead Listesinde](#2-lead-listesinde) 
3. [Dashboard'da](#3-dashboardda)
4. [Manuel API Çağrıları](#4-manuel-api-çağrıları)
5. [Pratik Örnekler](#5-pratik-örnekler)

---

## 1. Lead Detay Sayfasında

### 🎯 **Widget Entegrasyonu**

```tsx
// Lead detay sayfasında AI insights widget'ı
import LeadAIInsights from '@/components/leads/LeadAIInsights';

export function LeadDetail() {
  const { id } = useParams();
  const leadId = parseInt(id!);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Diğer kartlar */}
      <Card>...</Card>
      
      {/* AI Insights Widget */}
      <div className="lg:col-span-1">
        <LeadAIInsights 
          leadId={leadId} 
          leadName={`${lead.first_name} ${lead.last_name}`} 
        />
      </div>
    </div>
  );
}
```

### 📊 **Özellikler**
- **Otomatik analiz**: Sayfa açıldığında AI analizi otomatik çalışır
- **Yenileme butonu**: Manuel refresh yapabilirsiniz
- **3 skor sistemi**: Kalite, Öncelik, Güven skorları
- **DISC kişilik analizi**: Renkli kişilik tipleri
- **Satış önerileri**: Kişiliğe uygun yaklaşım tavsiyeleri

---

## 2. Lead Listesinde

### 🏷️ **Skorları Gösterme**

```tsx
import LeadAIScoreBadges from '@/components/leads/LeadAIScoreBadges';

const LeadRow = ({ lead }) => {
  return (
    <tr>
      <td>{lead.name}</td>
      <td>{lead.company}</td>
      <td>
        {/* Compact AI skorları */}
        <LeadAIScoreBadges
          qualityScore={lead.ai_insights?.quality_score}
          priorityScore={lead.ai_insights?.priority_score}
          personalityType={lead.ai_insights?.personality_type}
          confidence={lead.ai_insights?.confidence_score}
          compact={true}
        />
      </td>
    </tr>
  );
};
```

### 🔄 **Batch Analiz**

```tsx
// Birden fazla lead'i aynı anda analiz et
const analyzeBatch = async (leadIds: number[]) => {
  try {
    const results = await aiInsightsService.analyzeBatch(leadIds);
    toast.success(`${results.length} lead analiz edildi!`);
    // Tabloyu yenile
    refetch();
  } catch (error) {
    toast.error('Batch analiz başarısız');
  }
};

// Seçili lead'leri analiz et
<Button onClick={() => analyzeBatch(selectedLeads)}>
  <Brain className="w-4 h-4 mr-2" />
  Seçili Lead'leri Analiz Et
</Button>
```

---

## 3. Dashboard'da

### 📈 **Analytics Dashboard**

```tsx
import AIInsightsDashboard from '@/components/dashboard/AIInsightsDashboard';

const Dashboard = () => {
  return (
    <div className="space-y-6">
      {/* Diğer dashboard widget'ları */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Lead İstatistikleri</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Mevcut lead stats */}
          </CardContent>
        </Card>
        
        {/* AI Insights Dashboard */}
        <AIInsightsDashboard />
      </div>
    </div>
  );
};
```

---

## 4. Manuel API Çağrıları

### 🔧 **Service Kullanımı**

```tsx
import aiInsightsService from '@/services/aiInsightsService';

// Tek lead analizi
const analyzeLead = async (leadId: number) => {
  try {
    const insights = await aiInsightsService.getLeadInsights(leadId, true);
    console.log('AI Analizi:', insights);
    
    // Skorları kullan
    const quality = insights.lead_score.quality;
    const priority = insights.lead_score.priority;
    const personality = insights.personality.type;
    
    if (quality > 80) {
      toast.success('Bu yüksek kaliteli bir lead!');
    }
    
  } catch (error) {
    console.error('Analiz hatası:', error);
  }
};

// Analytics verisi al
const getAnalytics = async () => {
  try {
    const analytics = await aiInsightsService.getAnalytics();
    console.log('Toplam analiz:', analytics.total_insights);
    console.log('Ortalama kalite:', analytics.avg_quality_score);
    console.log('Kişilik dağılımı:', analytics.personality_distribution);
  } catch (error) {
    console.error('Analytics hatası:', error);
  }
};

// Yüksek öncelikli lead'ler
const getHighPriorityLeads = async () => {
  try {
    const priorityLeads = await aiInsightsService.getHighPriorityLeads(75, 10);
    console.log('Yüksek öncelikli lead sayısı:', priorityLeads.length);
  } catch (error) {
    console.error('Priority leads hatası:', error);
  }
};
```

---

## 5. Pratik Örnekler

### 🎨 **Renk Kodlaması**

```tsx
// DISC kişilik tipi renklerini al
const personalityColor = aiInsightsService.getPersonalityColor('D'); // Kırmızı
const personalityColor2 = aiInsightsService.getPersonalityColor('I'); // Sarı
const personalityColor3 = aiInsightsService.getPersonalityColor('S'); // Yeşil
const personalityColor4 = aiInsightsService.getPersonalityColor('C'); // Mavi

// Skor rengini al
const scoreColor = aiInsightsService.getScoreColor(85); // "text-green-600"
const scoreColor2 = aiInsightsService.getScoreColor(45); // "text-red-600"

// Güven seviyesi badge rengi
const confidenceBadgeColor = aiInsightsService.getConfidenceBadgeColor(0.9); // "bg-green-100 text-green-800"
```

### 🔄 **State Management**

```tsx
const LeadListWithAI = () => {
  const [leads, setLeads] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);

  // Lead'leri AI skorlarıyla birlikte yükle
  const loadLeadsWithAI = async () => {
    try {
      const leadsData = await api.get('/leads');
      const leadsWithAI = await Promise.all(
        leadsData.map(async (lead) => {
          try {
            const aiInsights = await aiInsightsService.getLeadInsights(lead.id);
            return { ...lead, ai_insights: aiInsights };
          } catch {
            return { ...lead, ai_insights: null };
          }
        })
      );
      setLeads(leadsWithAI);
    } catch (error) {
      console.error('Lead'ler yüklenemedi:', error);
    }
  };

  // Tüm lead'leri analiz et
  const analyzeAllLeads = async () => {
    setAnalyzing(true);
    try {
      const leadIds = leads.map(lead => lead.id);
      await aiInsightsService.analyzeBatch(leadIds);
      await loadLeadsWithAI(); // Yeniden yükle
      toast.success('Tüm lead'ler analiz edildi!');
    } catch (error) {
      toast.error('Batch analiz başarısız');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div>
      <div className="mb-4">
        <Button
          onClick={analyzeAllLeads}
          disabled={analyzing}
        >
          {analyzing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analiz Ediliyor...
            </>
          ) : (
            <>
              <Brain className="w-4 h-4 mr-2" />
              Tüm Lead'leri Analiz Et
            </>
          )}
        </Button>
      </div>

      {/* Lead listesi */}
      <div className="space-y-2">
        {leads.map(lead => (
          <div key={lead.id} className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-medium">{lead.name}</h3>
              <p className="text-sm text-gray-600">{lead.company}</p>
            </div>
            
            {/* AI Skorları */}
            <LeadAIScoreBadges
              qualityScore={lead.ai_insights?.lead_score?.quality}
              priorityScore={lead.ai_insights?.lead_score?.priority}
              personalityType={lead.ai_insights?.personality?.type}
              confidence={lead.ai_insights?.confidence_score}
              compact={true}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
```

### 📊 **Filtreleme ve Sıralama**

```tsx
const FilteredLeadList = () => {
  const [leads, setLeads] = useState([]);
  const [filters, setFilters] = useState({
    minQuality: 0,
    minPriority: 0,
    personalityTypes: []
  });

  // AI skorlarına göre filtrele
  const filteredLeads = leads.filter(lead => {
    if (!lead.ai_insights) return true;
    
    const quality = lead.ai_insights.lead_score?.quality || 0;
    const priority = lead.ai_insights.lead_score?.priority || 0;
    const personality = lead.ai_insights.personality?.type;
    
    return (
      quality >= filters.minQuality &&
      priority >= filters.minPriority &&
      (filters.personalityTypes.length === 0 || filters.personalityTypes.includes(personality))
    );
  });

  // AI skorlarına göre sırala
  const sortedLeads = filteredLeads.sort((a, b) => {
    const aScore = a.ai_insights?.lead_score?.priority || 0;
    const bScore = b.ai_insights?.lead_score?.priority || 0;
    return bScore - aScore; // Yüksek öncelik önce
  });

  return (
    <div>
      {/* Filtreler */}
      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Min Kalite Skoru</label>
            <input
              type="range"
              min="0"
              max="100"
              value={filters.minQuality}
              onChange={(e) => setFilters(prev => ({ ...prev, minQuality: Number(e.target.value) }))}
              className="w-full"
            />
            <span className="text-sm text-gray-600">{filters.minQuality}</span>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Min Öncelik Skoru</label>
            <input
              type="range"
              min="0"
              max="100"
              value={filters.minPriority}
              onChange={(e) => setFilters(prev => ({ ...prev, minPriority: Number(e.target.value) }))}
              className="w-full"
            />
            <span className="text-sm text-gray-600">{filters.minPriority}</span>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Kişilik Tipleri</label>
            <div className="flex gap-2">
              {['D', 'I', 'S', 'C'].map(type => (
                <button
                  key={type}
                  onClick={() => {
                    setFilters(prev => ({
                      ...prev,
                      personalityTypes: prev.personalityTypes.includes(type)
                        ? prev.personalityTypes.filter(t => t !== type)
                        : [...prev.personalityTypes, type]
                    }));
                  }}
                  className={`w-8 h-8 rounded-full text-white font-bold text-sm ${
                    filters.personalityTypes.includes(type) ? 'ring-2 ring-black' : ''
                  }`}
                  style={{ backgroundColor: aiInsightsService.getPersonalityColor(type) }}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Filtrelenmiş ve sıralanmış lead listesi */}
      <div className="space-y-2">
        {sortedLeads.map(lead => (
          <div key={lead.id} className="flex items-center justify-between p-4 border rounded-lg">
            {/* Lead bilgileri ve AI skorları */}
          </div>
        ))}
      </div>
    </div>
  );
};
```

---

## 🎯 **Önemli Notlar**

### ✅ **Yapılacaklar**
- Lead detay sayfasında her zaman AI widget'ını göster
- Lead listesinde compact badge'leri kullan
- Dashboard'da analytics widget'ını ekle
- Batch analizleri kullan (performans için)
- Error handling yapın

### ❌ **Yapılmaması Gereken**
- Her lead için ayrı ayrı API çağrısı yapmayın
- Cache'i atlamadan sürekli refresh yapmayın
- Loading state'lerini unutmayın
- AI skorları olmayan lead'ler için error göstermeyin

### 🚀 **Performans İpuçları**
- `aiInsightsService.analyzeBatch()` kullanın
- Lead listelerinde lazy loading yapın
- Cache'i effectif kullanın
- Background'da analiz yapın

---

Bu rehber ile frontend'de AI Insights'ı etkili bir şekilde kullanabilirsiniz! 🎉 