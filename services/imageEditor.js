import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// هذه الأسطر لمعرفة المسار الصحيح للمجلدات داخل الخادم
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * دالة لجلب صورة المنتج الخاص بكم وتحويلها لبيانات يقرأها Gemini
 */
export const getProductImageAsBase64 = (productImageName) => {
  try {
    if (!productImageName) return null;

    // تحديد مسار الصورة داخل مجلد products
    const imagePath = path.join(__dirname, '..', 'products', productImageName);
    
    // التحقق من وجود الصورة فعلياً في الخادم
    if (!fs.existsSync(imagePath)) {
      console.warn(`⚠️ تنبيه: صورة المنتج غير موجودة في المسار: ${imagePath}`);
      return null;
    }

    // قراءة الصورة وتحويلها
    const imageBuffer = fs.readFileSync(imagePath);
    
    return {
      inlineData: {
        data: imageBuffer.toString('base64'),
        mimeType: 'image/png' // نفترض أن صور الأثاث بخلفية شفافة بصيغة PNG
      }
    };
  } catch (error) {
    console.error('❌ خطأ أثناء معالجة صورة المنتج:', error);
    return null;
  }
};

/**
 * دالة لتجهيز الأوامر الصارمة للحفاظ على هوية المنتج
 */
export const buildStrictMergePrompt = (roomType, productName) => {
  return `
    أنت خبير في دمج الصور والتصميم الداخلي.
    سأقدم لك صورتين:
    1. صورة لمساحة العميل (غرفة من نوع: ${roomType || 'غير محدد'}).
    2. صورة لقطعة أثاث محددة (اسم المنتج: ${productName || 'قطعة أثاث'}).

    المهمة الصارمة:
    قم بدمج قطعة الأثاث داخل صورة الغرفة في المكان المناسب والمنطقي.
    يجب أن تحافظ تماماً وبنسبة 100% على شكل، لون، وتفاصيل قطعة الأثاث كما هي في صورتها الأصلية دون أي تعديل في تصميمها.
    يُسمح لك فقط بتعديل الإضاءة والظلال على قطعة الأثاث لتندمج بواقعية مع إضاءة الغرفة الأصلية.
  `;
};
