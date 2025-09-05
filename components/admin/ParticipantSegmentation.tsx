"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { 
  Users, 
  Filter,
  Target,
  TrendingUp,
  Award,
  Clock,
  Mail,
  MessageSquare,
  Gift
} from "lucide-react";

interface ParticipantSegment {
  id: string;
  name: string;
  description: string;
  count: number;
  percentage: number;
  engagementLevel: 'high' | 'medium' | 'low';
  conversionPotential: 'high' | 'medium' | 'low';
  characteristics: string[];
  recommendedActions: string[];
}

interface SegmentationToolProps {
  challengeId: string;
}

export default function ParticipantSegmentation({ challengeId }: SegmentationToolProps) {
  const [segments, setSegments] = useState<ParticipantSegment[]>([]);
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSegments() {
      try {
        const res = await fetch(`/api/admin/segments/${challengeId}`);
        if (res.ok) {
          const data = await res.json();
          setSegments(data.segments || mockSegments);
        } else {
          setSegments(mockSegments);
        }
      } catch (error) {
        console.error("Failed to load segments:", error);
        setSegments(mockSegments);
      } finally {
        setLoading(false);
      }
    }

    loadSegments();
  }, [challengeId]);

  // Mock data for demonstration
  const mockSegments: ParticipantSegment[] = [
    {
      id: "super_engaged",
      name: "Super Engaged",
      description: "Participants with 90%+ completion and high interaction",
      count: 24,
      percentage: 15,
      engagementLevel: "high",
      conversionPotential: "high",
      characteristics: [
        "Daily check-ins for 2+ weeks",
        "Comments on 80%+ posts",
        "Shares content regularly",
        "Completes challenges early"
      ],
      recommendedActions: [
        "Offer exclusive VIP products",
        "Invite to beta programs", 
        "Create ambassador program",
        "Send premium upgrade offers"
      ]
    },
    {
      id: "consistent_performers",
      name: "Consistent Performers", 
      description: "Regular participants with steady engagement",
      count: 67,
      percentage: 42,
      engagementLevel: "medium",
      conversionPotential: "high",
      characteristics: [
        "60-89% completion rate",
        "Weekly interaction patterns",
        "Moderate social sharing",
        "Responds to prompts"
      ],
      recommendedActions: [
        "Gamify their experience",
        "Offer milestone rewards",
        "Create group challenges",
        "Send targeted product recommendations"
      ]
    },
    {
      id: "struggling_participants",
      name: "Struggling Participants",
      description: "Need motivation and support to stay engaged",
      count: 43,
      percentage: 27,
      engagementLevel: "low",
      conversionPotential: "medium",
      characteristics: [
        "30-59% completion rate", 
        "Irregular check-ins",
        "Low social interaction",
        "May need encouragement"
      ],
      recommendedActions: [
        "Send motivational messages",
        "Offer support resources",
        "Create easier entry points",
        "Provide coaching options"
      ]
    },
    {
      id: "at_risk",
      name: "At Risk",
      description: "Low engagement, likely to drop out",
      count: 26,
      percentage: 16,
      engagementLevel: "low", 
      conversionPotential: "low",
      characteristics: [
        "Less than 30% completion",
        "No recent activity",
        "Minimal interaction",
        "Joined but disengaged"
      ],
      recommendedActions: [
        "Re-engagement campaign",
        "Simplified challenge options",
        "Personal outreach",
        "Exit survey to understand issues"
      ]
    }
  ];

  if (loading) {
    return (
      <Card>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="space-y-3">
              <div className="h-3 bg-gray-200 rounded"></div>
              <div className="h-3 bg-gray-200 rounded w-4/5"></div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  const handleSendCampaign = (segmentId: string) => {
    console.log(`Sending campaign to segment: ${segmentId}`);
    // Implement campaign sending logic
  };

  return (
    <div className="space-y-6">
      {/* Segment Overview */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="h-5 w-5" />
            Participant Segments
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {segments.map((segment) => (
              <SegmentCard 
                key={segment.id} 
                segment={segment} 
                isSelected={selectedSegment === segment.id}
                onClick={() => setSelectedSegment(segment.id)}
                onSendCampaign={() => handleSendCampaign(segment.id)}
              />
            ))}
          </div>
        </div>
      </Card>

      {/* Detailed Segment View */}
      {selectedSegment && (
        <Card>
          <div className="p-6">
            {(() => {
              const segment = segments.find(s => s.id === selectedSegment);
              if (!segment) return null;
              
              return (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{segment.name} Details</h3>
                      <p className="text-muted">{segment.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{segment.count}</div>
                      <div className="text-sm text-muted">participants</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Characteristics */}
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Key Characteristics
                      </h4>
                      <ul className="space-y-2">
                        {segment.characteristics.map((char, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <span className="text-brand mt-1">•</span>
                            {char}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Recommended Actions */}
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Recommended Actions
                      </h4>
                      <ul className="space-y-2">
                        {segment.recommendedActions.map((action, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <span className="text-green-500 mt-1">✓</span>
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-3">Quick Actions</h4>
                    <div className="flex flex-wrap gap-3">
                      <Button 
                        variant="primary" 
                        onClick={() => handleSendCampaign(segment.id)}
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        Send Email Campaign
                      </Button>
                      <Button variant="outline">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Create Survey
                      </Button>
                      <Button variant="outline">
                        <Gift className="h-4 w-4 mr-2" />
                        Send Offer
                      </Button>
                      <Button variant="outline">
                        <Filter className="h-4 w-4 mr-2" />
                        Export List
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </Card>
      )}
    </div>
  );
}

interface SegmentCardProps {
  segment: ParticipantSegment;
  isSelected: boolean;
  onClick: () => void;
  onSendCampaign: () => void;
}

function SegmentCard({ segment, isSelected, onClick, onSendCampaign }: SegmentCardProps) {
  const getEngagementColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-green-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getConversionColor = (potential: string) => {
    switch (potential) {
      case 'high': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div 
      className={`border-2 rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'border-brand bg-brand/5' : 'border-gray-200 dark:border-gray-700'
      }`}
      onClick={onClick}
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold">{segment.name}</h4>
          <Badge className={getConversionColor(segment.conversionPotential)}>
            {segment.conversionPotential}
          </Badge>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold">{segment.count}</div>
          <div className="text-sm text-muted">{segment.percentage}% of participants</div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">Engagement:</span>
          <span className={`font-semibold ${getEngagementColor(segment.engagementLevel)}`}>
            {segment.engagementLevel}
          </span>
        </div>

        <Button 
          variant="outline" 
          className="w-full"
          onClick={(e) => {
            e.stopPropagation();
            onSendCampaign();
          }}
        >
          <Mail className="h-4 w-4 mr-2" />
          Campaign
        </Button>
      </div>
    </div>
  );
}
