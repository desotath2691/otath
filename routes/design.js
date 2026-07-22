import express from 'express';
import { buildDesignPrompt, parseBase64Image } from '../services/promptBuilder.js';
import { generateTextDesign, generateRoomImage } from '../services/gemini.js';
import { MODELS } from '../config/models.js';
import { getProductImageAsBase64, buildStrictMergePrompt } from '../services/imageEditor.js';

const router = express.Router();

router.post('/generate-design', async (req, res) => {
  try {
    const { 
      prompt, image, imageData, roomType, style, colors, budget, additionalNotes,
      selectedProductImage, selectedProductName 
    } = req.body;

    const userRoomImageInput = parseBase64Image(image || imageData);

    // 1️⃣ إعداد الموجه (Prompt)
    let contents = [];
    let finalPrompt = "";

    if (selectedProductImage) {
      console.log(`🛋️ جاري تجهيز دمج المنتج: ${selectedProductName}`);
      finalPrompt = buildStrictMergePrompt(roomType, selectedProductName);
      contents.push(finalPrompt);

      if (userRoomImageInput) contents.push(userRoomImageInput);

      const productData = getProductImageAsBase64(selectedProductImage);
      if (productData) {
        contents.push(productData);
      } else {
        console.warn("⚠️ لم يتم العثور على صورة المنتج المحددة في مجلد products.");
      }
    } else {
      finalPrompt = buildDesignPrompt(roomType, style, colors, budget, prompt, additionalNotes);
      contents.push(finalPrompt);
      if (userRoomImageInput) contents.push(userRoomImageInput);
    }

    // 2️⃣ توليد النص (مع حماية ضد خطأ 503)
    let textOutput = "";
    try {
      textOutput = await generateTextDesign(contents);
    } catch (textError) {
      console.warn("⚠️ ضغط مؤقت على خوادم النص، تم استخدام النص البديل:", textError.message);
      // نص بديل لكي لا ينهار الموقع إذا تأخر نموذج النصوص
      textOutput = "تم استلام طلبك بنجاح. يقوم الذكاء الاصطناعي الآن بدمج قطع الأثاث في مساحتك بدقة...";
    }

    // 3️⃣ توليد الصورة (مع رفع المهلة إلى 45 ثانية وتمرير الموجه الصحيح)
    let generatedImageBase64 = null;
    try {
      generatedImageBase64 = await Promise.race([
        generateRoomImage(finalPrompt), // تم التعديل لتمرير الموجه الصحيح
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 45000)) // 45 ثانية
      ]);
    } catch (imgError) {
      console.warn("⚠️ تم تجاوز خطوة الصورة لتجنب تعليق الواجهة:", imgError.message);
      generatedImageBase64 = image || imageData || null;
    }

    // 4️⃣ إرسال النتيجة النهائية
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
