# 🚀 Deployment Guide - Otath Furniture Designer

This guide covers deploying your Otath application to production environments.

## Prerequisites

- Node.js 16+ and npm 8+
- Google Gemini API Key with sufficient quota
- GitHub account (for version control)
- Hosting account (Heroku, Vercel, Railway, etc.)

---

## 📋 Pre-Deployment Checklist

- [ ] All environment variables configured in `.env`
- [ ] API key set and tested
- [ ] Rate limiting configured
- [ ] CORS settings updated for your domain
- [ ] Package.json dependencies locked (`npm ci` tested)
- [ ] Code reviewed and tested locally
- [ ] README updated with any custom changes

---

## 🔧 Local Testing Before Deployment

### 1. Test Production Mode Locally

```bash
# Install dependencies
npm install

# Set environment variables
cp .env.example .env
# Edit .env with your actual values

# Run production mode
npm start

# Test API endpoint
curl -X POST http://localhost:3000/api/generate-design \
  -H "Content-Type: application/json" \
  -d '{"prompt":"test","imageBase64":"base64data","imageMimeType":"image/jpeg"}'
```

### 2. Test with Production Build

```bash
NODE_ENV=production npm start
```

---

## ☁️ Deployment Options

### Option 1: Heroku (Recommended for Beginners)

#### Step 1: Install Heroku CLI
```bash
# macOS
brew tap heroku/brew && brew install heroku

# Windows
# Download from https://devcenter.heroku.com/articles/heroku-cli

# Verify installation
heroku --version
```

#### Step 2: Create Heroku App
```bash
# Login to Heroku
heroku login

# Create app
heroku create otath-app

# Or use existing app
heroku apps:create otath-furniture
```

#### Step 3: Set Environment Variables
```bash
heroku config:set GEMINI_API_KEY=your_actual_key
heroku config:set NODE_ENV=production
heroku config:set CLIENT_URL=https://otath-app.herokuapp.com
```

#### Step 4: Deploy
```bash
# Push to Heroku
git push heroku main

# View logs
heroku logs --tail

# Open app
heroku open
```

#### Step 5: Scale Dynos (Optional)
```bash
# View current dynos
heroku ps

# Upgrade to paid dyno for production
heroku dyno:type upgrade web=standard-1x
```

---

### Option 2: Vercel (Best for Serverless)

#### Step 1: Install Vercel CLI
```bash
npm i -g vercel
```

#### Step 2: Prepare Project
```bash
# Create vercel.json in root
{
  "buildCommand": "npm install",
  "devCommand": "npm run dev",
  "outputDirectory": "public",
  "env": {
    "GEMINI_API_KEY": "@gemini_api_key",
    "NODE_ENV": "production"
  }
}
```

#### Step 3: Deploy
```bash
vercel
# Follow prompts
# Select: Standalone Node.js function
```

#### Step 4: Set Secrets
```bash
vercel env add GEMINI_API_KEY
# Enter your API key when prompted
```

---

### Option 3: Railway.app

#### Step 1: Connect GitHub
1. Go to https://railway.app
2. Sign in with GitHub
3. Select your repository

#### Step 2: Configure
```bash
# In Railway dashboard:
# 1. Add environment variables:
#    - GEMINI_API_KEY
#    - NODE_ENV=production
#    - PORT=3000

# 2. Set start command: npm start
# 3. Deploy
```

#### Step 3: View Deployment
```bash
# Railway will provide a URL
# Monitor logs in dashboard
```

---

### Option 4: Digital Ocean App Platform

#### Step 1: Create App
1. Go to DigitalOcean App Platform
2. Select "Create App"
3. Connect GitHub repository

#### Step 2: Configure
- Set buildpack: Node.js 18+
- Set start command: `npm start`
- Configure environment variables

#### Step 3: Deploy
- Select branch (main)
- Click "Deploy"

---

### Option 5: AWS/EC2 (For Advanced Users)

#### Step 1: Launch EC2 Instance
```bash
# Ubuntu 22.04 LTS recommended
# t3.micro (free tier eligible)
```

#### Step 2: Install Dependencies
```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install nodejs -y
```

#### Step 3: Clone Repository
```bash
git clone https://github.com/desotath2691/otath.git
cd otath
npm install
```

