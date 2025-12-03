import React from 'react';
import { ProcessingStats } from '../types';
import { FileText, Link2, Languages } from 'lucide-react';

interface StatsCardProps {
  stats: ProcessingStats;
}

export const StatsCard: React.FC<StatsCardProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
        <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
          <Languages className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm text-slate-500 font-medium">検出された中国語単語</p>
          <p className="text-2xl font-bold text-slate-800">{stats.cnWordCount.toLocaleString()}</p>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
        <div className="p-3 bg-red-50 text-red-600 rounded-lg">
          <Languages className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm text-slate-500 font-medium">検出された日本語単語</p>
          <p className="text-2xl font-bold text-slate-800">{stats.jpWordCount.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
          <Link2 className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm text-slate-500 font-medium">共通する単語（同形語）</p>
          <p className="text-2xl font-bold text-slate-800">{stats.intersectionCount.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};