import React from 'react';
import { Badge } from '@/components/ui/Badge';
import { Brain } from 'lucide-react';
import aiInsightsService from '@/services/aiInsightsService';

interface LeadAIScoreBadgesProps {
  qualityScore?: number;
  priorityScore?: number;
  personalityType?: string;
  confidence?: number;
  compact?: boolean;
}

const LeadAIScoreBadges: React.FC<LeadAIScoreBadgesProps> = ({
  qualityScore,
  priorityScore,
  personalityType,
  confidence,
  compact = false
}) => {
  // Eğer hiç AI data yoksa gösterme
  if (!qualityScore && !priorityScore && !personalityType) {
    return (
      <div className={`flex items-center gap-1 ${compact ? 'text-xs' : 'text-sm'}`}>
        <Brain className={`${compact ? 'w-3 h-3' : 'w-4 h-4'} text-gray-400`} />
        <span className="text-gray-400">No AI data</span>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {/* Quality Score */}
        {qualityScore && (
          <Badge
            variant="outline"
            className={`text-xs px-1.5 py-0.5 ${aiInsightsService.getScoreColor(qualityScore)} border-current`}
          >
            Q{Math.round(qualityScore)}
          </Badge>
        )}

        {/* Priority Score */}
        {priorityScore && (
          <Badge
            variant="outline"
            className={`text-xs px-1.5 py-0.5 ${aiInsightsService.getScoreColor(priorityScore)} border-current`}
          >
            P{Math.round(priorityScore)}
          </Badge>
        )}

        {/* Personality Type */}
        {personalityType && (
          <div
            className="w-4 h-4 rounded-full flex items-center justify-center text-white text-xs font-bold"
            style={{ backgroundColor: aiInsightsService.getPersonalityColor(personalityType) }}
            title={aiInsightsService.getDiscDescription(personalityType)}
          >
            {personalityType[0]}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Brain className="w-4 h-4 text-blue-500" />
      
      <div className="flex items-center gap-1">
        {/* Quality Score */}
        {qualityScore && (
          <Badge
            variant="outline"
            className={`text-xs ${aiInsightsService.getScoreColor(qualityScore)} border-current`}
          >
            Quality: {Math.round(qualityScore)}
          </Badge>
        )}

        {/* Priority Score */}
        {priorityScore && (
          <Badge
            variant="outline"
            className={`text-xs ${aiInsightsService.getScoreColor(priorityScore)} border-current`}
          >
            Priority: {Math.round(priorityScore)}
          </Badge>
        )}

        {/* Personality & Confidence */}
        {personalityType && (
          <div className="flex items-center gap-1">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ backgroundColor: aiInsightsService.getPersonalityColor(personalityType) }}
              title={aiInsightsService.getDiscDescription(personalityType)}
            >
              {personalityType[0]}
            </div>
            {confidence && (
              <Badge className={`text-xs ${aiInsightsService.getConfidenceBadgeColor(confidence)}`}>
                {aiInsightsService.formatConfidence(confidence)}
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LeadAIScoreBadges; 