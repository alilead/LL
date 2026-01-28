import api from './axios';

export interface PsychometricData {
  lead_id: number;
  analysis_methods: string[];
  crystal_knows_data?: any;
  internal_analysis?: any;
  combined_insights: {
    personality_type: string;
    personality_description: string;
    disc_scores: Record<string, number>;
    big_five: Record<string, number>;
    communication_style: {
      primary_style: string;
      preferences: string[];
      internal_recommendations: string[];
    };
    sales_insights: {
      approach: string;
      objections: string[];
      motivators: string[];
      decision_style: string;
    };
    behavioral_predictions: {
      work_style: string;
      stress_response: string;
      team_role: string;
      leadership_style: string;
    };
    strengths: string[];
    confidence_score: number;
    data_sources: string[];
  };
  personality_wheel: {
    disc_wheel: Record<string, number>;
    big_five_radar: Record<string, number>;
  };
  sales_intelligence: {
    sales_strategy: {
      primary_approach: string;
      presentation_style: string;
      closing_technique: string;
      objection_handling: string;
      follow_up_style: string;
    };
    meeting_recommendations: {
      optimal_duration: string;
      best_time: string;
      preparation_tips: string[];
      agenda_style: string;
    };
    email_guidelines: {
      subject_line_style: string;
      message_length: string;
      tone: string;
      call_to_action: string;
    };
    negotiation_strategy: {
      approach: string;
      concession_strategy: string;
      decision_timeline: string;
    };
  };
  confidence_score: number;
}

export interface BehavioralPrediction {
  decision_making: {
    style: string;
    timeline: string;
    influencers: string[];
    information_needs: string[];
  };
  communication_preferences: {
    channel_priority: string[];
    frequency: string;
    timing: Record<string, string>;
    message_style: string;
  };
  stress_response: {
    triggers: string[];
    indicators: string[];
    management: string[];
  };
  motivation_factors: {
    primary_drivers: string[];
    recognition_style: string;
    goal_orientation: string;
  };
}

export interface CommunicationGuide {
  context: string;
  personality_type: string;
  guide: Record<string, string>;
  quick_tips: string[];
  avoid_list: string[];
  example_phrases: Record<string, string[]>;
}

class PsychometricService {
  async getPsychometricAnalysis(leadId: number, useCrystal = true, refresh = false): Promise<PsychometricData> {
    const response = await api.get(`/ai-insights/${leadId}/psychometric`, {
      params: { use_crystal: useCrystal, refresh }
    });
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to load psychometric analysis');
    }
    
