export enum HomographType {
  SAME = 'SAME', // Same meaning (e.g., 学生)
  RELATED = 'RELATED', // Related but nuance differs (e.g., 先生 - Teacher vs Mr/Doctor)
  DIFFERENT = 'DIFFERENT' // False Friends (e.g., 手紙 - Toilet paper vs Letter)
}

export interface HomographEntry {
  word: string;
  cn_pronunciation: string; // Pinyin
  jp_pronunciation: string; // Hiragana/Katakana
  cn_meaning: string;
  jp_meaning: string;
  type: HomographType;
  cn_example: string;
  jp_example: string;
  source_cn_sentence?: string; // Context from the actual uploaded file
  source_jp_sentence?: string; // Context from the actual uploaded file
}

export interface ProcessingStats {
  cnWordCount: number;
  jpWordCount: number;
  intersectionCount: number;
  processedCount: number;
}

export type AppStatus = 'IDLE' | 'READING_FILES' | 'ANALYZING' | 'COMPLETE' | 'ERROR';