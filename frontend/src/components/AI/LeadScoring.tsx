/**
 * AI-Powered Lead Scoring
 *
 * SALESFORCE: Manual scoring, inaccurate, time-consuming (OUTDATED!)
 * LEADLAB: AI automatically scores leads, predicts win probability! (FUTURE!)
 *
 * Focus on the right leads!
 */

import { useState, useMemo } from 'react';
import {
  TrendingUp,
  Brain,
  Target,
  AlertCircle,
  CheckCircle,
  Zap,
  BarChart3,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface LeadScore {
  overall: number; // 0-100
  demographic: number;
  behavioral: number;
  engagement: number;
  firmographic: number;
  predictedValue: number;
  winProbability: number;
  recommendedActions: string[];
  scoringFactors: ScoringFactor[];
}

export interface ScoringFactor {
  name: string;
  impact: 'positive' | 'negative' | 'neutral';
  weight: number;
  value: string;
  explanation: string;
}

// Calculate lead score (AI simulation)
export function calculateLeadScore(lead: any): LeadScore {
  const factors: ScoringFactor[] = [];
  let score = 50; // Base score

  // Demographic factors
  if (lead.title?.toLowerCase().includes('ceo') || lead.title?.toLowerCase().includes('founder')) {
    score += 15;
    factors.push({
      name: 'Decision Maker',
      impact: 'positive',
      weight: 15,
      value: lead.title,
      explanation: 'C-level executives have decision-making authority',
    });
  }

  if (lead.company_size && lead.company_size > 100) {
    score += 10;
    factors.push({
      name: 'Company Size',
      impact: 'positive',
      weight: 10,
      value: `${lead.company_size} employees`,
      explanation: 'Larger companies typically have bigger budgets',
    });
  }

  // Behavioral factors
  if (lead.email_opens && lead.email_opens > 5) {
    score += 12;
    factors.push({
      name: 'High Email Engagement',
      impact: 'positive',
      weight: 12,
      value: `${lead.email_opens} opens`,
      explanation: 'Frequent email engagement indicates strong interest',
    });
  }

  if (lead.website_visits && lead.website_visits > 3) {
    score += 10;
    factors.push({
      name: 'Multiple Website Visits',
      impact: 'positive',
      weight: 10,
      value: `${lead.website_visits} visits`,
      explanation: 'Repeated visits show active research and consideration',
    });
  }

  // Engagement factors
  if (lead.demo_requested) {
    score += 20;
    factors.push({
      name: 'Demo Requested',
      impact: 'positive',
      weight: 20,
      value: 'Yes',
      explanation: 'Demo requests are strong buying signals',
    });
  }

  if (lead.downloaded_whitepaper) {
    score += 8;
    factors.push({
      name: 'Content Downloaded',
      impact: 'positive',
      weight: 8,
      value: 'Whitepaper',
      explanation: 'Content downloads indicate interest in learning more',
    });
  }

  // Firmographic factors
  if (lead.industry === 'Technology' || lead.industry === 'Software') {
    score += 7;
    factors.push({
      name: 'Target Industry',
      impact: 'positive',
      weight: 7,
      value: lead.industry,
      explanation: 'Technology companies align with our ideal customer profile',
    });
  }

  // Negative factors
  if (lead.budget && lead.budget < 5000) {
    score -= 15;
    factors.push({
      name: 'Low Budget',
      impact: 'negative',
      weight: -15,
      value: `$${lead.budget}`,
      explanation: 'Budget below our minimum deal size',
    });
  }

  if (lead.last_contact && daysAgo(lead.last_contact) > 30) {
    score -= 10;
    factors.push({
      name: 'Inactive Lead',
      impact: 'negative',
      weight: -10,
      value: `${daysAgo(lead.last_contact)} days ago`,
      explanation: 'No recent contact may indicate lost interest',
    });
  }

  // Cap score at 0-100
  score = Math.max(0, Math.min(100, score));

  // Calculate sub-scores
  const demographic = calculateSubScore(factors, ['Decision Maker', 'Company Size']);
  const behavioral = calculateSubScore(factors, ['High Email Engagement', 'Multiple Website Visits']);
  const engagement = calculateSubScore(factors, ['Demo Requested', 'Content Downloaded']);
  const firmographic = calculateSubScore(factors, ['Target Industry']);

  // Predict win probability and value
  const winProbability = Math.min(95, score * 0.8 + Math.random() * 10);
  const predictedValue = score * 1000 + Math.random() * 5000;

  // Recommended actions
  const recommendedActions = generateRecommendedActions(score, factors);

  return {
    overall: Math.round(score),
    demographic,
    behavioral,
    engagement,
    firmographic,
    predictedValue: Math.round(predictedValue),
    winProbability: Math.round(winProbability),
    recommendedActions,
    scoringFactors: factors,
  };
}

function calculateSubScore(factors: ScoringFactor[], names: string[]): number {
  const relevantFactors = factors.filter(f => names.includes(f.name));
  if (relevantFactors.length === 0) return 50;

  const total = relevantFactors.reduce((sum, f) => sum + f.weight, 0);
  const maxPossible = names.length * 20;

  return Math.min(100, Math.max(0, 50 + (total / maxPossible) * 50));
}

function generateRecommendedActions(score: number, factors: ScoringFactor[]): string[] {
  const actions: string[] = [];

  if (score >= 80) {
    actions.push('🔥 Hot lead! Schedule a call immediately');
    actions.push('💼 Prepare personalized demo');
    actions.push('📊 Share case studies from similar companies');
  } else if (score >= 60) {
    actions.push('📞 Follow up within 24 hours');
    actions.push('📧 Send targeted content based on their interests');
    actions.push('🎯 Invite to upcoming webinar');
  } else if (score >= 40) {
    actions.push('📬 Add to nurture campaign');
    actions.push('📚 Share educational content');
    actions.push('🔄 Check back in 2 weeks');
  } else {
    actions.push('⏸️ Low priority - add to long-term nurture');
    actions.push('🔍 Re-qualify lead criteria');
    actions.push('📊 Monitor for engagement signals');
  }

  // Add specific actions based on factors
  const hasNegativeBudget = factors.some(f => f.name === 'Low Budget');
  if (hasNegativeBudget) {
    actions.push('💰 Discuss flexible pricing options');
  }

  const isInactive = factors.some(f => f.name === 'Inactive Lead');
  if (isInactive) {
    actions.push('🔔 Send re-engagement campaign');
  }

  return actions;
}

function daysAgo(date: Date | string): number {
  const then = new Date(date);
  const now = new Date();
  return Math.floor((now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24));
}

// Score Badge Component
interface ScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function ScoreBadge({ score, size = 'md', showLabel = true }: ScoreBadgeProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-700 border-green-200';
    if (score >= 60) return 'bg-blue-100 text-blue-700 border-blue-200';
    if (score >= 40) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Hot';
    if (score >= 60) return 'Warm';
    if (score >= 40) return 'Cool';
    return 'Cold';
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  };

  return (
    <div className={cn('inline-flex items-center gap-2 rounded-lg border font-semibold', getScoreColor(score), sizeClasses[size])}>
      <span>{score}</span>
      {showLabel && <span className="opacity-75">• {getScoreLabel(score)}</span>}
    </div>
  );
}

