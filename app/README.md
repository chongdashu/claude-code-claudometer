# Claude Code Sentiment Monitor

A Next.js 15 application that tracks and visualizes Reddit sentiment about Claude Code from r/ClaudeAI, r/ClaudeCode, and r/Anthropic.

## Features

- **Multi-Subreddit Tracking**: Monitor sentiment across 3 key subreddits
- **Daily Aggregations**: View sentiment trends over 7, 30, or 90 days
- **Interactive Charts**: Line chart for sentiment, bar chart for volume
- **Keyword Analysis**: See top keywords and trending topics
- **Drill-Down Details**: Click any day to view sample posts with sentiment scores
- **CSV Export**: Download sentiment data for further analysis
- **Responsive Design**: Works on desktop, tablet, and mobile

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI Components**: shadcn/ui, Tailwind CSS
- **Charts**: Recharts
- **Data Fetching**: React Query
- **APIs**: Reddit OAuth API, OpenAI GPT-3.5-turbo

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) - you'll be redirected to the dashboard.

---

## Data Options: Mock vs Real

The app supports two modes: **Mock Data** (demo) and **Real Data** (requires API credentials).

### Option A: Mock Data (No Setup Required) ✨

Perfect for testing and demos - **works immediately without any API keys!**

**1. Initialize Sample Data**

Visit: `http://localhost:3000/api/init`

This generates 90 days of realistic sample data from r/ClaudeAI, r/ClaudeCode, and r/Anthropic.

**2. View Dashboard**

Visit: `http://localhost:3000/dashboard`

You'll see:
- Sentiment trends over 7/30/90 days
- Interactive charts and keyword analysis
- Sample posts with mock sentiment scores

**Mock Data Characteristics:**
- ✅ Instant setup - no configuration needed
- ✅ 90 days of realistic sentiment patterns
- ✅ All features work (charts, drill-down, export)
- ❌ Data resets when server restarts (in-memory only)
- ❌ No real Reddit posts or actual sentiment analysis

---

### Option B: Real Data (Requires API Credentials) 🔑

Fetch actual Reddit posts and analyze real sentiment using OpenAI.

**1. Get API Credentials**

You'll need:
- **Reddit API**: [Create app](https://www.reddit.com/prefs/apps) (script type)
  - Copy your `client_id` and `client_secret`
- **OpenAI API**: [Get API key](https://platform.openai.com/api-keys)

**2. Configure Environment Variables**

Create `.env.local` in the root directory:

```env
# Reddit API Configuration
REDDIT_CLIENT_ID=your_reddit_client_id_here
REDDIT_CLIENT_SECRET=your_reddit_client_secret_here
REDDIT_USER_AGENT=ClaudeCodeSentimentMonitor/1.0

# OpenAI API Configuration
OPENAI_API_KEY=sk-your_openai_api_key_here
```

**3. Sync Real Data**

Use cURL or any HTTP client:

```bash
# Fetch last 7 days of Reddit posts (default)
curl -X POST http://localhost:3000/api/reddit/sync \
  -H "Content-Type: application/json" \
  -d '{"days": 7}'

# Or fetch more days (costs more OpenAI credits)
curl -X POST http://localhost:3000/api/reddit/sync \
  -H "Content-Type: application/json" \
  -d '{"days": 30}'
```

**What Happens:**
1. ✅ Fetches real posts from r/ClaudeAI, r/ClaudeCode, r/Anthropic
2. ✅ Analyzes each post with OpenAI GPT-3.5-turbo
3. ✅ Stores sentiment scores and aggregates daily data
4. ✅ Updates the dashboard with real insights

**4. View Real Data**

Visit: `http://localhost:3000/dashboard`

You'll now see actual Reddit sentiment about Claude Code!

**Real Data Characteristics:**
- ✅ Actual Reddit posts and comments
- ✅ Real sentiment analysis via OpenAI
- ✅ Accurate trends and insights
- ⚠️ Costs: ~$0.01-0.05 per 100 posts (OpenAI pricing)
- ⚠️ Rate limits: Reddit API has request limits
- ❌ Data still resets on server restart (use persistent DB for production)

---

## Data Management Commands

### Clear All Data

Remove all data and start fresh:

```bash
curl -X POST http://localhost:3000/api/data/clear
```

After clearing, reinitialize with either mock or real data.

### Check What Data You Have

The dashboard shows data source in the UI. You can also:
- Check browser DevTools → Network → API responses
- Look for `lastUpdated` timestamps in API responses

---

## Switching Between Mock and Real Data

**Scenario 1: Start with Mock, Then Add Real**
```bash
# 1. Initialize mock data
curl http://localhost:3000/api/init

# 2. View dashboard with mock data
# (visit dashboard)

# 3. Clear mock data
curl -X POST http://localhost:3000/api/data/clear

# 4. Add credentials to .env.local

# 5. Sync real data
curl -X POST http://localhost:3000/api/reddit/sync -H "Content-Type: application/json" -d '{"days": 7}'
```

**Scenario 2: Mix Mock and Real** (Not Recommended)
- You can technically sync real data on top of mock data
- But results will be confusing - better to clear first

**Scenario 3: Regular Real Data Updates**
```bash
# Run daily to get new posts
curl -X POST http://localhost:3000/api/reddit/sync -H "Content-Type: application/json" -d '{"days": 1}'
```

---

## Cost Estimates (Real Data)

### Reddit API
- **Cost**: FREE
- **Limits**: 60 requests/minute per OAuth app
- **Our usage**: ~3 requests per sync (3 subreddits)

### OpenAI API (GPT-3.5-turbo)
- **Input**: ~500 tokens per post = $0.0005
- **Output**: ~100 tokens per analysis = $0.00015
- **Total per post**: ~$0.00065

**Example Costs:**
- 100 posts: ~$0.07
- 1,000 posts (30 days): ~$0.65
- 3,000 posts (90 days): ~$2.00

*Note: Sentiment results are cached for 7 days to reduce costs*

---

## Troubleshooting

### "Nothing loading on dashboard"
→ You need to initialize data first:
- **Mock**: Visit `/api/init`
- **Real**: Run `/api/reddit/sync` with credentials

### "Reddit API credentials not configured"
→ Check your `.env.local` file has:
- `REDDIT_CLIENT_ID`
- `REDDIT_CLIENT_SECRET`
- Restart dev server after adding

### "OpenAI API key not configured"
→ Add `OPENAI_API_KEY=sk-...` to `.env.local` and restart

### "Data disappears after restart"
→ This is expected - data is in-memory only
→ For production: Use PostgreSQL/SQLite (see below)

---

## Production Setup

For persistent data that survives restarts:

1. **Replace In-Memory Database** with PostgreSQL or SQLite
2. **Add Background Jobs** for automatic 30-min syncing
3. **Set up Redis** for caching
4. **Deploy to Vercel/Railway** with environment variables

See `docs/PRD.md` and design specs in `.claude/outputs/design/` for architecture details.
