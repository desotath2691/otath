# أثاث | Otath - المصمم الذكي

> AI-powered interior design tool that uses Google Gemini to visualize furniture in your room

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)

## 🎨 Features

- ✨ **AI-Powered Room Design** - Upload a room photo and see how furniture looks in your space
- 🛋️ **Furniture Selection** - Choose from a curated collection of premium furniture pieces
- 🔍 **Real-time Search** - Filter furniture by name or category
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile devices
- 🎯 **Custom Prompts** - Add specific design instructions for personalized results
- ⬇️ **Easy Download** - Save generated designs as high-quality images
- 🌍 **Arabic RTL Support** - Fully localized Arabic interface

## 🚀 Quick Start

### Prerequisites

- Node.js >= 16.0.0
- npm >= 8.0.0
- Google Gemini API Key ([Get one here](https://ai.google.dev))

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/desotath2691/otath.git
cd otath
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and add your Gemini API key
# GEMINI_API_KEY=your_api_key_here
```

4. **Start the development server**
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Production Deployment

```bash
npm start
```

## 📁 Project Structure

```
otath/
├── index.html          # Frontend HTML with RTL support
├── server.js           # Express.js backend
├── package.json        # Dependencies and scripts
├── .env.example        # Environment variables template
├── .gitignore          # Git ignore rules
└── README.md           # This file
```

## 🔑 Environment Variables

Create a `.env` file based on `.env.example`:

```env
# Google Gemini API Key
GEMINI_API_KEY=your_gemini_api_key_here

# Server configuration
PORT=3000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

## 📊 API Endpoints

### Generate Room Design
```
POST /api/generate-design
```

**Request Body:**
```json
{
  "prompt": "Place the sofa near the window with warm lighting",
  "imageBase64": "base64_encoded_image_data",
  "imageMimeType": "image/jpeg"
}
```

**Response:**
```json
{
  "imageBase64": "base64_encoded_result_image",
  "imageMimeType": "image/jpeg",
  "success": true
}
```

### Health Check
```
GET /api/health
```

## 🛠️ Development

### Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with auto-reload (requires nodemon)
- `npm test` - Run tests (placeholder)

### Adding New Furniture Products

Edit the `otathProducts` array in `index.html`:

```javascript
const otathProducts = [
    {
        id: 'unique-id',
        name: 'اسم المنتج بالعربية',
        category: 'الفئة',
        imageUrl: 'https://example.com/image.jpg',
        aiPrompt: 'English description for AI model'
    },
    // ... more products
];
```

## 🔒 Security Features

- ✅ **API Key Protection** - Keys stored in backend environment variables
- ✅ **Rate Limiting** - 10 requests per 15 minutes per IP
- ✅ **Input Validation** - File size and format validation
- ✅ **CORS Protection** - Configured for your domain
- ✅ **Error Handling** - Secure error messages

## 🎯 How It Works

1. **Upload Room Image** - User uploads a photo of their room (max 5MB)
2. **Select Furniture** - Choose one or more furniture pieces from the catalog
3. **Add Custom Prompt** (Optional) - Provide specific design instructions
4. **Generate Design** - AI processes the image and integrates the furniture
5. **Download Result** - Save the generated design as JPEG

## 🌐 Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## 📦 Dependencies

### Production
- **express** - Web framework
- **cors** - Cross-origin resource sharing
- **dotenv** - Environment variable management
- **express-rate-limit** - Rate limiting middleware

### Development
- **nodemon** - Auto-reload server on file changes

## 🚢 Deployment

### Deploy to Vercel (Recommended for Serverless)

```bash
npm install -g vercel
vercel
```

### Deploy to Heroku

```bash
heroku create otath-app
heroku config:set GEMINI_API_KEY=your_key
git push heroku main
```

### Deploy to Railway, Render, or Similar

1. Connect your GitHub repository
2. Set environment variables in the platform dashboard
3. Deploy with one click

## 📝 API Rate Limiting

- **Limit**: 10 requests per 15 minutes per IP
- **Headers**: Returns `X-RateLimit-*` headers
- **Message**: Arabic error message on limit exceeded

## ⚠️ Limitations

- Maximum image size: 5MB
- Maximum prompt length: 2000 characters
- Processing timeout: 2 minutes
- Image formats supported: JPEG, PNG, WebP

## 🐛 Troubleshooting

### "API Key is missing"
- Ensure `.env` file exists and contains `GEMINI_API_KEY`
- Check that the API key is valid and has quota remaining

### "Image generation timeout"
- Try with a smaller image
- Ensure your internet connection is stable
- Reduce the number of selected furniture pieces

### "CORS error"
- Verify `CLIENT_URL` matches your frontend URL
- Check that both frontend and backend are running

## 📧 Support

For issues and questions:
- GitHub Issues: [Create an issue](https://github.com/desotath2691/otath/issues)
- Email: des.otath@gmail.com

## 📄 License

MIT License - feel free to use this project for commercial purposes

## 🙏 Credits

- Built with [Express.js](https://expressjs.com)
- Powered by [Google Gemini AI](https://ai.google.dev)
- Frontend styling with [Tailwind CSS](https://tailwindcss.com)
- Icons from [Font Awesome](https://fontawesome.com)

---

**Made with ❤️ by Otath Team**