    return response.data.data;
  }

  async getBehavioralPredictions(leadId: number): Promise<BehavioralPrediction> {
    const response = await api.get(`/ai-insights/${leadId}/behavioral-predictions`);
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to load behavioral predictions');
    }
    
    return response.data.data;
  }

  async getCommunicationGuide(leadId: number, context: string = 'sales'): Promise<CommunicationGuide> {
    const response = await api.get(`/ai-insights/${leadId}/communication-guide`, {
      params: { context }
    });
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to load communication guide');
    }
    
    return response.data.data;
  }

  // Utility functions for UI
  getPersonalityColor(type: string): string {
    const colors: Record<string, string> = {
      'D': '#EF4444', // Red - Dominance
      'I': '#F59E0B', // Amber - Influence
      'S': '#10B981', // Emerald - Steadiness
      'C': '#3B82F6', // Blue - Conscientiousness
    };
    return colors[type[0]] || '#6B7280';
  }

  getPersonalityDescription(type: string): string {
    const descriptions: Record<string, string> = {
      'D': 'Dominance - Direct, Results-Oriented, Decisive',
      'I': 'Influence - Interactive, Optimistic, People-Focused',
      'S': 'Steadiness - Stable, Patient, Team-Oriented',
      'C': 'Conscientiousness - Compliant, Accurate, Quality-Focused',
    };
    return descriptions[type[0]] || 'Unknown personality type';
  }

  getConfidenceLevel(score: number): { label: string; color: string; description: string } {
    if (score >= 0.8) {
      return { 
        label: 'High', 
        color: 'bg-green-100 text-green-800',
        description: 'Very reliable analysis based on comprehensive data'
      };
    }
    if (score >= 0.6) {
      return { 
        label: 'Medium', 
        color: 'bg-yellow-100 text-yellow-800',
        description: 'Good analysis with some data limitations'
      };
    }
    return { 
      label: 'Low', 
      color: 'bg-red-100 text-red-800',
      description: 'Limited analysis - more data needed for accuracy'
    };
  }

  getCommunicationStyleIcon(style: string): string {
    const icons: Record<string, string> = {
      'direct': '🎯',
      'collaborative': '🤝',
      'supportive': '🤗',
      'analytical': '📊',
      'enthusiastic': '🔥',
      'patient': '⏳',
      'results-focused': '📈',
      'detail-oriented': '🔍'
    };
    return icons[style.toLowerCase()] || '💬';
  }

  getStressLevel(triggers: string[]): { level: string; color: string } {
    const triggerCount = triggers.length;
    if (triggerCount >= 4) {
      return { level: 'High', color: 'text-red-600' };
    }
    if (triggerCount >= 2) {
      return { level: 'Medium', color: 'text-yellow-600' };
    }
    return { level: 'Low', color: 'text-green-600' };
  }

  getDecisionSpeedIndicator(timeline: string): { speed: string; color: string; icon: string } {
    if (timeline.includes('Quick') || timeline.includes('Fast')) {
      return { speed: 'Fast', color: 'text-red-600', icon: '⚡' };
    }
    if (timeline.includes('Moderate')) {
      return { speed: 'Moderate', color: 'text-yellow-600', icon: '⏱️' };
    }
    return { speed: 'Slow', color: 'text-blue-600', icon: '🐌' };
  }

  formatPersonalityTraits(traits: string[]): string[] {
    return traits.map(trait => 
      trait.charAt(0).toUpperCase() + trait.slice(1).toLowerCase()
    );
  }

  generatePersonalityInsight(psychometricData: PsychometricData): string {
    const { personality_type, confidence_score } = psychometricData.combined_insights;
    const confidenceText = confidence_score >= 0.8 ? 'highly confident' : 
                          confidence_score >= 0.6 ? 'moderately confident' : 'initial';
    
    const insights: Record<string, string> = {
      'D': `This ${confidenceText} analysis suggests a dominant personality type who values efficiency, results, and direct communication. They likely prefer quick decision-making and appreciate when you get straight to the point.`,
      'I': `This ${confidenceText} analysis indicates an influential personality type who thrives on social interaction and positive relationships. They respond well to enthusiasm and collaborative approaches.`,
      'S': `This ${confidenceText} analysis shows a steady personality type who values stability, consistency, and supportive relationships. They prefer gradual changes and detailed explanations.`,
      'C': `This ${confidenceText} analysis reveals a conscientious personality type who prioritizes accuracy, quality, and systematic approaches. They appreciate detailed information and logical reasoning.`
    };
    
    return insights[personality_type[0]] || 'Personality analysis in progress...';
  }

  exportPsychometricReport(psychometricData: PsychometricData, leadName: string): void {
    const report = {
      lead_name: leadName,
      personality_type: psychometricData.combined_insights.personality_type,
      analysis_date: new Date().toISOString(),
      confidence_score: psychometricData.confidence_score,
      data_sources: psychometricData.combined_insights.data_sources,
      key_insights: {
        communication_style: psychometricData.combined_insights.communication_style.primary_style,
        sales_approach: psychometricData.sales_intelligence.sales_strategy.primary_approach,
        decision_timeline: psychometricData.sales_intelligence.negotiation_strategy.decision_timeline,
        strengths: psychometricData.combined_insights.strengths
      },
      recommendations: {
        meeting_duration: psychometricData.sales_intelligence.meeting_recommendations.optimal_duration,
        email_style: psychometricData.sales_intelligence.email_guidelines.tone,
        closing_technique: psychometricData.sales_intelligence.sales_strategy.closing_technique
      }
    };

    const dataStr = JSON.stringify(report, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `${leadName.replace(/\s+/g, '_')}_psychometric_report.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }
}

export const psychometricService = new PsychometricService(); 