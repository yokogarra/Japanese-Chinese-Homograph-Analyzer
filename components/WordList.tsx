import React, { useState, useEffect } from 'react';
import { HomographEntry, HomographType } from '../types';
import { AlertTriangle, CheckCircle, Info, Search, FileText, Bot, ChevronLeft, ChevronRight } from 'lucide-react';

interface WordListProps {
  data: HomographEntry[];
}

const ITEMS_PER_PAGE = 10;

export const WordList: React.FC<WordListProps> = ({ data }) => {
  const [filter, setFilter] = useState<'ALL' | HomographType>('ALL');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Reset page when filter/search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, search]);

  const filteredData = data.filter(item => {
    const matchesType = filter === 'ALL' || item.type === filter;
    const matchesSearch = item.word.includes(search) || 
                          item.cn_meaning.toLowerCase().includes(search.toLowerCase()) || 
                          item.jp_meaning.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedData = filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const getTypeColor = (type: HomographType) => {
    switch (type) {
      case HomographType.DIFFERENT: return 'bg-red-100 text-red-700 border-red-200';
      case HomographType.RELATED: return 'bg-amber-100 text-amber-700 border-amber-200';
      case HomographType.SAME: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    }
  };

  const getTypeIcon = (type: HomographType) => {
    switch (type) {
      case HomographType.DIFFERENT: return <AlertTriangle className="w-4 h-4" />;
      case HomographType.RELATED: return <Info className="w-4 h-4" />;
      case HomographType.SAME: return <CheckCircle className="w-4 h-4" />;
    }
  };

  const getLabel = (type: HomographType | 'ALL') => {
    switch (type) {
        case 'ALL': return 'すべて表示';
        case HomographType.DIFFERENT: return '意味が異なる (同形異義語)';
        case HomographType.RELATED: return '関連・ニュアンス違い';
        case HomographType.SAME: return '同じ意味';
    }
  };

  const getTypeBadgeLabel = (type: HomographType) => {
    switch (type) {
        case HomographType.DIFFERENT: return '同形異義語 (Different)';
        case HomographType.RELATED: return '関連 (Related)';
        case HomographType.SAME: return '同義 (Same)';
    }
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="単語や意味を検索..." 
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {['ALL', HomographType.DIFFERENT, HomographType.RELATED, HomographType.SAME].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type as any)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                filter === type 
                  ? 'bg-slate-800 text-white' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {getLabel(type as any)}
            </button>
          ))}
        </div>
      </div>

      {/* Results List */}
      <div className="grid grid-cols-1 gap-4">
        {paginatedData.map((item, index) => (
          <div key={index} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <div className="flex flex-col md:flex-row">
              {/* Word & Type Section */}
              <div className="p-6 md:w-1/4 bg-slate-50 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-200 min-h-[200px]">
                <h3 className="text-4xl font-bold text-slate-800 mb-2 font-serif">{item.word}</h3>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getTypeColor(item.type)}`}>
                  {getTypeIcon(item.type)}
                  {getTypeBadgeLabel(item.type)}
                </span>
              </div>

              {/* Comparison Section */}
              <div className="flex-1 p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Chinese Side */}
                <div className="space-y-3">
                  <div className="flex items-baseline justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">中国語 (CN)</span>
                    <span className="font-mono text-indigo-600 font-medium">{item.cn_pronunciation}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700 mb-1">意味</p>
                    <p className="text-slate-600">{item.cn_meaning}</p>
                  </div>
                  
                  {/* AI Example */}
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div className="flex items-center gap-1.5 mb-1 text-slate-400">
                      <Bot className="w-3 h-3" />
                      <p className="text-xs font-bold">AI例文</p>
                    </div>
                    <p className="text-sm text-slate-600 italic">"{item.cn_example}"</p>
                  </div>

                  {/* Source Context */}
                  {item.source_cn_sentence && (
                    <div className="bg-amber-50 p-3 rounded-lg border border-amber-100">
                      <div className="flex items-center gap-1.5 mb-1 text-amber-600">
                        <FileText className="w-3 h-3" />
                        <p className="text-xs font-bold">原文の用例</p>
                      </div>
                      <p className="text-sm text-slate-700 font-serif leading-relaxed">
                        ...{item.source_cn_sentence.replace(item.word, `【${item.word}】`)}...
                      </p>
                    </div>
                  )}
                </div>

                {/* Japanese Side */}
                <div className="space-y-3">
                  <div className="flex items-baseline justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">日本語 (JP)</span>
                    <span className="font-mono text-rose-600 font-medium">{item.jp_pronunciation}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700 mb-1">意味</p>
                    <p className="text-slate-600">{item.jp_meaning}</p>
                  </div>

                  {/* AI Example */}
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div className="flex items-center gap-1.5 mb-1 text-slate-400">
                      <Bot className="w-3 h-3" />
                      <p className="text-xs font-bold">AI例文</p>
                    </div>
                    <p className="text-sm text-slate-600 italic">"{item.jp_example}"</p>
                  </div>

                   {/* Source Context */}
                   {item.source_jp_sentence && (
                    <div className="bg-amber-50 p-3 rounded-lg border border-amber-100">
                      <div className="flex items-center gap-1.5 mb-1 text-amber-600">
                        <FileText className="w-3 h-3" />
                        <p className="text-xs font-bold">原文の用例</p>
                      </div>
                      <p className="text-sm text-slate-700 font-serif leading-relaxed">
                        ...{item.source_jp_sentence.replace(item.word, `【${item.word}】`)}...
                      </p>
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>
        ))}

        {filteredData.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <p className="text-lg">条件に一致する単語が見つかりませんでした。</p>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {filteredData.length > 0 && (
        <div className="flex justify-center items-center gap-4 pt-6 pb-12">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          
          <span className="text-sm font-medium text-slate-600">
            ページ {currentPage} / {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-slate-600" />
          </button>
        </div>
      )}
    </div>
  );
};