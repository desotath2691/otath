import { GoogleGenAI } from '@google/genai';
import { MODELS } from '../config/models.js';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn("⚠️ Warning: GEMINI_API_KEY is not set in environment variables.");
}

// قمنا هنا بإضافة الفكرة التي وجدتيها لإجبار الخادم على استخدام الإصدار v1
const ai = new GoogleGenAI({ 
  apiKey: apiKey || '',
  httpOptions: { apiVersion: "v1" } 
});

// دالة توليد النص
export const generateTextDesign = async (contents) => {
  const response = await ai.models.generateContent({
    model: MODELS.TEXT,
    contents: contents,
    config: {
      systemInstruction: "أنت مساعد تصميم داخلي ذكي باسم 'أوتاث' (Otath). قم بتقديم اقتراحات تحسين وتأثيث الديكور باللغة العربية بأسلوب راقٍ، منظم، ومفصل."
    }
  });
  return response.text || '';
};

// دالة توليد الصور
export const generateRoomImage = async (promptDescription) => {
  try {
    const imagePrompt = typeof promptDescription === 'string' 
      ? `${promptDescription}, architectural presentation, photorealistic 8k.` 
      : `A high quality, professional interior design render, modern style, photorealistic 8k.`;

    const imageResponse = await ai.models.generateImages({
      model: MODELS.IMAGE,
      prompt: imagePrompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: '1:1',
      },
    });

    if (imageResponse.generatedImages && imageResponse.generatedImages.length > 0) {
      const base64Data = imageResponse.generatedImages[0].image.imageBytes;
      return `data:image/jpeg;base64,${base64Data}`;
    }
    return null;
  } catch (error) {
    console.warn("⚠️ تم تجاوز خطوة الصورة مؤقتاً لتجنب تعليق الواجهة:", error.message);
    return null; 
  }
};
