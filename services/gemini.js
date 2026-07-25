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

// دالة تحليل الغرفة وتوليد الصورة المربعة بصرامة
export const generateRoomImage = async (promptDescription, roomImageBase64 = null) => {
  try {
    let roomDescription = "a modern living room with neutral walls and flooring";

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

    // 👈 هنا قمنا بتغيير جذري في الأوامر لإجبار النموذج على المقاس المربع
    const finalPrompt = `[FORMAT: PERFECT 1:1 SQUARE IMAGE]. A perfectly square, photorealistic 8k interior design render. 
Room characteristics: ${roomDescription}. 
Placed naturally inside this room is ONLY this furniture piece: ${promptDescription}.
Strict Rules:
- YOU MUST GENERATE A 1:1 SQUARE IMAGE.
- Do NOT alter the room's walls or layout.
- Preserve the exact shape, color, and chenille fabric texture of the selected furniture.
- Professional lighting and realistic contact shadows.`;

    const response = await ai.models.generateContent({
      model: MODELS.IMAGE,
      contents: [finalPrompt],
      config: {
        aspectRatio: "1:1" // التأكيد البرمجي
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
