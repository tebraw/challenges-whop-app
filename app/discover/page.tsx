// app/discover/page.tsx
"use client";

import { useEffect, useState } from "react";
import { getUserAccessLevel, type AccessControlResult } from "@/lib/access-control-client";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { Calendar, Users, Award, Search, Filter } from "lucide-react";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";

type Challenge = {
  id: string;
  title: string;
  description?: string;
  startAt: string;
  endAt: string;
  imageUrl?: string;
  _count?: { enrollments: number };
  creator?: { name: string; whopCompanyId?: string; };
  rules?: any;
};

const CATEGORIES = [
  { value: "", label: "All Categories" },
  { value: "fitness", label: "Fitness & Health" },
  { value: "productivity", label: "Productivity" },
  { value: "learning", label: "Learning & Skills" },
  { value: "creativity", label: "Creativity" },
  { value: "business", label: "Business" },
  { value: "lifestyle", label: "Lifestyle" },
];

const DIFFICULTY_LEVELS = [
  { value: "", label: "All Levels" },
  { value: "BEGINNER", label: "Beginner" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "ADVANCED", label: "Advanced" },
];

export default function DiscoverPage() {
  const [userAccess, setUserAccess] = useState<AccessControlResult | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [filteredChallenges, setFilteredChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        // Check user access
        const access = await getUserAccessLevel();
        setUserAccess(access);

        // Load all public challenges
        const response = await fetch('/api/challenges');
        if (response.ok) {
          const data = await response.json();
          const allChallenges = data.challenges || [];
          
          // Filter challenges based on user type
          let visibleChallenges = allChallenges;
          
          if (access.userType === 'company_owner') {
            // Company owners see challenges from other companies (not their own)
            visibleChallenges = allChallenges.filter((challenge: Challenge) => 
              challenge.creator?.whopCompanyId !== access.companyId
            );
          }
          
          setChallenges(visibleChallenges);
          setFilteredChallenges(visibleChallenges);
        }
      } catch (error) {
        console.error('Error loading discover page:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Filter challenges based on search and filters
  useEffect(() => {
    let filtered = challenges;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(challenge =>
        challenge.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        challenge.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter (based on title/description keywords for now)
    if (selectedCategory) {
      filtered = filtered.filter(challenge => {
        const text = `${challenge.title} ${challenge.description}`.toLowerCase();
        return text.includes(selectedCategory.toLowerCase());
      });
    }

    // Difficulty filter
    if (selectedDifficulty) {
      filtered = filtered.filter(challenge =>
        challenge.rules?.difficulty === selectedDifficulty
      );
    }

    setFilteredChallenges(filtered);
  }, [challenges, searchTerm, selectedCategory, selectedDifficulty]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-20">
        <div className="max-w-6xl mx-auto p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-panel rounded w-1/3"></div>
            <div className="h-12 bg-panel rounded"></div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="h-64 bg-panel"></Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Discover Challenges</h1>
          <p className="text-muted">
            {userAccess?.userType === 'customer' 
              ? 'Find exciting challenges from creators around the world'
              : userAccess?.userType === 'company_owner'
              ? 'Explore challenges from other creators for inspiration'
              : 'Browse public challenges and get inspired'
            }
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted w-4 h-4" />
              <Input
                placeholder="Search challenges..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {CATEGORIES.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </Select>
            <Select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
            >
              {DIFFICULTY_LEVELS.map(level => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </Select>
          </div>
        </Card>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-muted">
            {filteredChallenges.length} challenge{filteredChallenges.length !== 1 ? 's' : ''} found
          </p>
        </div>

        {/* Challenges Grid */}
        {filteredChallenges.length === 0 ? (
          <Card className="text-center py-12">
            <h2 className="text-xl font-semibold text-foreground mb-4">No challenges found</h2>
            <p className="text-muted mb-6">
              Try adjusting your search terms or filters to find more challenges.
            </p>
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("");
                setSelectedDifficulty("");
              }}
              className="bg-brand text-brand-foreground px-6 py-3 rounded-lg hover:bg-brand/90 transition-colors"
            >
              Clear Filters
            </button>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredChallenges.map((challenge) => (
              <Card key={challenge.id} className="hover:shadow-lg transition-all hover:scale-105">
                <Link href={`/c/${challenge.id}`} className="block">
                  {challenge.imageUrl && (
                    <div className="mb-4">
                      <img
                        src={challenge.imageUrl}
                        alt={challenge.title}
                        className="w-full h-40 object-cover rounded-lg"
                      />
                    </div>
                  )}
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {challenge.title}
                  </h3>
                  {challenge.description && (
                    <p className="text-muted text-sm mb-4 line-clamp-3">
                      {challenge.description}
                    </p>
                  )}
                  {challenge.creator?.name && (
                    <p className="text-xs text-muted mb-3">
                      by {challenge.creator.name}
                    </p>
                  )}
                  <div className="space-y-2 text-xs text-muted">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {new Date(challenge.startAt).toLocaleDateString()} - {new Date(challenge.endAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      {challenge._count?.enrollments && (
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          <span>{challenge._count.enrollments} participants</span>
                        </div>
                      )}
                      {challenge.rules?.rewards?.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Award className="w-3 h-3" />
                          <span>{challenge.rules.rewards.length} rewards</span>
                        </div>
                      )}
                    </div>
                    {challenge.rules?.difficulty && (
                      <div className="mt-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          challenge.rules.difficulty === 'BEGINNER' ? 'bg-green-100 text-green-800' :
                          challenge.rules.difficulty === 'INTERMEDIATE' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {challenge.rules.difficulty}
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
