import express from 'express';
import { buildDesignPrompt, parseBase64Image } from '../services/promptBuilder.js';
import { generateTextDesign, generateRoomImage } from '../services/gemini.js';
import { MODELS } from '../config/models.js';
import { getProductImageAsBase64, buildStrictMergePrompt } from '../services/imageEditor.js';

const router = express.Router();

router.post('/generate-design', async (req, res) => {
  try {
    // 1️⃣ قمنا بإضافة imageBase64 ليتمكن الخادم من استلام الصورة من الواجهة
    const { 
      prompt, image, imageData, imageBase64, imageMimeType, roomType, style, colors, budget, additionalNotes,
      selectedProductImage, selectedProductName 
    } = req.body;

    // توحيد مصدر الصورة ليعمل بسلاسة
    const rawImage = imageBase64 || image || imageData;
    const userRoomImageInput = parseBase64Image(rawImage);

    // إعداد الموجه (Prompt)
    let contents = [];
    let finalPrompt = prompt || ""; 

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
      if(!finalPrompt) {
          finalPrompt = buildDesignPrompt(roomType, style, colors, budget, prompt, additionalNotes);
      }
      contents.push(finalPrompt);
      if (userRoomImageInput) contents.push(userRoomImageInput);
    }

    // 2️⃣ توليد التحليل النصي الذكي
    let textOutput = "";
    try {
      textOutput = await generateTextDesign(contents);
    } catch (textError) {
      console.warn("⚠️ ضغط مؤقت على خوادم النص، تم استخدام النص البديل:", textError.message);
      textOutput = "تم استلام طلبك بنجاح. نقوم الآن بتحليل مساحتك واختيار أنسب القطع من أوتاث لغرفتك...";
    }

    // 3️⃣ توليد الصورة
    let generatedImageBase64 = null;
    try {
      let rawImageResponse = await Promise.race([
        generateRoomImage(finalPrompt),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 45000))
      ]);
      
      // تنظيف الصورة إذا كانت تحتوي على رابط Data URI لأن الواجهة تضيفه بنفسها
      if (rawImageResponse && rawImageResponse.startsWith('data:')) {
         generatedImageBase64 = rawImageResponse.split(',')[1];
      } else {
         generatedImageBase64 = rawImageResponse;
      }
    } catch (imgError) {
      console.warn("⚠️ تم تجاوز خطوة الصورة لتجنب تعليق الواجهة:", imgError.message);
      generatedImageBase64 = null; // نرسلها فارغة (null) لكي تفهم الواجهة أن تعرض النص فوراً
    }

    // 4️⃣ إرسال النتيجة للواجهة بالأسماء المطابقة تماماً لما تتوقعه
    return res.json({
      success: true,
      text: textOutput,              // الواجهة ستقرأ النص من هنا
      imageBase64: generatedImageBase64, // الواجهة ستقرأ الصورة من هنا
      imageMimeType: imageMimeType || 'image/jpeg',
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
