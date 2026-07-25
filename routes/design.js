import express from 'express';
import { generateTextDesign } from '../services/gemini.js';

const router = express.Router();

// 1. مسار الوسيط (Proxy) لجلب صور المنتجات وتجاوز قيود CORS بأمان
router.get('/proxy-image', async (req, res) => {
    try {
        const imageUrl = req.query.url;
        if (!imageUrl) return res.status(400).send('URL is required');
        
        const response = await fetch(imageUrl);
        const arrayBuffer = await response.arrayBuffer();
        
        res.setHeader('Content-Type', response.headers.get('content-type') || 'image/jpeg');
        res.send(Buffer.from(arrayBuffer));
    } catch (error) {
        console.error("Proxy Error:", error);
        res.status(500).send('Failed to proxy image');
    }
});

// 2. مسار توليد النص وتحليل التصميم الداخلي
router.post('/generate-design', async (req, res) => {
    try {
        const { prompt } = req.body;
        const textResult = await generateTextDesign(prompt || "أعطني نصيحة لتنسيق الأثاث");
        
        res.json({ 
            text: textResult,
            success: true 
        });
    } catch (error) {
        console.error("Design API Error:", error);
        res.status(500).json({ error: 'Failed to process request' });
    }
});

export default router;
