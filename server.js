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

// تهيئة العميل الخاص بالمكتبة الجديدة @google/genai
const ai = new GoogleGenAI({ apiKey: apiKey || '' });

app.use(cors());
// إعداد الحد الأقصى لحجم الطلبات للسماح باستقبال صور Base64 كبيرة
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/generate-design', async (req, res) => {
  try {
    // التحقق من وجود مفتاح API قبل محاولة الاتصال
    if (!apiKey) {
      return res.status(500).json({ success: false, error: 'مفتاح API غير مفقود في إعدادات الخادم.' });
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

      // فصل نوع البيانات (MimeType) عن بيانات الصورة (Base64)
      if (rawImage.includes(';base64,')) {
        const parts = rawImage.split(';base64,');
        mimeType = parts[0].replace('data:', '');
        data = parts[1];
      }
      return { inlineData: { data, mimeType } };
    };

    const imageInput = parseBase64Image(image || imageData);

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

    // الطريقة المثلى لتمرير المحتوى المدمج (نص + صورة) في المكتبة الجديدة
    const contents = [];
    contents.push(fullPrompt); // إضافة النص

    if (imageInput) {
      contents.push(imageInput); // إضافة الصورة إن وجدت
    }

   const selectedModel = 'gemini-flash';

const response = await ai.models.generateContent({
  model: selectedModel,
  contents: contents,
  config: {
    systemInstruction: "أنت مساعد تصميم داخلي ذكي باسم 'أثاث' (Otath). قم بتقديم اقتراحات تحسين وتأثيث الديكور باللغة العربية بأسلوب راقٍ، منظم، ومفصل."
  }
});

    // جلب النص النهائي من الرد
    const textOutput = response.text || '';

    // 🔴 تم إزالة الكود الخاص باستخراج الصورة المولدّة هنا 🔴
    // لأن نماذج Gemini (مثل 2.5-flash) تولد نصوصاً فقط ولا تولد صوراً.
    // إذا كنت تريد توليد صورة بناءً على الوصف، ستحتاج لاستدعاء نموذج Imagen (imagen-3.0-generate-002) في طلب منفصل.

    return res.json({
      success: true,
      result: textOutput,
      text: textOutput,
      // نترك حقل الصورة فارغاً لتجنب إرسال أخطاء أو بيانات غير موجودة للواجهة الأمامية
      image: null, 
      modelUsed: selectedModel
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
    model: 'gemini-2.5-flash',
    apiKeyConfigured: !!process.env.GEMINI_API_KEY 
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📱 Gemini SDK configured with model: gemini-2.5-flash`);
});
