import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai'; // استدعاء مكتبة الصور الجديدة
import { MODELS } from '../config/models.js';

// إعداد مفاتيح الاتصال من بيئة Render
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY }); // مفتاحك الجديد من OpenAI

// 1️⃣ دالة توليد النص (تبقى كما هي مع Gemini ذو الكفاءة العالية)
export const generateTextDesign = async (contents) => {
  const response = await ai.models.generateContent({
    model: MODELS.TEXT,
    contents: contents,
    config: {
      systemInstruction: "أنت مساعد تصميم داخلي ذكي في منصة 'أوتاث'..."
    }
  });
  return response.text || '';
};

// 2️⃣ دالة توليد الصور (تستخدم DALL-E 3 للاستقرار والسرعة)
export const generateRoomImage = async (promptDescription) => {
  try {
    const imagePrompt = `${promptDescription}, architectural presentation, photorealistic 8k, professional interior design.`;
    
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: imagePrompt.substring(0, 1000), // DALL-E يقبل 1000 حرف كحد أقصى
      n: 1,
      size: "1024x1024",
      response_format: "b64_json",
    });

    return `data:image/jpeg;base64,${response.data[0].b64_json}`;
    
  } catch (error) {
    console.error("❌ خطأ في توليد الصورة عبر واجهة الرسم:", error);
    throw error;
  }
};
