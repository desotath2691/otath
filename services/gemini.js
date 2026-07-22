import { GoogleGenAI } from '@google/genai';
import { MODELS } from '../config/models.js';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn("⚠️ Warning: GEMINI_API_KEY is not set in environment variables.");
}

// الاتصال المباشر والأساسي بجوجل (بدون إضافات v1 التي تسبب أخطاء فارغة)
const ai = new GoogleGenAI({ apiKey: apiKey || '' });

// 1. دالة توليد النص (تعمل بكفاءة)
export const generateTextDesign = async (contents) => {
  const response = await ai.models.generateContent({
    model: MODELS.TEXT,
    contents: contents,
    config: {
      systemInstruction: "أنت مساعد تصميم داخلي ذكي باسم 'أوتاث' (Otath). هدفك تقديم حلول أتمتة وتوزيع ذكي للأثاث. قم بتقديم اقتراحات تحسين الديكور باللغة العربية بأسلوب راقٍ، منظم، ومفصل."
    }
  });
  return response.text || '';
};

// 2. دالة توليد الصور (محمية بالكامل لتجنب قيود جوجل الحالية)
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
    // التقاط الخطأ بأمان إذا استمرت جوجل في الحجب، لكي لا ينهار موقع أوتاث
    console.warn("⚠️ تم تجاوز خطوة الصورة بسبب قيود مفتاح Google:", error.message);
    return null; 
  }
};
