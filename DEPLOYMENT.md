# 🚀 Deployment Guide - Otath Furniture Designer

This guide covers deploying your Otath application to production environments.

## Prerequisites

- Node.js 16+ and npm 8+
- Google Gemini API Key with sufficient quota
- GitHub account (for version control)
- Hosting account (Heroku, Vercel, Railway, etc.)

## Quick Start - Heroku

```bash
# Install Heroku CLI
brew tap heroku/brew && brew install heroku

# Login
heroku login

# Create app
heroku create otath-app

# Set environment variable
heroku config:set GEMINI_API_KEY=your_actual_key

# Deploy
git push heroku main

# View logs
heroku logs --tail
```

For detailed deployment instructions, see the full guide in the repository.
