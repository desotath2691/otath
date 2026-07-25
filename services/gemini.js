import { GoogleGenAI } from '@google/genai';
import { MODELS } from '../config/models.js';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn("⚠️ Warning: GEMINI_API_KEY is not set in environment variables.");
}

const ai = new GoogleGenAI({ 
  apiKey: apiKey || ''
});

// دالة توليد النص واقتراحات التصميم الداخلي فقط (بدون توليد صور وهمية)
export const generateTextDesign = async (contents) => {
  try {
    const response = await ai.models.generateContent({
      model: MODELS.TEXT,
      contents: contents,
      config: {
        systemInstruction: "أنت مساعد تصميم داخلي ذكي باسم 'أوتاث' (Otath). قم بتقديم اقتراحات تحسين وتأثيث الديكور باللغة العربية بأسلوب راقٍ، منظم، ومفصل."
      }
    });
    return response.text || '';
  } catch (error) {
    console.warn("⚠️ خطأ في توليد النص:", error.message);
    return '';
  }
};
