export async function generateRoomImage(promptDescription) {
  const MAX_RETRIES = 3; // عدد محاولات إعادة الاتصال
  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    try {
      const response = await ai.models.generateImages({
        model: 'imagen-3.0-generate-001',
        prompt: promptDescription,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: '1:1',
        },
      });

      const base64ImageBytes = response.generatedImages[0].image.imageBytes;
      return `data:image/jpeg;base64,${base64ImageBytes}`;
      
    } catch (error) {
      // التحقق مما إذا كان الخطأ هو 503 (ضغط على الخوادم)
      if (error.status === 503 || error.status === 'UNAVAILABLE') {
        attempt++;
        console.warn(`الخادم مزدحم. جاري إعادة المحاولة للمرة ${attempt}...`);
        
        // إذا استنفدنا المحاولات، نمرر الخطأ للواجهة
        if (attempt === MAX_RETRIES) throw error; 
        
        // الانتظار قبل المحاولة التالية (2 ثانية، ثم 4 ثوانٍ...)
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
      } else {
        // إذا كان الخطأ من نوع آخر (مثل 404)، يتم إيقاف المحاولة فوراً
        console.error("خطأ في توليد الصورة:", error);
        throw error;
      }
    }
  }
}
