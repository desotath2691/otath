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
    // 1️⃣ توليد النص (مع حماية من زحام سيرفرات جوجل 503)
    let textOutput = "نعتذر، هناك ضغط كبير على خوادم الذكاء الاصطناعي في هذه اللحظة. يرجى المحاولة بعد قليل لإتمام تصميم مساحتك.";
    try {
      textOutput = await generateTextDesign(contents);
    } catch (textError) {
      console.warn("⚠️ تم تجاوز خطوة النص بسبب ضغط خوادم جوجل (503):", textError.message);
    }

    // 3️⃣ توليد الصورة بأمان لمنع تعليق الموقع
    let generatedImageBase64 = null;
    try {
      // إذا فشلت الصورة أو تأخرت، نعيد صورة الغرفة التي رفعها العميل كي لا يعلق الموقع
      generatedImageBase64 = await Promise.race([
        generateRoomImage(roomType, style, colors),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 12000))
      ]);
    } catch (imgError) {
      console.warn("⚠️ تم تجاوز خطوة الصورة لتجنب تعليق الواجهة:", imgError.message);
      // إرجاع صورة العميل الأصلية لكي تكتمل شاشة التحميل بنجاح
      generatedImageBase64 = image || imageData || null;
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
