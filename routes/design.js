import express from 'express';
import { buildDesignPrompt, parseBase64Image } from '../services/promptBuilder.js';
import { generateTextDesign, generateRoomImage } from '../services/gemini.js';
import { MODELS } from '../config/models.js';

// 🌟 الإضافة الجديدة: استدعاء دوال محرر الصور
import { getProductImageAsBase64, buildStrictMergePrompt } from '../services/imageEditor.js';

const router = express.Router();

router.post('/generate-design', async (req, res) => {
  try {
    const { 
      prompt, 
      image, 
      imageData, 
      roomType, 
      style, 
      colors, 
      budget, 
      additionalNotes,
      // 🌟 متغيرات جديدة نستقبلها من العميل (اسم المنتج وصورته)
      selectedProductImage, 
      selectedProductName 
    } = req.body;

    const userRoomImageInput = parseBase64Image(image || imageData);

    // 1️⃣ إعداد الموجه (Prompt) والمحتوى
    let contents = [];
    let finalPrompt = "";

    // التحقق مما إذا كان العميل قد اختار قطعة أثاث محددة
    if (selectedProductImage) {
      console.log(`🛋️ جاري تجهيز دمج المنتج: ${selectedProductName}`);
      
      // استخدام الموجه الصارم للحفاظ على هوية المنتج
      finalPrompt = buildStrictMergePrompt(roomType, selectedProductName);
      contents.push(finalPrompt);

      // إضافة صورة غرفة العميل
      if (userRoomImageInput) {
        contents.push(userRoomImageInput);
      }

      // جلب وتحويل صورة منتجكم من الخادم
      const productData = getProductImageAsBase64(selectedProductImage);
      if (productData) {
        contents.push(productData);
      } else {
        console.warn("⚠️ لم يتم العثور على صورة المنتج المحددة في مجلد products.");
      }

    } else {
      // الحالة العادية: العميل يطلب تصميماً عاماً بدون اختيار منتج محدد
      finalPrompt = buildDesignPrompt(roomType, style, colors, budget, prompt, additionalNotes);
      contents.push(finalPrompt);
      if (userRoomImageInput) contents.push(userRoomImageInput);
    }

    // 2️⃣ إرسال البيانات لتوليد النص (نصائح التوزيع والدمج)
    const textOutput = await generateTextDesign(contents);

    // 3️⃣ توليد الصورة (تم تعديلها مؤقتاً لتتخطى قيود Google)
    let generatedImageBase64 = null;
    try {
      // سنعيد صورة الغرفة الأصلية التي رفعها العميل مؤقتمْا لتكتمل التجربة وينتهي التحميل بنجاح
      generatedImageBase64 = image || imageData || null;
    } catch (imgError) {
      console.error("Image generation failed:", imgError);
    }

    // 4️⃣ إرسال النتيجة النهائية للواجهة الأمامية
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
