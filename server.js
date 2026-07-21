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
  console.warn("⚠️ تحذير: مفتاح GEMINI_API_KEY غير مُعرّف في متغيرات البيئة.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || '' });

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/generate-design', async (req, res) => {
  try {
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

    // 1. توليد النص الاستشاري عبر Gemini 3.5 Flash Lite
    let fullPrompt = "أنت مصمم ديكور داخلي خبير ومحترف.";
    if (roomType) fullPrompt += ` نوع الغرفة: ${roomType}.`;
    if style) fullPrompt += ` الطراز المطلوب: ${style}.`;
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

    const textModel = 'gemini-3.5-flash-lite';
    const textResponse = await ai.models.generateContent({
      model: textModel,
      contents: contents,
      config: {
        systemInstruction: "أنت مساعد تصميم داخلي ذكي باسم 'أثاث' (Otath). قم بتقديم اقتراحات تحسين وتأثيث الديكور باللغة العربية بأسلوب راقٍ، منظم، ومفصل."
      }
    });

    const textOutput = textResponse.text || '';

    // 2. توليد صورة تصميم واقعية باستخدام نموذج Imagen لتجنب الخطأ في الواجهة الأمامية
    let generatedImage = null;
    try {
      const imagePromptText = `Interior design rendering of a ${roomType || 'room'} in ${style || 'modern'} style, featuring color palette ${colors || 'neutral'}, high quality, photorealistic, architectural photography`;
      
      const imageResponse = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: imagePromptText,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: '1:1',
        },
      });

      if (imageResponse.generatedImages && imageResponse.generatedImages.length > 0) {
        const base64Bytes = imageResponse.generatedImages[0].image.imageBytes;
        generatedImage = `data:image/jpeg;base64,${base64Bytes}`;
      }
    } catch (imgError) {
      console.warn('⚠️ فشل في توليد الصورة عبر Imagen، سيتم المتابعة بالنص فقط:', imgError.message);
    }

    return res.json({
      success: true,
      result: textOutput,
      design: textOutput,
      text: textOutput,
      image: generatedImage,
      imageUrl: generatedImage,
      modelUsed: textModel
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
    model: 'gemini-3.5-flash-lite',
    apiKeyConfigured: !!process.env.GEMINI_API_KEY 
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📱 Server configured with Gemini 3.5 Flash-Lite & Imagen`);
});
