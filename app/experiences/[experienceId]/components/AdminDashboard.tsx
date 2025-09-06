'use client';

import { useState, useEffect } from 'react';
import { User } from '@prisma/client';

interface AdminDashboardProps {
  experienceId: string;
  user: User;
  whopUser: any;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  participantCount: number;
  status: 'active' | 'draft' | 'ended';
  endAt: string | null;
}

export default function AdminDashboard({ experienceId, user, whopUser }: AdminDashboardProps) {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    try {
      const response = await fetch(`/api/experience/${experienceId}/challenges`);
      if (response.ok) {
        const data = await response.json();
        setChallenges(data.challenges);
      }
    } catch (error) {
      console.error('Error fetching challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                🎯 Admin Dashboard
              </h1>
              <p className="text-gray-600">
                Welcome back, {user.name}! Manage your challenges here.
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-sm text-gray-500">
                {whopUser.username}
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                👑
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                🏆
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Active Challenges</p>
                <p className="text-2xl font-bold text-gray-900">
                  {challenges.filter(c => c.status === 'active').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                👥
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Participants</p>
                <p className="text-2xl font-bold text-gray-900">
                  {challenges.reduce((sum, c) => sum + c.participantCount, 0)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                📊
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Challenges</p>
                <p className="text-2xl font-bold text-gray-900">
                  {challenges.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Your Challenges
          </h2>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            + Create New Challenge
          </button>
        </div>

        {/* Challenges List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading challenges...</p>
          </div>
        ) : challenges.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              🎯
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No challenges yet
            </h3>
            <p className="text-gray-600 mb-4">
              Create your first challenge to get started!
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Create Your First Challenge
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {challenges.map((challenge) => (
              <div key={challenge.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {challenge.title}
                    </h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      challenge.status === 'active' ? 'bg-green-100 text-green-800' :
                      challenge.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {challenge.status}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {challenge.description}
                  </p>
                  
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                      {challenge.participantCount} participants
                    </div>
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                      Manage →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Challenge Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Create New Challenge</h3>
            <p className="text-gray-600 mb-4">
              Challenge creation form will be implemented here.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
