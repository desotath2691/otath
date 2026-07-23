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

// دالة توليد ودمج الصور مع تعليمات صارمة للحفاظ على الغرفة والأثاث
export const generateRoomImage = async (promptDescription, roomImageBase64 = null) => {
  try {
    const contents = [];

    // إرفاق صورة الغرفة الأصلية إن وجدت
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

    // تعليمات صارمة وحادة تمنع النموذج من تغيير الغرفة أو تشويه شكل الأثاث
    const imagePrompt = roomImageBase64
      ? `Strict Image Editing Task: 
1. You MUST preserve the exact room architecture, walls, flooring, windows, and perspective from the reference image without any alteration. Do not change the room layout.
2. Place the exact furniture described below into the room precisely as specified, maintaining their exact shapes, proportions, and material details (such as chenille fabric) without inventing new or random designs: ${promptDescription}. 
Photorealistic 8k, professional interior design render, seamless composition.`
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
