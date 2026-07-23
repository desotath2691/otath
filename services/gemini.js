import { GoogleGenAI } from '@google/genai';
import { MODELS } from '../config/models.js';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn("⚠️ Warning: GEMINI_API_KEY is not set in environment variables.");
}

const ai = new GoogleGenAI({ 
  apiKey: apiKey || ''
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

// دالة توليد ودمج الصور مع الحفاظ على الغرفة الأصلية
export const generateRoomImage = async (promptDescription, roomImageBase64 = null) => {
  try {
    const contents = [];

    // إذا رفع العميل صورة الغرفة، نقوم بتجهيزها وإضافتها للطلب ليحافظ الذكاء الاصطناعي على المساحة
    if (roomImageBase64) {
      const matches = roomImageBase64.match(/^data:(.+);base64,(.+)$/);
      if (matches) {
        contents.push({
          inlineData: {
            mimeType: matches[1],
            data: matches[2]
          }
        });
      }
    }

    // صياغة التعليمات بدقة ليحافظ النموذج على الغرفة الأصلية ويعدلها بقطع الأثاث المطلوبة
    const imagePrompt = roomImageBase64
      ? `Maintain the exact room layout, walls, flooring, and structure from the provided reference image. Professionally integrate and place the following furniture/design inside this exact room: ${promptDescription}, photorealistic 8k interior design, seamless blending.`
      : `A high quality, professional interior design render, modern style, photorealistic 8k, showing: ${promptDescription}`;

    contents.push(imagePrompt);

    const response = await ai.models.generateContent({
      model: MODELS.IMAGE,
      contents: contents,
    });

    // استخراج الصورة المودجة بدقة
    const candidate = response.candidates?.[0];
    if (candidate?.content?.parts) {
      for (const part of candidate.content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:${part.inlineData.mimeType || 'image/jpeg'};base64,${part.inlineData.data}`;
        }
      }
    }
    
    return null;
  } catch (error) {
    console.warn("⚠️ تم تجاوز خطوة الصورة مؤقتاً لتجنب تعليق الواجهة:", error.message);
    return null; 
  }
};
