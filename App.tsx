import React, { useState, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { StatsCard } from './components/StatsCard';
import { WordList } from './components/WordList';
import { analyzeHomographs } from './services/geminiService';
import { AppStatus, HomographEntry, ProcessingStats } from './types';
import { UploadCloud, FileType, Loader2, AlertCircle, Files } from 'lucide-react';

// Regular expression to match CJK characters. 
// \u4E00-\u9FFF covers the main block of CJK Unified Ideographs.
// We look for words with 2 or more characters.
const CJK_REGEX = /[\u4E00-\u9FFF]{2,}/g;

// Helper to find the sentence containing the word
const findSentence = (text: string, word: string): string | undefined => {
  const index = text.indexOf(word);
  if (index === -1) return undefined;
  
  // Look backwards for sentence delimiters
  let start = index;
  const delimiters = ['。', '！', '？', '\n', '!', '?', '…'];
  
  // Safety cap of 100 chars backwards
  let steps = 0;
  while (start > 0 && !delimiters.includes(text[start - 1]) && steps < 100) {
    start--;
    steps++;
  }
  
  // Look forward for sentence delimiters
  let end = index;
  steps = 0;
  // Safety cap of 150 chars forwards
  while (end < text.length && !delimiters.includes(text[end]) && steps < 150) {
    end++;
    steps++;
  }
  
  // Clean up the result
  return text.substring(start, end + 1).replace(/\s+/g, ' ').trim();
}

function App() {
  const [status, setStatus] = useState<AppStatus>('IDLE');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [data, setData] = useState<HomographEntry[]>([]);
  const [stats, setStats] = useState<ProcessingStats>({
    cnWordCount: 0,
    jpWordCount: 0,
    intersectionCount: 0,
    processedCount: 0
  });

  const cnFileRef = useRef<HTMLInputElement>(null);
  const jpFileRef = useRef<HTMLInputElement>(null);

  // Store FileList or null
  const [cnFiles, setCnFiles] = useState<FileList | null>(null);
  const [jpFiles, setJpFiles] = useState<FileList | null>(null);

  const handleFileChange = (lang: 'CN' | 'JP', e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      if (lang === 'CN') setCnFiles(e.target.files);
      else setJpFiles(e.target.files);
    }
  };

  const getFilesDisplayText = (files: FileList | null, placeholder: string) => {
    if (!files || files.length === 0) return placeholder;
    if (files.length === 1) return files[0].name;
    return `${files.length} 個のファイルを選択中`;
  };

  const readAllFiles = async (files: FileList | null): Promise<string> => {
    if (!files) return "";
    const promises = Array.from(files).map(file => file.text());
    const texts = await Promise.all(promises);
    return texts.join("\n");
  };

  const processFiles = useCallback(async () => {
    if (!cnFiles || !jpFiles) {
      setErrorMsg("中国語と日本語のファイルを両方アップロードしてください。");
      return;
    }

    setStatus('READING_FILES');
    setErrorMsg(null);

    try {
      // 1. Read Files (Concatenate multiple files)
      const [cnText, jpText] = await Promise.all([
        readAllFiles(cnFiles),
        readAllFiles(jpFiles)
      ]);

      // 2. Local Extraction (Pre-processing)
      // This is crucial to save tokens. We extract potential words locally first.
      const cnMatches: string[] = cnText.match(CJK_REGEX) || [];
      const jpMatches: string[] = jpText.match(CJK_REGEX) || [];

      const cnSet = new Set<string>(cnMatches);
      const jpSet = new Set<string>(jpMatches);

      // 3. Find Intersection (Words appearing in both)
      // We filter for intersection because we specifically want "homographs".
      const intersection: string[] = [...cnSet].filter(word => jpSet.has(word));

      setStats({
        cnWordCount: cnSet.size,
        jpWordCount: jpSet.size,
        intersectionCount: intersection.length,
        processedCount: 0
      });

      if (intersection.length === 0) {
        setErrorMsg("指定されたファイル間で共通する漢字語彙が見つかりませんでした。");
        setStatus('IDLE');
        return;
      }

      // 4. Send to Gemini
      setStatus('ANALYZING');
      // Note: analyzeHomographs inside handles limiting the batch size for the demo
      const results = await analyzeHomographs(intersection);
      
      // 5. Post-processing: Attach source sentences
      // Now that we know which words were analyzed, we find them in the original text
      const enrichedResults = results.map(item => ({
        ...item,
        source_cn_sentence: findSentence(cnText, item.word),
        source_jp_sentence: findSentence(jpText, item.word)
      }));

      setData(enrichedResults);
      setStats(prev => ({ ...prev, processedCount: results.length }));
      setStatus('COMPLETE');

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "予期せぬエラーが発生しました。");
      setStatus('ERROR');
    }
  }, [cnFiles, jpFiles]);

  const reset = () => {
    setStatus('IDLE');
    setData([]);
    setCnFiles(null);
    setJpFiles(null);
    if (cnFileRef.current) cnFileRef.current.value = '';
    if (jpFileRef.current) jpFileRef.current.value = '';
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Intro Section */}
        <div className="mb-8 text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-800 mb-4">日中同形語（同形異義語）を発見する</h2>
          <p className="text-slate-600">
            中国語と日本語のテキストファイル（Wikipediaのダンプなど）をアップロードしてください。
            AIが共通する漢字語彙を抽出し、意味の違いや「同形異義語」を自動的に分析・辞書化します。
          </p>
        </div>

        {/* Upload Section */}
        {status === 'IDLE' || status === 'ERROR' ? (
          <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              
              {/* Chinese Input */}
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-slate-700">中国語のソースファイル (.txt)</label>
                <div 
                  className="border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-indigo-400 hover:bg-indigo-50 transition-colors cursor-pointer relative group"
                  onClick={() => cnFileRef.current?.click()}
                >
                  <input 
                    type="file" 
                    accept=".txt" 
                    multiple
                    ref={cnFileRef} 
                    onChange={(e) => handleFileChange('CN', e)}
                    className="hidden" 
                  />
                  <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    {cnFiles && cnFiles.length > 1 ? <Files className="w-6 h-6" /> : <FileType className="w-6 h-6" />}
                  </div>
                  <p className="text-sm font-medium text-slate-700">
                    {getFilesDisplayText(cnFiles, "クリックしてファイルをアップロード")}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">複数選択可 (.txt)</p>
                </div>
              </div>

              {/* Japanese Input */}
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-slate-700">日本語のソースファイル (.txt)</label>
                <div 
                  className="border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-rose-400 hover:bg-rose-50 transition-colors cursor-pointer relative group"
                  onClick={() => jpFileRef.current?.click()}
                >
                  <input 
                    type="file" 
                    accept=".txt" 
                    multiple
                    ref={jpFileRef} 
                    onChange={(e) => handleFileChange('JP', e)}
                    className="hidden" 
                  />
                  <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                     {jpFiles && jpFiles.length > 1 ? <Files className="w-6 h-6" /> : <FileType className="w-6 h-6" />}
                  </div>
                  <p className="text-sm font-medium text-slate-700">
                    {getFilesDisplayText(jpFiles, "クリックしてファイルをアップロード")}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">複数選択可 (.txt)</p>
                </div>
              </div>

            </div>

            {errorMsg && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">{errorMsg}</p>
              </div>
            )}

            <button
              onClick={processFiles}
              disabled={!cnFiles || !jpFiles}
              className="w-full py-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-bold text-lg shadow-lg shadow-slate-200 transition-all flex items-center justify-center gap-2"
            >
              <UploadCloud className="w-5 h-5" />
              分析を開始
            </button>
          </div>
        ) : null}

        {/* Loading State */}
        {(status === 'READING_FILES' || status === 'ANALYZING') && (
          <div className="max-w-xl mx-auto text-center py-20">
            <div className="relative w-20 h-20 mx-auto mb-8">
              <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
              <Loader2 className="absolute inset-0 m-auto w-8 h-8 text-indigo-600 animate-pulse" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">
              {status === 'READING_FILES' ? 'テキストをスキャン中...' : 'Geminiが分析中...'}
            </h3>
            <p className="text-slate-500">
              {status === 'READING_FILES' 
                ? 'ファイルから漢字語彙を抽出しています。' 
                : `${stats.intersectionCount} 個の共通語彙の意味を照合・分析しています。`}
            </p>
            {status === 'ANALYZING' && (
               <p className="text-xs text-indigo-500 mt-4 font-mono bg-indigo-50 inline-block px-3 py-1 rounded-full">
                 Optimization: デモ用に上位50単語を優先分析します
               </p>
            )}
          </div>
        )}

        {/* Results Dashboard */}
        {status === 'COMPLETE' && (
          <div className="animate-fade-in-up">
            <div className="flex justify-between items-end mb-6">
              <h2 className="text-2xl font-bold text-slate-800">分析結果</h2>
              <button onClick={reset} className="text-sm text-indigo-600 hover:underline font-medium">
                新しい分析を始める
              </button>
            </div>
            
            <StatsCard stats={stats} />
            <WordList data={data} />
          </div>
        )}

      </main>
    </div>
  );
}

export default App;