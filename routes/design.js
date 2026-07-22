import express from 'express';
import { buildDesignPrompt, parseBase64Image } from '../services/promptBuilder.js';
import { generateTextDesign, generateRoomImage } from '../services/gemini.js';
import { MODELS } from '../config/models.js';

const router = express.Router();

router.post('/generate-design', async (req, res) => {
  try {
    const { prompt, image, imageData, roomType, style, colors, budget, additionalNotes } = req.body;

    const imageInput = parseBase64Image(image || imageData);
    const fullPrompt = buildDesignPrompt(roomType, style, colors, budget, prompt, additionalNotes);

    const contents = [fullPrompt];
    if (imageInput) contents.push(imageInput);

    // 1️⃣ توليد النص
    const textOutput = await generateTextDesign(contents);

    // 2️⃣ توليد الصورة
    let generatedImageBase64 = null;
    try {
      generatedImageBase64 = await generateRoomImage(roomType, style, colors);
    } catch (imgError) {
      console.error("Image generation failed:", imgError);
    }

    // 3️⃣ إرسال النتيجة
    return res.json({
      success: true,
      result: textOutput,
      text: textOutput,
      image: generatedImageBase64,
      modelUsed: `${MODELS.TEXT} + ${MODELS.IMAGE}`
    });

  } catch (error) {
    console.error('Error in design route:', error);
    return res.status(500).json({
      success: false,
      error: 'حدث خطأ أثناء معالجة الطلب',
      details: error.message
    });
  }
});

export default router;
