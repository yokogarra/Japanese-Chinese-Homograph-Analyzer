import { GoogleGenAI, Type, Schema } from "@google/genai";
import { HomographEntry, HomographType } from "../types";

// Initialize Gemini Client
// Note: In a production environment, ensure the key is handled securely.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const modelId = "gemini-2.5-flash";

const responseSchema: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      word: { type: Type.STRING },
      cn_pronunciation: { type: Type.STRING, description: "Chinese Pinyin" },
      jp_pronunciation: { type: Type.STRING, description: "Japanese Furigana/Reading" },
      cn_meaning: { type: Type.STRING, description: "Meaning of the word in Chinese context, EXPLAINED IN JAPANESE." },
      jp_meaning: { type: Type.STRING, description: "Meaning of the word in Japanese context, EXPLAINED IN JAPANESE." },
      type: { 
        type: Type.STRING, 
        enum: [HomographType.SAME, HomographType.RELATED, HomographType.DIFFERENT],
        description: "Relationship between meanings. DIFFERENT implies the meanings are completely different (False Friends/同形異義語)."
      },
      cn_example: { type: Type.STRING, description: "A short example sentence in Chinese containing the word." },
      jp_example: { type: Type.STRING, description: "A short example sentence in Japanese containing the word." }
    },
    required: ["word", "cn_pronunciation", "jp_pronunciation", "cn_meaning", "jp_meaning", "type", "cn_example", "jp_example"]
  }
};

export const analyzeHomographs = async (wordList: string[]): Promise<HomographEntry[]> => {
  if (wordList.length === 0) return [];

  // We process in chunks to avoid overwhelming the context window if the list is huge,
  // although gemini-2.5-flash has a large window, structured output is better in manageable batches.
  // For this demo, we will take the top 50 words to ensure speed and reliability.
  const wordsToAnalyze = wordList.slice(0, 50); 

  const prompt = `
    You are a professional linguist specializing in Comparative CJK (Chinese-Japanese-Korean) studies.
    The user is a Japanese speaker interested in Chinese.
    
    I have a list of Kanji/Hanzi words that were found in both Chinese and Japanese text files.
    Please analyze each word in the provided list.
    
    For each word:
    1. Provide the Chinese Pinyin and Japanese Reading (Hiragana).
    2. Define the meaning in Chinese and the meaning in Japanese. **IMPORTANT: Write the definitions in JAPANESE.**
    3. Classify the relationship:
       - SAME: Meanings are effectively identical (e.g., "科学").
       - RELATED: Meanings are related or overlap, but have nuance differences or one is broader (e.g., "先生").
       - DIFFERENT: Complete "False Friends" (同形異義語) where meanings are drastically different (e.g., "手纸" means toilet paper in CN vs letter in JP, "爱人" means spouse in CN vs mistress in JP, "娘" means mother in CN vs daughter in JP).
    4. Provide a very short, simple example sentence for both languages to demonstrate the usage.

    The list of words to analyze is:
    ${JSON.stringify(wordsToAnalyze)}
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.2, // Low temperature for factual linguistic accuracy
      }
    });

    if (response.text) {
      const data = JSON.parse(response.text) as HomographEntry[];
      return data;
    }
    return [];
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw new Error("Failed to analyze vocabulary with Gemini.");
  }
};