import { GoogleGenAI } from '@google/genai';

// تهيئة العميل باستخدام مفتاح الـ API من متغيرات البيئة
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// دالة توليد النص (العقل التحليلي)
export async function generateTextDesign(promptText) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: promptText,
    });
    return response.text;
  } catch (error) {
    console.error("خطأ في توليد النص:", error);
    throw error;
  }
}

// دالة توليد الصور (الفنان)
export async function generateRoomImage(promptDescription) {
  try {
    const response = await ai.models.generateImages({
      model: 'imagen-3.0-generate-001',
      prompt: promptDescription,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: '1:1',
      },
    });

    // استخراج الصورة المולدة بصيغة Base64
    const base64ImageBytes = response.generatedImages[0].image.imageBytes;
    return `data:image/jpeg;base64,${base64ImageBytes}`;
    
  } catch (error) {
    console.error("خطأ في توليد الصورة:", error);
    throw error;
  }
}