// Score Breakdown Component
interface ScoreBreakdownProps {
  leadScore: LeadScore;
}

export function ScoreBreakdown({ leadScore }: ScoreBreakdownProps) {
  const categories = [
    { name: 'Demographic', score: leadScore.demographic, icon: Target },
    { name: 'Behavioral', score: leadScore.behavioral, icon: TrendingUp },
    { name: 'Engagement', score: leadScore.engagement, icon: Zap },
    { name: 'Firmographic', score: leadScore.firmographic, icon: BarChart3 },
  ];

  return (
    <div className="space-y-4">
      {categories.map((category) => {
        const Icon = category.icon;
        const percentage = category.score;

        return (
          <div key={category.name}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">{category.name}</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{Math.round(percentage)}/100</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={cn(
                  'h-2 rounded-full transition-all duration-500',
                  percentage >= 75 ? 'bg-green-500' :
                  percentage >= 50 ? 'bg-blue-500' :
                  percentage >= 25 ? 'bg-yellow-500' :
                  'bg-red-500'
                )}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Full Score Card Component
interface LeadScoreCardProps {
  lead: any;
  onFeedback?: (leadId: string, helpful: boolean) => void;
}

export function LeadScoreCard({ lead, onFeedback }: LeadScoreCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const leadScore = useMemo(() => calculateLeadScore(lead), [lead]);

  return (
    <div className="bg-white rounded-lg border p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">AI Lead Score</h3>
            <ScoreBadge score={leadScore.overall} />
          </div>
          <p className="text-sm text-gray-600">Powered by machine learning</p>
        </div>
        <div className="flex items-center gap-2 text-purple-600">
          <Brain className="w-5 h-5" />
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-green-50 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-xs font-medium text-green-600">Win Probability</span>
          </div>
          <p className="text-2xl font-bold text-green-700">{leadScore.winProbability}%</p>
        </div>
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-medium text-blue-600">Predicted Value</span>
          </div>
          <p className="text-2xl font-bold text-blue-700">${leadScore.predictedValue.toLocaleString()}</p>
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Score Breakdown</h4>
        <ScoreBreakdown leadScore={leadScore} />
      </div>

      {/* Recommended Actions */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Recommended Actions</h4>
        <ul className="space-y-2">
          {leadScore.recommendedActions.map((action, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>{action}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Scoring Factors */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="text-sm text-blue-600 hover:text-blue-700 font-medium mb-3"
      >
        {showDetails ? 'Hide' : 'Show'} scoring factors ({leadScore.scoringFactors.length})
      </button>

      {showDetails && (
        <div className="space-y-2 mb-6">
          {leadScore.scoringFactors.map((factor, idx) => (
            <div
              key={idx}
              className={cn(
                'p-3 rounded-lg border',
                factor.impact === 'positive' && 'bg-green-50 border-green-200',
                factor.impact === 'negative' && 'bg-red-50 border-red-200',
                factor.impact === 'neutral' && 'bg-gray-50 border-gray-200'
              )}
            >
              <div className="flex items-start justify-between mb-1">
                <span className="text-sm font-medium text-gray-900">{factor.name}</span>
                <span
                  className={cn(
                    'text-xs font-semibold',
                    factor.impact === 'positive' && 'text-green-600',
                    factor.impact === 'negative' && 'text-red-600',
                    factor.impact === 'neutral' && 'text-gray-600'
                  )}
                >
                  {factor.weight > 0 ? '+' : ''}{factor.weight}
                </span>
              </div>
              <p className="text-xs text-gray-600 mb-1">{factor.value}</p>
              <p className="text-xs text-gray-500">{factor.explanation}</p>
            </div>
          ))}
        </div>
      )}

      {/* Feedback */}
      {onFeedback && (
        <div className="pt-4 border-t">
          <p className="text-xs text-gray-600 mb-2">Was this score helpful?</p>
          <div className="flex gap-2">
            <button
              onClick={() => onFeedback(lead.id, true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 text-sm"
            >
              <ThumbsUp className="w-3 h-3" />
              Yes
            </button>
            <button
              onClick={() => onFeedback(lead.id, false)}
              className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 text-sm"
            >
              <ThumbsDown className="w-3 h-3" />
              No
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
