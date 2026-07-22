import { GoogleGenAI } from '@google/genai';
import { MODELS } from '../config/models.js';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn(
    "⚠️ Warning: GEMINI_API_KEY is not set in environment variables."
  );
}

const ai = new GoogleGenAI({
  apiKey: apiKey || '',
  httpOptions: {
    apiVersion: 'v1',
  },
});

// ===============================
// توليد النص
// ===============================
export const generateTextDesign = async (contents) => {
  const response = await ai.models.generateContent({
    model: MODELS.TEXT,
    contents: contents,
    config: {
      systemInstruction:
        "أنت مساعد تصميم داخلي ذكي باسم 'أوتاث' (Otath). قم بتقديم اقتراحات تحسين وتأثيث الديكور باللغة العربية بأسلوب راقٍ، منظم، ومفصل.",
    },
  });

  return response.text || '';
};

// ===============================
// توليد الصور
// ===============================
export const generateRoomImage = async (promptDescription) => {
  try {
    const imagePrompt =
      typeof promptDescription === 'string'
        ? `${promptDescription}, architectural presentation, photorealistic, high quality.`
        : 'A high quality professional interior design render, modern style, photorealistic.';

    const response = await ai.models.generateContent({
      model: MODELS.IMAGE,
      contents: imagePrompt,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    const parts = response.candidates?.[0]?.content?.parts || [];

    for (const part of parts) {
      if (part.inlineData?.data) {
        const mimeType = part.inlineData.mimeType || 'image/png';

        return `data:${mimeType};base64,${part.inlineData.data}`;
      }
    }

    console.warn('⚠️ لم يتم العثور على صورة في استجابة النموذج.');
    return null;
  } catch (error) {
    console.warn(
      '⚠️ تم تجاوز خطوة الصورة مؤقتاً لتجنب تعليق الواجهة:',
      error
    );

    return null;
  }
};
