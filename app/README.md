# Claude Code Sentiment Monitor

A Next.js 15 application that tracks and visualizes community sentiment across Reddit discussions about Claude, Claude Code, and Anthropic products.

## Features

- **Real-time Sentiment Analysis**: Uses OpenAI GPT-4o-mini to analyze sentiment of Reddit posts and comments
- **Multi-subreddit Tracking**: Monitors r/ClaudeAI, r/ClaudeCode, and r/Anthropic
- **Interactive Dashboard**:
  - Sentiment trend charts (LineChart via Recharts)
  - Discussion volume charts (BarChart via Recharts)
  - Drill-down to daily post and comment details
  - CSV export functionality
- **Automated Data Collection**: 30-minute polling for new content with 90-day backfill
- **Smart Caching**:
  - 7-day sentiment result caching
  - Multi-layer HTTP and service caching
  - Token bucket rate limiting for Reddit API

## Tech Stack

- **Framework**: Next.js 15 with App Router, React 19
- **Database**: PostgreSQL with Prisma ORM
- **APIs**:
  - Reddit API (OAuth 2.0)
  - OpenAI API (GPT-4o-mini with structured outputs)
- **UI**: shadcn/ui components, Tailwind CSS v4, Recharts
- **Data Fetching**: SWR for client-side data fetching
- **Deployment**: Vercel-ready with cron job configuration

## Project Structure

```
app/
├── app/
│   ├── api/              # API routes
│   │   ├── dashboard/data/  # Dashboard data aggregates
│   │   ├── drill-down/      # Daily detail view
│   │   ├── export/csv/      # CSV export
│   │   └── ingest/          # Data ingestion (poll, backfill)
│   ├── layout.tsx
│   ├── page.tsx
│   └── prisma/           # Database schema
│       └── schema.prisma
├── components/
│   └── dashboard/        # Dashboard UI components
│       ├── DashboardShell.tsx
│       ├── SentimentChart.tsx
│       ├── VolumeChart.tsx
│       ├── KeywordPanel.tsx
│       └── DrillDownDialog.tsx
├── lib/
│   ├── prisma.ts         # Prisma client singleton
│   └── services/         # Service layer
│       ├── reddit.service.ts        # Reddit API integration
│       ├── sentiment.service.ts     # OpenAI sentiment analysis
│       └── aggregation.service.ts   # Data aggregation
├── .env.example          # Environment variables template
├── vercel.json           # Vercel cron configuration
└── DEPLOYMENT.md         # Deployment guide
```

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Reddit API credentials (OAuth 2.0)
- OpenAI API key

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

Required variables:
- `DATABASE_URL`: PostgreSQL connection string
- `REDDIT_CLIENT_ID` and `REDDIT_CLIENT_SECRET`: Reddit OAuth credentials
- `OPENAI_API_KEY`: OpenAI API key
- `CRON_SECRET`: Secure random string for cron endpoint authentication

### 3. Initialize Database

```bash
# Run migrations
npx prisma migrate dev --name init --schema=app/prisma/schema.prisma

# Generate Prisma Client
npx prisma generate --schema=app/prisma/schema.prisma
```

### 4. Backfill Historical Data

Before starting the app, backfill 90 days of historical data:

```bash
# Start dev server
npm run dev

# In another terminal, trigger backfill
curl -X POST http://localhost:3000/api/ingest/backfill \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"daysBack": 90}'
```

This will take 30-60 minutes. Monitor progress in the terminal.

### 5. View Dashboard

Open http://localhost:3000 to see the dashboard with historical sentiment data.

## Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Open Prisma Studio (database GUI)
npx prisma studio --schema=app/prisma/schema.prisma
```

## API Endpoints

### Public Endpoints

- `GET /api/dashboard/data?range=7d&subreddit=all` - Get dashboard aggregates
- `GET /api/drill-down?date=2024-01-01&subreddit=ClaudeAI` - Get daily details
- `GET /api/export/csv?range=7d` - Export data as CSV

### Protected Endpoints (require `Authorization: Bearer <CRON_SECRET>`)

- `POST /api/ingest/poll` - Poll for new Reddit content (30-min interval)
- `POST /api/ingest/backfill` - Backfill historical data

## Database Schema

### Tables

1. **raw_posts** - Reddit posts
2. **raw_comments** - Reddit comments
3. **sentiment_results** - Sentiment analysis results (cached)
4. **daily_aggregates** - Pre-computed daily statistics

See `app/prisma/schema.prisma` for complete schema.

## Cost Estimates

### OpenAI API (GPT-4o-mini)

- **Input**: $0.15 per 1M tokens
- **Average**: 200 tokens per post/comment
- **Volume**: ~1,500 new items/day across 3 subreddits
- **7-day caching**: Reduces repeat analyses by ~90%
- **Monthly cost**: ~$0.50

### Reddit API

- Free tier: 100 OAuth requests per minute
- This application uses ~60 requests per 30-min cycle
- No cost

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## Architecture Highlights

### Service Layer

- **RedditService**: OAuth 2.0, token bucket rate limiting, 3-tier caching
- **SentimentService**: Structured outputs, 7-day SHA-256 caching, batch processing
- **AggregationService**: Daily aggregates, drill-down queries, CSV export

### Caching Strategy

1. **Frontend**: SWR with 30-second refresh
2. **HTTP**: Cache-Control headers (5-30 min TTL)
3. **Service**: In-memory cache for Reddit data
4. **Database**: Persistent sentiment cache (7 days)

## Known Limitations

1. **Keyword extraction**: Currently uses placeholder data. Full implementation would require TF-IDF or similar NLP algorithms.
2. **Historical data gaps**: Reddit API only returns ~1000 posts per subreddit, so very old posts may not be captured.

## License

MIT
