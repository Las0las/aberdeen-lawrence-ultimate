# Deployment Guide - ATS AI-Copilot

This guide covers deployment of the ATS AI-Copilot to Vercel with Supabase backend.

## Prerequisites

- [Vercel Account](https://vercel.com/signup)
- [Supabase Account](https://supabase.com)
- [GitHub Account](https://github.com) (for repository)
- Node.js 18+ (for local development)

## Quick Start (5 minutes)

### 1. Fork or Clone Repository

```bash
git clone https://github.com/Las0las/aberdeen-lawrence-ultimate.git
cd aberdeen-lawrence-ultimate
```

### 2. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the database to be provisioned (2-3 minutes)
3. Go to **Settings** → **API** and copy:
   - Project URL (e.g., `https://xxxxx.supabase.co`)
   - `anon` public key
   - `service_role` secret key

### 3. Deploy to Vercel

#### Option A: One-Click Deploy (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Las0las/aberdeen-lawrence-ultimate)

1. Click the "Deploy with Vercel" button
2. Connect your GitHub account
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `DATABASE_URL` (PostgreSQL connection string from Supabase or other provider)
4. Click **Deploy**

#### Option B: Manual Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow prompts and set environment variables
```

### 4. Configure Environment Variables

In your Vercel project dashboard, go to **Settings** → **Environment Variables** and add:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...

# Database (use Supabase connection string or external PostgreSQL)
DATABASE_URL=postgresql://user:password@host:5432/database

# Redis (optional - for scheduling features)
REDIS_HOST=your-redis-host.com
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# Security
AUDIT_SECRET=generate-a-secure-random-string

# AI/LLM (optional - for advanced features)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Node Environment
NODE_ENV=production
LOG_LEVEL=info
```

### 5. Set Up Database Schema

Run Prisma migrations to create the database schema:

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate
```

Or manually execute the SQL schema from `prisma/schema.prisma` in your Supabase SQL editor.

### 6. Access Your Application

Your app will be live at: `https://your-project.vercel.app`

To see the AI Copilot demo without database setup, visit: `https://your-project.vercel.app/demo`

## v0.dev Integration

The ATS AI-Copilot is fully compatible with v0.dev:

### Using with v0.dev

1. **Copy Components**: Copy the files from `components/ats-copilot/` into your v0.dev project
2. **Install Dependencies**:
   ```bash
   npm install @supabase/supabase-js lucide-react
   ```
3. **Add Provider**: Wrap your app with `ATSCopilotProvider` in your layout
4. **Add Sidebar**: Include `<ATSCopilotSidebar />` in your layout
5. **Configure Supabase**: Set up environment variables as shown above

### v0.dev Component Files

```
components/ats-copilot/
├── ATSCopilotProvider.tsx    # Context provider (copy this)
└── ATSCopilotSidebar.tsx     # Main sidebar UI (copy this)

app/api/copilot/
└── chat/route.ts             # API endpoint (copy this)

lib/supabase/
├── client.ts                 # Supabase client (copy this)
└── server.ts                 # Supabase server (copy this)
```

## Configuration Options

### Customizing the AI Copilot

Edit `components/ats-copilot/ATSCopilotSidebar.tsx`:

**Change Quick Actions:**
```typescript
const quickActions = [
  {
    icon: <YourIcon className="w-4 h-4" />,
    label: 'Your Action',
    prompt: 'Your custom prompt',
  },
  // Add more actions...
];
```

**Change Colors:**
Edit the gradient in `app/globals.css` or component classes:
```css
from-blue-600 to-purple-600  /* Change to your brand colors */
```

### Adding Real AI (OpenAI/Anthropic)

Edit `app/api/copilot/chat/route.ts` to integrate with your preferred LLM:

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const completion = await openai.chat.completions.create({
  model: "gpt-4",
  messages: messages,
});
```

## Production Checklist

Before going live, ensure:

- [ ] All environment variables are set in Vercel
- [ ] Database migrations are run
- [ ] Supabase RLS (Row Level Security) policies are configured
- [ ] Redis is set up for scheduling features (if using)
- [ ] SSL/TLS is enabled (automatic with Vercel)
- [ ] CORS is configured for your domain
- [ ] Error monitoring is set up (Sentry, LogRocket, etc.)
- [ ] Analytics are configured (if desired)
- [ ] Rate limiting is implemented on API routes
- [ ] Content Security Policy headers are set

## Monitoring & Maintenance

### Viewing Logs

**Vercel:**
```bash
vercel logs
```

**Supabase:**
Go to your project dashboard → Logs

### Metrics

Prometheus metrics are exposed at `/api/agents/metrics`

### Updating

```bash
git pull origin main
vercel --prod
```

## Troubleshooting

### Build Failures

**Issue**: Missing environment variables
**Solution**: Ensure all required env vars are set in Vercel dashboard

**Issue**: Database connection timeout
**Solution**: Check DATABASE_URL is correct and database is accessible

### Runtime Errors

**Issue**: "Can't reach database server"
**Solution**: Verify DATABASE_URL and check Supabase is running

**Issue**: Sidebar not appearing
**Solution**: Check browser console for errors, ensure Tailwind CSS is built

**Issue**: AI not responding
**Solution**: Check `/api/copilot/chat` endpoint is accessible, review server logs

### Performance Issues

**Issue**: Slow page loads
**Solution**: Enable caching, use CDN for static assets, optimize images

**Issue**: High API costs
**Solution**: Implement rate limiting, cache AI responses, use smaller models

## Support

- **Documentation**: See [ATS_COPILOT.md](docs/ATS_COPILOT.md)
- **Issues**: [GitHub Issues](https://github.com/Las0las/aberdeen-lawrence-ultimate/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Las0las/aberdeen-lawrence-ultimate/discussions)

## Advanced Features

### Setting Up Redis (Optional)

For scheduling features, set up Redis:

1. Create Redis instance on [Upstash](https://upstash.com) or [Redis Cloud](https://redis.com/cloud/)
2. Add connection details to environment variables
3. Redis will be used for interview slot reservations

### Enabling Advanced AI

To use OpenAI GPT-4 or Anthropic Claude:

1. Get API key from [OpenAI](https://platform.openai.com) or [Anthropic](https://anthropic.com)
2. Add to environment variables
3. Update `app/api/copilot/chat/route.ts` with LLM integration code

### Custom Integrations

The copilot can be extended to integrate with:
- Greenhouse
- Lever
- Workday
- BambooHR
- Custom ATS systems

See `docs/ATS_COPILOT.md` for integration examples.

## Security Best Practices

1. **Never commit secrets** to version control
2. **Use environment variables** for all sensitive data
3. **Enable Supabase RLS** to protect data
4. **Implement rate limiting** on API endpoints
5. **Validate all user input** before processing
6. **Use HTTPS only** (default with Vercel)
7. **Regular security audits** of dependencies
8. **Monitor for suspicious activity** in logs

## Cost Optimization

### Free Tier Usage

- **Vercel**: 100GB bandwidth/month free
- **Supabase**: 500MB database, 2GB bandwidth free
- **Upstash Redis**: 10K commands/day free

### Reducing Costs

1. **Cache AI responses** to reduce API calls
2. **Use smaller AI models** for simple queries
3. **Implement request batching** where possible
4. **Set up CDN caching** for static content
5. **Optimize images** and assets
6. **Use serverless functions** efficiently

## Scaling

### Handling High Traffic

1. **Enable Vercel Pro** for better performance
2. **Upgrade Supabase** to Pro for more resources
3. **Implement caching** at multiple levels
4. **Use edge functions** for global distribution
5. **Set up load balancing** if needed
6. **Database read replicas** for heavy read workloads

### Performance Targets

- Page load: < 2 seconds
- API response: < 500ms
- AI chat response: < 3 seconds
- 99.9% uptime

## Compliance

### GDPR Compliance

- User data stored in Supabase (EU region available)
- Right to deletion implemented
- Data export functionality
- Privacy policy required

### EEOC Compliance

- Fairness monitoring built-in
- Bias detection enabled
- Audit trails maintained
- Regular fairness evaluations

## License

See [LICENSE](LICENSE) file for details.

---

**Questions?** Open an issue or discussion on GitHub!
