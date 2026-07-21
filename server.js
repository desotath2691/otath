const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const rateLimit = require('express-rate-limit');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb' }));
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
}));

// Serve static files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Rate limiting - prevent abuse
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 requests per windowMs
    message: 'تم تجاوز حد الطلبات. يرجى المحاولة لاحقاً.',
    standardHeaders: true,
    legacyHeaders: false,
});

app.use('/api/', limiter);

// Validation middleware
function validateGenerationRequest(req, res, next) {
    const { prompt, imageBase64, imageMimeType } = req.body;
    
    if (!prompt || !imageBase64 || !imageMimeType) {
        return res.status(400).json({
            error: 'Missing required fields: prompt, imageBase64, imageMimeType'
        });
    }
    
    if (imageBase64.length > 5 * 1024 * 1024) {
        return res.status(400).json({
            error: 'Image data exceeds maximum size (5MB)'
        });
    }
    
    if (prompt.length > 2000) {
        return res.status(400).json({
            error: 'Prompt exceeds maximum length (2000 characters)'
        });
    }
    
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(imageMimeType)) {
        return res.status(400).json({
            error: 'Invalid image mime type. Supported: image/jpeg, image/png, image/webp'
        });
    }
    
    next();
}

// Main API endpoint
app.post('/api/generate-design', validateGenerationRequest, async (req, res) => {
    try {
        const { prompt, imageBase64, imageMimeType } = req.body;
        
        // Verify API key is configured
        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({
                error: 'Server configuration error: Missing API key'
            });
        }
        
        // Prepare payload for Gemini API
        const payload = {
            contents: [{
                role: "user",
                parts: [
                    { text: prompt },
                    {
                        inlineData: {
                            mimeType: imageMimeType,
                            data: imageBase64
                        }
                    }
                ]
            }],
            generationConfig: {
                responseModalities: ['IMAGE']
            }
        };
        
        // Call Gemini API
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload),
            timeout: 120000 // 2 minute timeout
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Gemini API Error:', errorData);
            
            return res.status(response.status).json({
                error: `Gemini API error: ${response.statusText}`,
                details: errorData
            });
        }
        
        const result = await response.json();
        
        // Extract generated image from response
        const imageContent = result?.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
        
        if (!imageContent) {
            return res.status(500).json({
                error: 'No image content in API response'
            });
        }
        
        // Return the generated image
        res.json({
            imageBase64: imageContent.inlineData.data,
            imageMimeType: imageContent.inlineData.mimeType,
            success: true
        });
        
    } catch (error) {
        console.error('Generation error:', error);
        
        res.status(500).json({
            error: 'Failed to generate image design',
            message: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve index.html for all other routes (SPA fallback)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📱 Frontend: http://localhost:${PORT}`);
    console.log(`🔌 API endpoint: http://localhost:${PORT}/api/generate-design`);
    console.log(`✅ Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