#### Step 4: Configure PM2 (Process Manager)
```bash
npm install -g pm2

# Create ecosystem.config.js
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'otath',
    script: './server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      GEMINI_API_KEY: process.env.GEMINI_API_KEY
    }
  }]
};
EOF

# Start app
pm2 start ecosystem.config.js

# Enable auto-start on reboot
pm2 startup
pm2 save
```

#### Step 5: Setup Reverse Proxy (Nginx)
```bash
sudo apt install nginx -y

# Configure Nginx
sudo nano /etc/nginx/sites-available/default

# Add:
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Restart Nginx
sudo systemctl restart nginx
```

#### Step 6: Setup SSL with Certbot
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com
```

---

## 🔒 Security for Production

### 1. Environment Variables
```bash
# Never commit .env file
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
```

### 2. Rate Limiting
Already configured in `server.js` (10 requests per 15 minutes)

### 3. CORS Headers
Update in `server.js` for your domain:
```javascript
app.use(cors({
    origin: 'https://your-domain.com',
    credentials: true
}));
```

### 4. HTTPS Enforcement
```javascript
// Add to server.js
if (process.env.NODE_ENV === 'production') {
    app.use((req, res, next) => {
        if (req.header('x-forwarded-proto') !== 'https') {
            res.redirect(`https://${req.header('host')}${req.url}`);
        } else {
            next();
        }
    });
}
```

### 5. Security Headers
```bash
npm install helmet
```

Add to `server.js`:
```javascript
const helmet = require('helmet');
app.use(helmet());
```

---

## 📊 Monitoring & Logs

### Heroku
```bash
heroku logs --tail
heroku logs --num 50
```

### Vercel
```bash
vercel logs
```

### Railway/DigitalOcean
- Check dashboard logs
- Monitor CPU/Memory usage

### AWS EC2
```bash
pm2 logs
pm2 monit
```

---

## 🔧 Troubleshooting

### Issue: "API Key is invalid"
**Solution:**
```bash
# Verify key is correctly set
heroku config:get GEMINI_API_KEY

# Regenerate key at https://ai.google.dev/
```

### Issue: "Port already in use"
**Solution:**
```bash
# Kill process using port 3000
lsof -i :3000
kill -9 <PID>
```

### Issue: "CORS errors"
**Solution:**
- Update `CLIENT_URL` in `.env`
- Verify frontend and backend URLs match
- Check CORS configuration in `server.js`

### Issue: "Out of memory"
**Solution:**
```bash
# Increase Node memory
NODE_OPTIONS=--max-old-space-size=4096 npm start
```

### Issue: "500 Internal Server Error"
**Solution:**
1. Check logs: `heroku logs --tail`
2. Verify API key has quota
3. Check image size (max 5MB)
4. Verify network connectivity

---

## 🚀 Continuous Deployment

### GitHub Actions (Automatic Deployment)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Deploy to Heroku
        uses: akhileshns/heroku-deploy@v3.12.12
        with:
          heroku_api_key: ${{ secrets.HEROKU_API_KEY }}
          heroku_app_name: "otath-app"
          heroku_email: "des.otath@gmail.com"
```

---

## 📈 Performance Optimization

### 1. Enable Compression
```javascript
const compression = require('compression');
app.use(compression());
```

### 2. Caching Headers
```javascript
app.use((req, res, next) => {
    res.set('Cache-Control', 'public, max-age=3600');
    next();
});
```

### 3. Image Optimization
- Frontend already limits to 5MB
- Consider adding image resize on backend

---

## 🎯 Post-Deployment

1. **Test API Endpoint:**
   ```bash
   curl https://your-domain.com/api/health
   ```

2. **Monitor Performance:**
   - Set up uptime monitoring (UptimeRobot)
   - Enable error tracking (Sentry)

3. **Backup & Recovery:**
   - Enable database backups (if applicable)
   - Keep deployment logs

4. **Update DNS:**
   - Point domain to your hosting platform

---

## 📞 Support

- **Heroku Support:** https://help.heroku.com
- **Vercel Support:** https://vercel.com/support
- **Railway Support:** https://docs.railway.app
- **Google Gemini:** https://ai.google.dev/docs

---

**Last Updated:** July 2026
**Maintained By:** Otath Team
