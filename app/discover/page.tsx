// app/discover/page.tsx
"use client";

import { useEffect, useState } from "react";
import { getUserAccessLevel, type AccessControlResult } from "@/lib/access-control-client";
import { getAllCategories, getCategoryById, type CategoryMapping } from "@/lib/challenge-categories";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { Calendar, Users, Award, Search, Filter, Clock, Star } from "lucide-react";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";

type Challenge = {
  id: string;
  title: string;
  description?: string;
  startAt: string;
  endAt: string;
  imageUrl?: string;
  category?: string;
  difficulty?: string;
  featured?: boolean;
  _count?: { enrollments: number };
  creator?: { name: string; whopCompanyId?: string; };
  tenant?: { name: string; whopCompanyId?: string; };
};

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
  const [categories, setCategorles] = useState<CategoryMapping[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        // Check user access
        const access = await getUserAccessLevel();
        setUserAccess(access);

        // Load categories
        const allCategories = getAllCategories();
        setCategorles(allCategories);

        // Load real challenges from API
        const response = await fetch('/api/discover/challenges');
        if (response.ok) {
          const data = await response.json();
          setChallenges(data.challenges || []);
          setFilteredChallenges(data.challenges || []);
        } else {
          console.error('Failed to load challenges');
          setChallenges([]);
          setFilteredChallenges([]);
        }
      } catch (error) {
        console.error('Error loading discover page:', error);
        setChallenges([]);
        setFilteredChallenges([]);
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

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter(challenge => 
        challenge.category === selectedCategory
      );
    }

    // Difficulty filter
    if (selectedDifficulty) {
      filtered = filtered.filter(challenge =>
        challenge.difficulty === selectedDifficulty
      );
    }

    setFilteredChallenges(filtered);
  }, [challenges, searchTerm, selectedCategory, selectedDifficulty]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white pt-20">
        <div className="max-w-7xl mx-auto p-6">
          <div className="mb-12">
            <div className="h-12 bg-gray-800 rounded-lg w-96 mb-4 animate-pulse"></div>
            <div className="h-6 bg-gray-800 rounded-lg w-[600px] animate-pulse"></div>
          </div>
          
          <div className="mb-12">
            <div className="h-8 bg-gray-800 rounded-lg w-48 mb-6 animate-pulse"></div>
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-9 gap-4 mb-8">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                <div key={i} className="bg-gray-800 rounded-lg p-4 animate-pulse">
                  <div className="w-8 h-8 bg-gray-700 rounded mb-2"></div>
                  <div className="h-3 bg-gray-700 rounded w-16"></div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-gray-800 rounded-lg p-6 animate-pulse">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gray-700 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-5 bg-gray-700 rounded w-64 mb-2"></div>
                    <div className="h-4 bg-gray-700 rounded w-48"></div>
                  </div>
                  <div className="h-9 w-20 bg-gray-700 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white pt-20">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Discover Challenges
          </h1>
          <p className="text-gray-400 max-w-2xl">
            Find new challenges from various creators and expand your horizons.
          </p>
        </div>

        {/* Categories */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-white mb-6">
            Categories
          </h2>
          <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-9 gap-4 mb-8">
            {categories.map((category: CategoryMapping) => {
              const isSelected = selectedCategory === category.id;
              
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`group relative rounded-lg p-4 transition-all duration-200 hover:scale-105 ${
                    isSelected 
                      ? category.color + ' ring-2 ring-white/20' 
                      : 'bg-gray-800 hover:bg-gray-700'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">
                      {category.icon}
                    </div>
                    <div className="text-sm font-medium text-white">
                      {category.label}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 bg-gray-800/50 rounded-lg p-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search for challenges..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {DIFFICULTY_LEVELS.map(level => (
                <option key={level.value} value={level.value} className="bg-gray-700">
                  {level.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="mt-4 text-sm text-gray-400 flex items-center">
            <span className="mr-2">🚧</span>
            Filters and search coming soon! Categories will be automatically synchronized from Whop.
          </div>
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-semibold text-white">
              All Challenges ({filteredChallenges.length})
            </h3>
          </div>
          {(searchTerm || selectedCategory || selectedDifficulty) && (
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("");
                setSelectedDifficulty("");
              }}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Challenges List */}
        {filteredChallenges.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-12 h-12 text-gray-400" />
            </div>
            <h2 className="text-2xl font-semibold text-white mb-4">No challenges found</h2>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              Try adjusting your search terms or explore different categories to discover amazing challenges.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredChallenges.map((challenge) => (
              <div key={challenge.id} className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition-colors group">
                <Link href={`/c/${challenge.id}`} className="block">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {challenge.imageUrl ? (
                        <img
                          src={challenge.imageUrl}
                          alt={challenge.title}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                          <Award className="w-8 h-8 text-white" />
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
                            {challenge.title}
                          </h3>
                          {challenge.difficulty === 'BEGINNER' && (
                            <span className="px-2 py-1 bg-green-600 text-green-100 text-xs font-medium rounded">
                              Geplant
                            </span>
                          )}
                          {challenge.difficulty === 'INTERMEDIATE' && (
                            <span className="px-2 py-1 bg-blue-600 text-blue-100 text-xs font-medium rounded">
                              Live
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-6 text-sm text-gray-400">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {new Date(challenge.startAt).toLocaleDateString()} - {new Date(challenge.endAt).toLocaleDateString()}
                          </div>
                          <div>
                            {Math.floor((new Date(challenge.endAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}d {Math.floor(((new Date(challenge.endAt).getTime() - new Date().getTime()) % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))}h {Math.floor(((new Date(challenge.endAt).getTime() - new Date().getTime()) % (1000 * 60 * 60)) / (1000 * 60))}m {Math.floor(((new Date(challenge.endAt).getTime() - new Date().getTime()) % (1000 * 60)) / 1000)}s
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <button className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">
                      Open →
                    </button>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
