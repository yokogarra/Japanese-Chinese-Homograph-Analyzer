import React from 'react';
import { BookOpen } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">日中同形語アナライザー</h1>
            <p className="text-xs text-slate-500">AI活用 日中・中日比較辞書ジェネレーター</p>
          </div>
        </div>
        <div className="text-sm text-slate-500 hidden sm:block">
          Developed by Chenwen Huang
        </div>
      </div>
    </header>
  );
};