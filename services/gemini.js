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

// دالة تحليل الغرفة وتوليد الصورة بدقة مطابقة
export const generateRoomImage = async (promptDescription, roomImageBase64 = null) => {
  try {
    let roomDescription = "a modern living room with neutral walls and flooring";

    // الخطوة 1: إذا رفع العميل صورة غرفته، نقوم بتحليلها أولاً عبر نموذج الذكاء البصري
    if (roomImageBase64) {
      const matches = roomImageBase64.match(/^data:(.+);base64,(.+)$/);
      const mimeType = matches ? matches[1] : 'image/jpeg';
      const data = matches ? matches[2] : roomImageBase64;

      const visionResponse = await ai.models.generateContent({
        model: MODELS.TEXT,
        contents: [
          {
            inlineData: { mimeType, data }
          },
          "Analyze this room image and describe its exact interior style, wall color, flooring type, and lighting in English concisely."
        ]
      });
      
      if (visionResponse.text) {
        roomDescription = visionResponse.text;
      }
    }

    // الخطوة 2: صياغة أمر دقيق يدمج تفاصيل غرفة العميل الحقيقية مع قطعة الأثاث المختارة
    const finalPrompt = `A photorealistic 8k interior design render, showing a room with these exact characteristics: ${roomDescription}. 
Placed naturally inside this room is ONLY the following furniture product from our store: ${promptDescription}.
Strict Rules:
- Do NOT alter the room's walls, floor, or layout style described above.
- Preserve the exact shape, color, and chenille fabric texture of the selected furniture.
- Professional lighting, realistic contact shadows, real photograph quality.`;

    // الخطوة 3: إرسال الوصف الشامل لنموذج توليد الصور
    const response = await ai.models.generateContent({
      model: MODELS.IMAGE,
      contents: [finalPrompt],
      config: {
        aspectRatio: "1:1" // 👈 هذا السطر يجبر الذكاء الاصطناعي على توليد صورة مربعة
      }
    });

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
    console.warn("⚠️ خطأ في توليد الصورة:", error.message);
    return null; 
  }
};
