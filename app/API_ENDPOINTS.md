# API Endpoints Reference

## Data Initialization

### Initialize Mock Data
```bash
GET http://localhost:3000/api/init
```

**Response:**
```json
{
  "success": true,
  "message": "Sample data initialized successfully"
}
```

**What it does:**
- Generates 90 days of mock Reddit sentiment data
- Creates sample posts from r/ClaudeAI, r/ClaudeCode, r/Anthropic
- Populates in-memory database with realistic patterns

---

## Real Data Sync

### Sync Real Reddit Data
```bash
POST http://localhost:3000/api/reddit/sync
Content-Type: application/json

{
  "days": 7  // Optional, defaults to 7
}
```

**Response:**
```json
{
  "success": true,
  "message": "Reddit data synced successfully",
  "stats": {
    "totalProcessed": 150,
    "subreddits": ["ClaudeAI", "ClaudeCode", "Anthropic"],
    "datesAggregated": 7
  }
}
```

**Requirements:**
- `REDDIT_CLIENT_ID` in .env.local
- `REDDIT_CLIENT_SECRET` in .env.local
- `OPENAI_API_KEY` in .env.local

**What it does:**
1. Fetches real posts from Reddit API
2. Analyzes sentiment with OpenAI GPT-3.5-turbo
3. Stores scored items in database
4. Aggregates daily summaries

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/reddit/sync \
  -H "Content-Type: application/json" \
  -d '{"days": 7}'
```

---

## Data Management

### Clear All Data
```bash
POST http://localhost:3000/api/data/clear
```

**Response:**
```json
{
  "success": true,
  "message": "All data cleared successfully. Database will be re-initialized on next use."
}
```

**What it does:**
- Clears all data from in-memory database
- Resets to empty state
- Next data operation will start fresh

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/data/clear
```

---

## Dashboard Data

### Get Aggregated Sentiment Data
```bash
GET http://localhost:3000/api/sentiment/aggregate?subreddit=all&timeRange=30d
```

**Query Parameters:**
- `subreddit`: `all`, `claudeai`, `claudecode`, or `anthropic`
- `timeRange`: `7d`, `30d`, or `90d`

**Response:**
```json
{
  "success": true,
  "data": {
    "subreddit": "all",
    "timeRange": "30d",
    "aggregates": [
      {
        "date": "2025-10-02",
        "sentimentScore": 0.45,
        "volume": 125,
        "positiveCount": 75,
        "neutralCount": 30,
        "negativeCount": 20,
        "topKeywords": [
          { "keyword": "amazing", "count": 15 },
          { "keyword": "helpful", "count": 12 }
        ]
      }
    ],
    "summary": {
      "averageSentiment": 0.45,
      "totalVolume": 3750,
      "positivePercentage": 60.5,
      "negativePercentage": 15.2,
      "trendDirection": "up"
    }
  },
  "meta": {
    "lastUpdated": "2025-10-02T12:00:00Z",
    "cacheHit": false
  }
}
```

---

### Get Sample Posts for a Day
```bash
GET http://localhost:3000/api/sentiment/samples?subreddit=all&date=2025-10-02
```

**Query Parameters:**
- `subreddit`: Subreddit filter
- `date`: Date in YYYY-MM-DD format

**Response:**
```json
{
  "success": true,
  "data": {
    "subreddit": "all",
    "date": "2025-10-02",
    "samples": [
      {
        "id": "abc123",
        "author": "user_123",
        "content": "Claude Code is amazing! It helps me code so much faster...",
        "sentiment": "positive",
        "confidence": 0.92,
        "score": 45,
        "permalink": "https://reddit.com/r/ClaudeAI/comments/abc123",
        "timestamp": 1696248000
      }
    ],
    "totalCount": 10
  }
}
```

---

### Export Data as CSV
```bash
GET http://localhost:3000/api/export/csv?subreddit=all&timeRange=30d
```

**Query Parameters:**
- `subreddit`: Subreddit filter
- `timeRange`: Time range for export

**Response:** CSV file download

**CSV Format:**
```csv
Date,Subreddit,Sentiment Score,Volume,Positive Count,Neutral Count,Negative Count,Positive %,Negative %,Avg Confidence
2025-10-02,all,0.450,125,75,30,20,60.0%,16.0%,0.850
```

---

## Usage Workflows

### Workflow 1: Demo with Mock Data
```bash
# 1. Initialize mock data
curl http://localhost:3000/api/init

# 2. View dashboard
open http://localhost:3000/dashboard

# 3. Export data
open http://localhost:3000/api/export/csv?subreddit=all&timeRange=30d
```

### Workflow 2: Production with Real Data
```bash
# 1. Set up .env.local with credentials

# 2. Clear any existing data
curl -X POST http://localhost:3000/api/data/clear

# 3. Sync real Reddit data (7 days)
curl -X POST http://localhost:3000/api/reddit/sync \
  -H "Content-Type: application/json" \
  -d '{"days": 7}'

# 4. View dashboard with real data
open http://localhost:3000/dashboard
```

### Workflow 3: Daily Updates
```bash
# Run this daily to get new posts
curl -X POST http://localhost:3000/api/reddit/sync \
  -H "Content-Type: application/json" \
  -d '{"days": 1}'
```

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

**Common Error Codes:**
- `400`: Missing credentials or invalid parameters
- `500`: Server error (API failure, processing error)

**Example Errors:**

**Missing Reddit Credentials:**
```json
{
  "success": false,
  "error": "Reddit API credentials not configured. Please set REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET in .env.local"
}
```

**Missing OpenAI Key:**
```json
{
  "success": false,
  "error": "OpenAI API key not configured. Please set OPENAI_API_KEY in .env.local"
}
```
