# Deployment Guide

This guide covers deploying the Claude Sentiment Monitor application.

## Prerequisites

- PostgreSQL database (version 14 or higher)
- Node.js 18+ environment
- Reddit API credentials (OAuth 2.0 client ID and secret)
- OpenAI API key (for GPT-4o-mini)

## Environment Variables

Create a `.env.local` file in the app directory (see `.env.example` for template):

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/claudometer?schema=public"

# Reddit API (OAuth 2.0)
REDDIT_CLIENT_ID="your_reddit_client_id_here"
REDDIT_CLIENT_SECRET="your_reddit_client_secret_here"
REDDIT_USER_AGENT="ClaudeCodeMonitor/1.0"

# OpenAI API
OPENAI_API_KEY="sk-your-openai-api-key-here"

# Cron Secret (for securing cron endpoints)
CRON_SECRET="your_secure_random_string_here"
```

## Database Setup

1. **Create the database:**
   ```bash
   createdb claudometer
   ```

2. **Run Prisma migrations:**
   ```bash
   cd app
   npx prisma migrate dev --name init --schema=app/prisma/schema.prisma
   ```

3. **Generate Prisma Client:**
   ```bash
   npx prisma generate --schema=app/prisma/schema.prisma
   ```

## Initial Data Backfill

Before the dashboard will show data, you need to backfill historical Reddit posts and comments (90 days):

```bash
curl -X POST http://localhost:3000/api/ingest/backfill \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"daysBack": 90}'
```

This will:
- Fetch posts from r/ClaudeAI, r/ClaudeCode, r/Anthropic (last 90 days)
- Fetch all comments for those posts
- Analyze sentiment using OpenAI GPT-4o-mini
- Generate daily aggregates

**Note:** This process may take 30-60 minutes depending on the volume of data and API rate limits.

## Setting Up Automated Polling (30-minute intervals)

### Option 1: Vercel Cron Jobs (Recommended for Vercel deployments)

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/ingest/poll",
      "schedule": "*/30 * * * *"
    }
  ]
}
```

Vercel will automatically call the endpoint every 30 minutes with proper authentication.

### Option 2: GitHub Actions

Create `.github/workflows/poll-reddit.yml`:

```yaml
name: Poll Reddit Data

on:
  schedule:
    - cron: '*/30 * * * *'  # Every 30 minutes
  workflow_dispatch:  # Allow manual trigger

jobs:
  poll:
    runs-on: ubuntu-latest
    steps:
      - name: Call polling endpoint
        run: |
          curl -X POST ${{ secrets.APP_URL }}/api/ingest/poll \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

Set the following secrets in your GitHub repository:
- `APP_URL`: Your deployed app URL (e.g., https://your-app.vercel.app)
- `CRON_SECRET`: Your cron secret from environment variables

### Option 3: System Cron (Self-hosted)

Add to your crontab:

```bash
*/30 * * * * curl -X POST http://your-domain.com/api/ingest/poll -H "Authorization: Bearer YOUR_CRON_SECRET" >> /var/log/claudometer-poll.log 2>&1
```

### Option 4: External Cron Service (cron-job.org, EasyCron, etc.)

1. Sign up for a cron service
2. Create a new cron job:
   - URL: `https://your-app.vercel.app/api/ingest/poll`
   - Method: `POST`
   - Headers: `Authorization: Bearer YOUR_CRON_SECRET`
   - Schedule: Every 30 minutes

## Deployment Platforms

### Vercel (Recommended)

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Deploy:**
   ```bash
   cd app
   vercel
   ```

3. **Set environment variables in Vercel dashboard**

4. **Add `vercel.json` for cron jobs** (see Option 1 above)

### Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY app/package*.json ./
RUN npm ci --production

COPY app .

RUN npx prisma generate --schema=app/prisma/schema.prisma

ENV NODE_ENV=production
EXPOSE 3000

CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t claudometer .
docker run -p 3000:3000 --env-file .env.local claudometer
```

## Monitoring

### Check Polling Status

```bash
# View recent polling activity
curl http://localhost:3000/api/ingest/poll \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -X POST
```

### Database Monitoring

```bash
# Check data volume
npx prisma studio --schema=app/prisma/schema.prisma
```

## Troubleshooting

### Reddit API Rate Limiting

If you see 429 errors, the application will automatically retry with exponential backoff. The default rate limit is 60 requests/minute.

### OpenAI API Costs

Estimated costs with 7-day caching:
- ~500 posts/day × 3 subreddits = 1,500 items/day
- ~200 tokens/item average
- GPT-4o-mini: $0.15 per 1M input tokens
- **Monthly cost: ~$0.50** (with caching reducing repeat analyses by 90%)

### Database Performance

For optimal performance:
- Ensure PostgreSQL indexes are created (handled by Prisma migrations)
- Consider connection pooling for high traffic (use Prisma Accelerate or PgBouncer)

## Production Checklist

- [ ] Database migrations run successfully
- [ ] Environment variables configured
- [ ] Initial backfill completed (90 days)
- [ ] Cron job configured and tested
- [ ] Reddit API credentials verified
- [ ] OpenAI API key verified and billing enabled
- [ ] HTTPS enabled for production domain
- [ ] Error monitoring configured (e.g., Sentry)
- [ ] Database backups configured
