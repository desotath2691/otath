import { GoogleGenAI } from '@google/genai';
import { MODELS } from '../config/models.js';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn("⚠️ Warning: GEMINI_API_KEY is not set in environment variables.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || '' });

// دالة توليد النص
export const generateTextDesign = async (contents) => {
  const response = await ai.models.generateContent({
    model: MODELS.TEXT,
    contents: contents,
    config: {
      // تم دمج الهوية الصحيحة للمنصة لتقديم تجربة أتمتة متكاملة
      systemInstruction: "أنت مساعد تصميم داخلي ذكي للمصمم الآلي في منصة 'أوتاث' (Otath). هدفك تقديم حلول أتمتة وتوزيع ذكي للأثاث. قم بتقديم اقتراحات تحسين الديكور باللغة العربية بأسلوب راقٍ، منظم، ومفصل."
    }
  });
  return response.text || '';
};

// دالة توليد ودمج الصور
export const generateRoomImage = async (promptDescription) => {
  // استخدام الموجه النصي الجاهز مباشرة وتغليفه بلمسات واقعية
  const imagePrompt = `${promptDescription}, architectural presentation, photorealistic 8k, highly detailed, professional interior design render.`;
  
  const MAX_RETRIES = 3;
  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    try {
      const imageResponse = await ai.models.generateImages({
        model: MODELS.IMAGE,
        // قص النص في حال كان طويلاً جداً لتجنب رفض خوادم جوجل (503)
        prompt: imagePrompt.substring(0, 3000), 
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
      if (error.status === 503 || error.status === 'UNAVAILABLE') {
        attempt++;
        console.warn(`⏳ خوادم الصور مزدحمة. جاري إعادة المحاولة للمرة ${attempt}...`);
        
        // إذا استنفدنا المحاولات، نمرر الخطأ للواجهة
        if (attempt === MAX_RETRIES) throw error; 
        
        // الانتظار قبل المحاولة التالية (2 ثانية، ثم 4 ثوانٍ...)
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
      } else {
        console.error("❌ خطأ في توليد الصورة:", error);
        throw error;
      }
    }
  }
};
