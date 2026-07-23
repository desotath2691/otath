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

// دالة دمج الأثاث مع تطبيق القواعد الصارمة (Strict Rules)
export const generateRoomImage = async (promptDescription, roomImageBase64 = null) => {
  try {
    const contents = [];

    // 1. إرفاق صورة الغرفة الأصلية
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

    // 2. القواعد الصارمة التي كتبتها (تم إدراجها كدستور للنموذج)
    const strictRules = `You are an AI interior designer specialized in photorealistic furniture placement.
Your task is to place ONLY the selected furniture products from our store into the customer's uploaded room image.

STRICT RULES (MUST FOLLOW):
1. DO NOT modify the customer's room in any way.
   - Do not change the room dimensions.
   - Do not change the camera angle.
   - Do not crop or zoom.
   - Do not change walls, floor, ceiling, windows, doors, lighting, or decorations.
   - Preserve the original perspective exactly.

2. DO NOT modify the selected furniture product.
   - Preserve the exact shape.
   - Preserve the exact dimensions and proportions.
   - Preserve the exact color.
   - Preserve the exact fabric texture and material.
   - Preserve every design detail.
   - Do not redesign, simplify, or enhance the product.

3. Place the furniture at realistic scale.
   - Maintain correct real-world proportions relative to the room.
   - Furniture must not appear too large or too small.
   - Respect perspective and depth.

4. Generate realistic contact shadows and natural lighting that match the original room.

5. Do not invent furniture that was not selected.

6. Do not remove existing room objects unless absolutely necessary because of furniture placement.

7. If multiple products are selected, arrange them in a realistic interior design layout while respecting walking space.

8. The final image must look like a real photograph, not an AI-generated rendering.

Priority order:
1. Preserve the customer's room exactly.
2. Preserve the product exactly.
3. Add realistic placement only.

Goal:
Create a photorealistic visualization showing exactly how the selected furniture would look inside the customer's real room without altering either the room or the furniture.

SELECTED FURNITURE TO INSERT: ${promptDescription}`;

    const imagePrompt = roomImageBase64 
      ? strictRules 
      : `A high quality, professional interior design render, modern style, photorealistic 8k, showing: ${promptDescription}`;

    // 3. إرسال الصورة والقواعد الصارمة للنموذج
    contents.push(imagePrompt);

    const response = await ai.models.generateContent({
      model: MODELS.IMAGE,
      contents: contents,
    });

    // 4. استخراج الصورة بدقة
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
