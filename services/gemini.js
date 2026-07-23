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

// دالة دمج الأثاث بدقة مطلقة دون تغيير أو إضافة عناصر عشوائية
export const generateRoomImage = async (promptDescription, roomImageBase64 = null) => {
  try {
    const contents = [];

    // إرفاق صورة الغرفة الأصلية للعميل
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

    // تعليمات صارمة تمنع إضافة أي قطع أخرى وتمنع تغير شكل الأثاث أو لونه
    const imagePrompt = roomImageBase64
      ? `Strict Virtual Staging Task:
1. Preserve the user's uploaded room image (walls, floor, space, perspective) 100% as it is. Do NOT change the room layout.
2. Insert ONLY the exact selected furniture piece described here: ${promptDescription}. 
3. Do NOT add any extra furniture, tables, plants, or random items. Only the specified piece.
4. Do NOT alter, modify, or redesign the shape, style, color, or fabric (such as chenille) of the selected furniture piece. Keep its exact design faithful to the description.
Photorealistic 8k, seamless and natural blending.`
      : `A high quality, professional interior design render, modern style, photorealistic 8k, showing: ${promptDescription}`;

    contents.push(imagePrompt);

    const response = await ai.models.generateContent({
      model: MODELS.IMAGE,
      contents: contents,
    });

    // استخراج الصورة المولدة بدقة
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
