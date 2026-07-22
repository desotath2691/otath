import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn("⚠️ Warning: GEMINI_API_KEY is not set in environment variables.");
}

// تهيئة العميل الخاص بالمكتبة @google/genai
const ai = new GoogleGenAI({ apiKey: apiKey || '' });

app.use(cors());
// إعداد الحد الأقصى لحجم الطلبات للسماح باستقبال صور Base64 كبيرة
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use(express.static(path.join(__dirname, 'public')));

// 🌟 المسار الجديد: لمعرفة النماذج المتوفرة والمتوافقة مع الـ API الخاص بك
app.get('/api/available-models', async (req, res) => {
  try {
    if (!apiKey) throw new Error("مفتاح API مفقود");
    
    // نستخدم fetch المدمج في Node.js للاتصال بنقطة النهاية الخاصة بقائمة النماذج
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    
    // استخراج أسماء النماذج فقط وإرسالها
    const modelNames = data.models ? data.models.map(m => m.name) : [];
    res.json({ success: true, count: modelNames.length, models: modelNames });
  } catch (error) {
    res.status(500).json({ success: false, error: 'تعذر جلب قائمة النماذج', details: error.message });
  }
});

app.post('/api/generate-design', async (req, res) => {
  try {
    // التحقق من وجود مفتاح API
    if (!apiKey) {
      return res.status(500).json({ success: false, error: 'مفتاح API مفقود في إعدادات الخادم.' });
    }

    const {
      prompt,
      image,
      imageData,
      roomType,
      style,
      colors,
      budget,
      additionalNotes
    } = req.body;

    const parseBase64Image = (rawImage) => {
      if (!rawImage) return null;
      let mimeType = 'image/jpeg';
      let data = rawImage;

      if (rawImage.includes(';base64,')) {
        const parts = rawImage.split(';base64,');
        mimeType = parts[0].replace('data:', '');
        data = parts[1];
      }
      return { inlineData: { data, mimeType } };
    };

    const imageInput = parseBase64Image(image || imageData);

    // صياغة النص الموجه لـ Gemini
    let fullPrompt = "أنت مصمم ديكور داخلي خبير ومحترف.";
    if (roomType) fullPrompt += ` نوع الغرفة: ${roomType}.`;
    if (style) fullPrompt += ` الطراز المطلوب: ${style}.`;
    if (colors) fullPrompt += ` الألوان المفضلة: ${colors}.`;
    if (budget) fullPrompt += ` الميزانية: ${budget}.`;
    if (prompt) fullPrompt += ` \nتفاصيل وتوجيهات المستخدم: ${prompt}`;
    if (additionalNotes) fullPrompt += ` \nملاحظات إضافية: ${additionalNotes}`;

    if (!prompt && !imageInput) {
      fullPrompt += " قدم اقتراحات عامة لنصائح التصميم الداخلي الحديث.";
    }

    const contents = [fullPrompt];
    if (imageInput) {
      contents.push(imageInput);
    }

    // 1️⃣ استخدام نموذج النص الحقيقي والمتوفر (يمكن تغييره إلى gemini-2.0-flash مستقبلاً)
    const textModel = 'gemini-1.5-flash';

    const textResponse = await ai.models.generateContent({
      model: textModel,
      contents: contents,
      config: {
        systemInstruction: "أنت مساعد تصميم داخلي ذكي باسم 'أثاث' (Otath). قم بتقديم اقتراحات تحسين وتأثيث الديكور باللغة العربية بأسلوب راقٍ، منظم، ومفصل."
      }
    });

    const textOutput = textResponse.text || '';

    // 2️⃣ استخدام النموذج الصحيح لتوليد الصور
    let generatedImageBase64 = null;
    const imageModel = 'imagen-3.0-generate-002';

    try {
      const imagePrompt = `A high quality, professional interior design render of a ${roomType || 'room'} in ${style || 'modern'} style, palette: ${colors || 'neutral'}, beautifully furnished and styled, architectural presentation, photorealistic 8k.`;

      const imageResponse = await ai.models.generateImages({
        model: imageModel,
        prompt: imagePrompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: '1:1',
        },
      });

      if (imageResponse.generatedImages && imageResponse.generatedImages.length > 0) {
        const base64Data = imageResponse.generatedImages[0].image.imageBytes;
        generatedImageBase64 = `data:image/jpeg;base64,${base64Data}`;
      }
    } catch (imgError) {
      console.error('⚠️ فشل توليد الصورة عبر النموذج:', imgError.message);
      // يستمر الكود حتى لو فشلت الصورة ليرجع النص على الأقل للمستخدم
    }

    // 3️⃣ إرسال الرد المكتمل للواجهة الأمامية
    return res.json({
      success: true,
      result: textOutput,
      text: textOutput,
      image: generatedImageBase64,
      modelUsed: `${textModel} + ${imageModel}`
    });

  } catch (error) {
    console.error('Error generating design:', error);
    return res.status(500).json({
      success: false,
      error: 'حدث خطأ أثناء معالجة الطلب عبر Gemini API',
      details: error.message
    });
  }
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'Otath Backend', 
    models: ['gemini-1.5-flash', 'imagen-3.0-generate-002'], 
    apiKeyConfigured: !!process.env.GEMINI_API_KEY 
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log('📱 Gemini SDK configured with valid API models');
});
