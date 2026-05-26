# Quick Start Guide - ATS AI-Copilot

Get up and running with the ATS AI-Copilot in 5 minutes!

## 🚀 Fastest Route: Demo Page (No Setup Required)

```bash
npm install
npm run dev
```

Visit: **http://localhost:3000/demo**

That's it! The demo page works without any database or configuration.

## 📦 What You Get

### AI-Copilot Sidebar Features

✅ **Natural Language Chat** - Ask anything about hiring
✅ **4 Quick Actions** - Pre-built prompts for common tasks
✅ **Intelligent Responses** - Context-aware AI assistance
✅ **Beautiful UI** - Gradient design with smooth animations
✅ **Mobile Responsive** - Works on all devices

### Quick Actions Available

1. 📄 **Analyze Resume** - Get detailed candidate analysis
2. 📊 **Success Prediction** - View ML-powered predictions
3. 💬 **Interview Questions** - Generate tailored questions
4. 📅 **Schedule Interview** - Smart scheduling assistance

## 🎯 Try These Examples

Open the demo page and try asking:

```
"Analyze this candidate's resume"
"What is the predicted success rate?"
"Generate interview questions for a senior developer"
"Help me schedule an interview"
"Tell me about bias detection"
"What analytics are available?"
```

## 🏗️ For Production Use

### 1. Set Up Supabase (2 minutes)

1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Copy your credentials

### 2. Configure Environment (1 minute)

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
DATABASE_URL=your-postgresql-url
```

### 3. Deploy to Vercel (2 minutes)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Las0las/aberdeen-lawrence-ultimate)

Click the button, add environment variables, and deploy!

## 📖 Full Documentation

- **[ATS Copilot Guide](ATS_COPILOT.md)** - Complete feature documentation
- **[Deployment Guide](../DEPLOYMENT.md)** - Detailed deployment instructions
- **[Main README](../README.md)** - Project overview

## 💡 Next Steps

1. ✅ Try the demo at `/demo`
2. ✅ Read [ATS_COPILOT.md](ATS_COPILOT.md) for customization
3. ✅ Follow [DEPLOYMENT.md](../DEPLOYMENT.md) to deploy
4. ✅ Integrate with your existing ATS

## 🎨 Customization

### Change Colors

Edit `app/globals.css` or component classes:
```css
from-blue-600 to-purple-600  /* Your brand colors */
```

### Add Custom Quick Actions

Edit `components/ats-copilot/ATSCopilotSidebar.tsx`:
```typescript
const quickActions = [
  {
    icon: <YourIcon className="w-4 h-4" />,
    label: 'Your Action',
    prompt: 'Your prompt here',
  },
];
```

### Integrate Real AI

Edit `app/api/copilot/chat/route.ts` to add OpenAI or Anthropic:
```typescript
import OpenAI from 'openai';
// Add your LLM integration
```

## 🆘 Need Help?

- **Issues**: [GitHub Issues](https://github.com/Las0las/aberdeen-lawrence-ultimate/issues)
- **Documentation**: See `docs/` folder
- **Questions**: [GitHub Discussions](https://github.com/Las0las/aberdeen-lawrence-ultimate/discussions)

## ✨ Features Overview

| Feature | Status | Notes |
|---------|--------|-------|
| AI Chat Interface | ✅ | Natural language, context-aware |
| Quick Actions | ✅ | 4 pre-built prompts |
| Beautiful UI | ✅ | Gradient design, animations |
| Database Integration | ✅ | Real-time data access |
| Supabase Backend | ✅ | Full integration included |
| v0.dev Compatible | ✅ | Drop-in ready |
| Vercel Deploy | ✅ | One-click deployment |
| TypeScript | ✅ | Fully typed |
| Mobile Responsive | ✅ | Works everywhere |
| No Dependencies on External APIs | ✅ | Works offline (demo mode) |

## 🎉 Success!

You now have a world-class ATS AI-Copilot running!

**What's Next?**
- Customize the UI to match your brand
- Add your own AI model integration
- Connect to your existing database
- Deploy to production

---

**Built with ❤️ for better hiring**
