import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// استدعاء الموجهات (Routes)
import designRoutes from './routes/design.js';
import productRoutes from './routes/products.js';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
// إعداد الحد الأقصى لحجم الطلبات
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// تشغيل الملفات الثابتة والصور
app.use(express.static(path.join(__dirname, 'public')));
app.use('/products', express.static(path.join(__dirname, 'products')));

// ربط مسارات التصميم بالخادم
app.use('/api', designRoutes);
app.use('/api/products', productRoutes);
// فحص حالة الخادم
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'Otath Backend', 
    apiKeyConfigured: !!process.env.GEMINI_API_KEY 
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log('📱 Otath Modular Architecture is Active');
});
