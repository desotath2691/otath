import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import { MODELS } from '../config/models.js';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn("⚠️ Warning: GEMINI_API_KEY is not set in environment variables.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || '' });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' });

// دالة توليد النص
export const generateTextDesign = async (contents) => {
  const response = await ai.models.generateContent({
    model: MODELS.TEXT,
    contents: contents,
    config: {
      systemInstruction: "أنت مساعد تصميم داخلي ذكي في منصة 'أوتاث' (Otath). هدفك تقديم حلول أتمتة وتوزيع ذكي للأثاث. قم بتقديم اقتراحات تحسين الديكور باللغة العربية بأسلوب راقٍ، منظم، ومفصل."
    }
  });
  return response.text || '';
};

// دالة توليد ودمج الصور عبر DALL-E 3
export const generateRoomImage = async (promptDescription) => {
  try {
    const imagePrompt = `${promptDescription}, architectural presentation, photorealistic 8k, professional interior design render.`;
    
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: imagePrompt.substring(0, 1000), 
      n: 1,
      size: "1024x1024"
    });

    if (response.data && response.data.length > 0) {
      return response.data[0].url;
    }
    return null;
    
  } catch (error) {
    console.error("❌ خطأ في توليد الصورة:", error);
    throw error;
  }
};
