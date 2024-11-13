import React from 'react';
import { Trophy as TrophyIcon, Target, Star, TrendingUp, Wallet, PiggyBank, CreditCard, Award } from 'lucide-react';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { useCollection } from '../hooks/useCollection';
import { Trophy } from '../types';

export default function Trophies() {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');

  const trophiesQuery = React.useMemo(() => {
    if (!user?.uid) return null;
    return query(
      collection(db, 'trophies'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
  }, [user?.uid]);

  const { data: trophies, loading } = useCollection<Trophy>(trophiesQuery);

  const filteredTrophies = React.useMemo(() => {
    if (selectedCategory === 'all') return trophies;
    return trophies?.filter(trophy => trophy.category === selectedCategory);
  }, [trophies, selectedCategory]);

  const categories = [
    { id: 'all', label: 'All Trophies', icon: TrophyIcon },
    { id: 'savings', label: 'Savings', icon: PiggyBank },
    { id: 'bills', label: 'Bills', icon: CreditCard },
    { id: 'debt', label: 'Debt', icon: Wallet },
    { id: 'general', label: 'General', icon: Star }
  ];

  const getProgressColor = (progress: number, target: number) => {
    const percentage = (progress / target) * 100;
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 75) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-gray-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <TrophyIcon className="w-6 h-6 mr-2" />
            Achievements
          </h2>
          <div className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Trophy Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTrophies?.map((trophy) => (
            <div
              key={trophy.id}
              className={`bg-white rounded-lg shadow-md overflow-hidden border ${
                trophy.achieved ? 'border-green-200' : 'border-gray-200'
              }`}
            >
              <div className={`p-4 ${trophy.achieved ? 'bg-green-50' : 'bg-gray-50'}`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">{trophy.title}</h3>
                  {trophy.achieved && (
                    <Award className="w-6 h-6 text-green-500" />
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-600">{trophy.description}</p>
              </div>

              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Progress</span>
                  <span className="text-sm text-gray-500">
                    {trophy.progress} / {trophy.target}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`${getProgressColor(trophy.progress, trophy.target)} h-2 rounded-full transition-all`}
                    style={{ width: `${Math.min((trophy.progress / trophy.target) * 100, 100)}%` }}
                  />
                </div>
                {trophy.achieved && (
                  <p className="mt-2 text-xs text-green-600">
                    Achieved on {trophy.achievedAt?.toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          ))}

          {(!filteredTrophies || filteredTrophies.length === 0) && (
            <div className="col-span-full text-center py-12 bg-white rounded-lg border border-gray-200">
              <TrophyIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No trophies yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Keep using the app to earn achievements and track your financial progress!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}