import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Setup __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Google Gen AI SDK using GEMINI_API_KEY from environment variables
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn("⚠️ Warning: GEMINI_API_KEY is not set in environment variables.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || '' });

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static frontend files from 'public' directory
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

    // Helper function to extract base64 data and mimeType
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

    // Build systemic prompt context for interior design analysis/generation
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

    // Assemble input contents array
    const contents = [];
    contents.push(fullPrompt);

    if (imageInput) {
      contents.push(imageInput);
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-image',
      contents: contents,
      config: {
        systemInstruction: "أنت مساعد تصميم داخلي ذكي باسم 'أثاث' (Otath). قم بتقديم اقتراحات تحسين وتأثيث الديكور باللغة العربية بأسلوب راقٍ، منظم، ومفصل."
      }
    });

    const textOutput = response.text || '';
    
    // Check if the response contains inline images (if model generated image output)
    let generatedImage = null;
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const mime = part.inlineData.mimeType || 'image/png';
          generatedImage = `data:${mime};base64,${part.inlineData.data}`;
        }
      }
    }

    // Return backwards-compatible response structure matching front-end needs
    return res.json({
      success: true,
      result: textOutput,
      design: textOutput,
      text: textOutput,
      image: generatedImage,
      imageUrl: generatedImage,
      modelUsed: 'gemini-3.1-flash-image'
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

// Health check endpoint for Render
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Otath Backend', model: 'gemini-3.1-flash-image' });
});

// Serve frontend index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📱 Gemini SDK configured with model: gemini-3.1-flash-image`);
});
