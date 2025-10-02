# System Integration Architecture
## Claude Code Sentiment Monitor

**Project:** Claude Code Sentiment Monitor
**Version:** 1.0
**Date:** 2025-10-02
**Architect:** System Architect Agent

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [API Route Specifications](#api-route-specifications)
4. [Frontend-Backend Data Flow](#frontend-backend-data-flow)
5. [State Management Strategy](#state-management-strategy)
6. [Service Architecture](#service-architecture)
7. [Data Pipeline Design](#data-pipeline-design)
8. [Dependency Injection & Configuration](#dependency-injection--configuration)
9. [Error Handling & Retry Patterns](#error-handling--retry-patterns)
10. [Critical Implementation Sequencing](#critical-implementation-sequencing)

---

## Executive Summary

The Claude Code Sentiment Monitor is a Next.js 15 full-stack application that tracks and visualizes Reddit sentiment about Claude Code. This document provides the comprehensive system integration architecture, connecting all layers from Reddit API ingestion through OpenAI sentiment analysis to the frontend dashboard.

**Key Architectural Decisions:**

- **Next.js 15 App Router**: Leveraging Server Components for initial data fetching, Client Components for interactivity
- **Multi-layer Caching**: Reddit data (7 days) + sentiment analysis results (7 days) to minimize API costs
- **Background Job Orchestration**: 30-minute polling cycle with robust error recovery
- **Service-Oriented Architecture**: Clear separation between data ingestion, processing, analysis, and serving layers
- **API-First Design**: RESTful API routes enable future mobile/external clients

**Technology Stack:**
- Frontend: Next.js 15, React 19, Tailwind CSS, Recharts
- Backend: Next.js API Routes, PostgreSQL/SQLite
- External APIs: Reddit OAuth API, OpenAI GPT-4 API
- Background Jobs: Node.js cron or Vercel Cron
- Caching: In-memory + database-backed

---

## Architecture Overview

### High-Level System Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND LAYER                              │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Next.js 15 App Router (React 19)                            │  │
│  │  ┌─────────────────────┐  ┌─────────────────────────────┐   │  │
│  │  │ Server Components   │  │ Client Components           │   │  │
│  │  │ - Initial data load │  │ - Charts (Recharts)         │   │  │
│  │  │ - SEO metadata      │  │ - Tab switching             │   │  │
│  │  │ - Async params      │  │ - Drill-down modals         │   │  │
│  │  └─────────────────────┘  └─────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                    ↕ HTTP/REST
┌─────────────────────────────────────────────────────────────────────┐
│                         API LAYER (Next.js Routes)                  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  /api/sentiment/aggregate     - Get aggregated daily data    │  │
│  │  /api/sentiment/samples       - Get sample posts for a day   │  │
│  │  /api/reddit/sync             - Trigger Reddit data sync     │  │
│  │  /api/export/csv              - Export data to CSV           │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                    ↕
┌─────────────────────────────────────────────────────────────────────┐
│                      SERVICE LAYER                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │ RedditAPI    │  │ SentimentAPI │  │ AggregationService       │  │
│  │ Service      │  │ Service      │  │                          │  │
│  │              │  │              │  │ - Daily rollups          │  │
│  │ - OAuth      │  │ - OpenAI     │  │ - Keyword extraction     │  │
│  │ - Fetch      │  │ - Caching    │  │ - Trend calculation      │  │
│  │ - Cache      │  │ - Batching   │  │                          │  │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                    ↕
┌─────────────────────────────────────────────────────────────────────┐
│                      DATA PIPELINE                                  │
│  ┌──────┐  ┌──────┐  ┌─────────┐  ┌───────────┐  ┌──────────┐    │
│  │Ingest│→│Clean │→│ Analyze │→│ Aggregate │→│  Serve   │    │
│  │      │  │      │  │         │  │           │  │          │    │
│  │Reddit│  │Norm  │  │Sentiment│  │Daily Roll │  │API       │    │
│  │API   │  │Dedup │  │Scoring  │  │Keyword    │  │Routes    │    │
│  │      │  │Filter│  │         │  │Trends     │  │          │    │
│  └──────┘  └──────┘  └─────────┘  └───────────┘  └──────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                                    ↕
┌─────────────────────────────────────────────────────────────────────┐
│                      STORAGE LAYER                                  │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  PostgreSQL / SQLite                                       │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐   │    │
│  │  │raw_posts    │  │scored_posts │  │daily_aggregates  │   │    │
│  │  │             │  │             │  │                  │   │    │
│  │  │- Reddit data│  │- Sentiment  │  │- Summary metrics │   │    │
│  │  │- Timestamps │  │- Confidence │  │- Keyword counts  │   │    │
│  │  └─────────────┘  └─────────────┘  └──────────────────┘   │    │
│  └────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                                    ↕
┌─────────────────────────────────────────────────────────────────────┐
│                   BACKGROUND JOBS                                   │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Cron Job (Every 30 minutes)                                 │  │
│  │  1. Fetch new Reddit posts/comments                          │  │
│  │  2. Clean and normalize text                                 │  │
│  │  3. Score sentiment (batched)                                │  │
│  │  4. Update aggregations                                      │  │
│  │  5. Invalidate frontend cache                                │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                    ↕
┌─────────────────────────────────────────────────────────────────────┐
│                   EXTERNAL APIS                                     │
│  ┌──────────────────────┐         ┌──────────────────────────┐    │
│  │  Reddit OAuth API    │         │  OpenAI API (GPT-4)      │    │
│  │  - r/ClaudeAI        │         │  - Sentiment analysis    │    │
│  │  - r/ClaudeCode      │         │  - Batch processing      │    │
│  │  - r/Anthropic       │         │  - Cost optimization     │    │
│  └──────────────────────┘         └──────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

**1. Initial Page Load (Server-Side):**
```
User → Next.js Server Component → API Route → AggregationService → Database → Response
```

**2. Client Interaction (Tab Switch):**
```
User Click → Client Component → API Route → Cached/Fresh Data → Update UI
```

**3. Background Sync (Every 30min):**
```
Cron Trigger → RedditAPI → Clean → SentimentAPI → Aggregate → Database → Cache Invalidation
```

---

## API Route Specifications

### 1. GET /api/sentiment/aggregate

**Purpose**: Fetch aggregated daily sentiment data for charting and metrics.

**Request Schema:**
```typescript
interface AggregateRequest {
  subreddit?: 'claudeai' | 'claudecode' | 'anthropic' | 'all';
  timeRange?: '7d' | '30d' | '90d';
  startDate?: string; // ISO 8601
  endDate?: string;   // ISO 8601
}

// Query Parameters
GET /api/sentiment/aggregate?subreddit=all&timeRange=30d
```

**Response Schema:**
```typescript
interface AggregateResponse {
  success: boolean;
  data: {
    subreddit: string;
    timeRange: string;
    aggregates: DailyAggregate[];
    summary: SummaryMetrics;
  };
  meta: {
    lastUpdated: string;
    cacheHit: boolean;
  };
}

interface DailyAggregate {
  date: string; // YYYY-MM-DD
  sentimentScore: number; // -1 to 1
  volume: number; // Total posts + comments
  positiveCount: number;
  neutralCount: number;
  negativeCount: number;
  positivePercent: number;
  neutralPercent: number;
  negativePercent: number;
  topKeywords: KeywordCount[];
  avgConfidence: number;
}

interface SummaryMetrics {
  avgSentiment: number;
  totalVolume: number;
  positivePercent: number;
  negativePercent: number;
  trendChange: number; // % change from previous period
  volumeTrend: number; // % change in volume
}

interface KeywordCount {
  keyword: string;
  count: number;
  trend?: number; // % change from previous period
}
```

**Response Examples:**

Success (200):
```json
{
  "success": true,
  "data": {
    "subreddit": "all",
    "timeRange": "30d",
    "aggregates": [
      {
        "date": "2025-09-24",
        "sentimentScore": 0.64,
        "volume": 147,
        "positiveCount": 105,
        "neutralCount": 28,
        "negativeCount": 14,
        "positivePercent": 71.4,
        "neutralPercent": 19.0,
        "negativePercent": 9.5,
        "topKeywords": [
          { "keyword": "cursor", "count": 42, "trend": 15.3 },
          { "keyword": "MCP", "count": 28, "trend": -5.2 }
        ],
        "avgConfidence": 0.87
      }
    ],
    "summary": {
      "avgSentiment": 0.42,
      "totalVolume": 1247,
      "positivePercent": 62.3,
      "negativePercent": 14.5,
      "trendChange": 8.2,
      "volumeTrend": -3.1
    }
  },
  "meta": {
    "lastUpdated": "2025-10-02T11:30:00Z",
    "cacheHit": true
  }
}
```

Error (500):
```json
{
  "success": false,
  "error": {
    "code": "DATABASE_ERROR",
    "message": "Failed to fetch aggregated data",
    "details": "Connection timeout"
  }
}
```

**Caching Strategy:**
- Cache key: `aggregate:${subreddit}:${timeRange}:${startDate}:${endDate}`
- TTL: 5 minutes for current data, 1 hour for historical data
- Invalidation: On background job completion

**Error Handling:**
- 400: Invalid query parameters
- 404: No data available for time range
- 500: Database or service errors
- 503: Service temporarily unavailable (rate limit hit)

---

### 2. GET /api/sentiment/samples

**Purpose**: Fetch sample posts/comments for a specific day (drill-down view).

**Request Schema:**
```typescript
interface SamplesRequest {
  date: string; // YYYY-MM-DD (required)
  subreddit?: 'claudeai' | 'claudecode' | 'anthropic' | 'all';
  page?: number; // Default: 1
  limit?: number; // Default: 10, Max: 50
  sortBy?: 'score' | 'sentiment' | 'confidence' | 'time';
  order?: 'asc' | 'desc';
}

GET /api/sentiment/samples?date=2025-09-24&subreddit=all&page=1&limit=10&sortBy=score&order=desc
```

**Response Schema:**
```typescript
interface SamplesResponse {
  success: boolean;
  data: {
    date: string;
    subreddit: string;
    samples: SampleItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    daySummary: DailyAggregate; // Same as aggregate endpoint
  };
}

interface SampleItem {
  id: string;
  type: 'post' | 'comment';
  subreddit: string;
  author: string;
  timestamp: string; // ISO 8601
  title?: string; // For posts
  content: string; // Cleaned text
  contentPreview: string; // First 200 chars
  score: number; // Reddit score
  numComments?: number; // For posts
  sentiment: {
    label: 'positive' | 'neutral' | 'negative';
    score: number; // -1 to 1
    confidence: number; // 0 to 1
  };
  redditUrl: string; // Direct link to Reddit
  flair?: string;
}
```

**Response Example:**

Success (200):
```json
{
  "success": true,
  "data": {
    "date": "2025-09-24",
    "subreddit": "all",
    "samples": [
      {
        "id": "abc123",
        "type": "post",
        "subreddit": "r/ClaudeAI",
        "author": "developer_jane",
        "timestamp": "2025-09-24T12:34:00Z",
        "title": "Just tried the new Claude Code cursor integration",
        "content": "Just tried the new Claude Code cursor integration - absolutely amazing! The MCP feature...",
        "contentPreview": "Just tried the new Claude Code cursor integration - absolutely amazing! The MCP feature makes it so much easier to...",
        "score": 84,
        "numComments": 23,
        "sentiment": {
          "label": "positive",
          "score": 0.87,
          "confidence": 0.94
        },
        "redditUrl": "https://reddit.com/r/ClaudeAI/comments/abc123",
        "flair": "Discussion"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 147,
      "totalPages": 15
    },
    "daySummary": {
      "date": "2025-09-24",
      "sentimentScore": 0.64,
      "volume": 147,
      "positivePercent": 71.4,
      "negativePercent": 9.5
    }
  }
}
```

**Caching Strategy:**
- Cache key: `samples:${date}:${subreddit}:${page}:${sortBy}`
- TTL: 10 minutes for current day, 1 day for historical data
- Pagination cached separately

**Error Handling:**
- 400: Invalid date format or parameters
- 404: No samples available for date
- 500: Database errors

---

### 3. POST /api/reddit/sync

**Purpose**: Trigger manual Reddit data sync (admin/debug endpoint).

**Request Schema:**
```typescript
interface SyncRequest {
  mode: 'incremental' | 'backfill';
  subreddits?: string[]; // Default: all configured
  sinceDays?: number; // For backfill mode
  dryRun?: boolean; // Preview only
}

POST /api/reddit/sync
{
  "mode": "incremental",
  "subreddits": ["claudeai", "claudecode"],
  "dryRun": false
}
```

**Response Schema:**
```typescript
interface SyncResponse {
  success: boolean;
  data: {
    jobId: string;
    status: 'started' | 'completed' | 'failed';
    stats: {
      postsIngested: number;
      commentsIngested: number;
      duplicatesSkipped: number;
      errorsEncountered: number;
    };
    timing: {
      startedAt: string;
      completedAt?: string;
      durationMs?: number;
    };
  };
}
```

**Response Example:**

Success (200):
```json
{
  "success": true,
  "data": {
    "jobId": "sync-20251002-113000",
    "status": "completed",
    "stats": {
      "postsIngested": 42,
      "commentsIngested": 187,
      "duplicatesSkipped": 15,
      "errorsEncountered": 0
    },
    "timing": {
      "startedAt": "2025-10-02T11:30:00Z",
      "completedAt": "2025-10-02T11:32:45Z",
      "durationMs": 165000
    }
  }
}
```

**Authentication:**
- Require API key or admin token
- Rate limit: 1 request per 5 minutes

**Error Handling:**
- 401: Unauthorized
- 429: Rate limit exceeded (sync already in progress)
- 500: Sync job failed
- 503: Reddit API unavailable

---

### 4. GET /api/export/csv

**Purpose**: Export sentiment data to CSV format.

**Request Schema:**
```typescript
interface ExportRequest {
  subreddit?: 'claudeai' | 'claudecode' | 'anthropic' | 'all';
  timeRange?: '7d' | '30d' | '90d';
  startDate?: string;
  endDate?: string;
  includeRaw?: boolean; // Include raw samples (default: false)
}

GET /api/export/csv?subreddit=all&timeRange=30d&includeRaw=false
```

**Response:**
- Content-Type: `text/csv`
- Content-Disposition: `attachment; filename=sentiment-monitor-all-30d-20251002.csv`

**CSV Format (Aggregates Only):**
```csv
Date,Subreddit,Sentiment Score,Volume,Positive %,Neutral %,Negative %,Top Keywords,Avg Confidence
2025-09-24,all,0.64,147,71.4,19.0,9.5,"cursor,MCP,agent",0.87
2025-09-25,all,0.52,134,65.2,22.4,12.4,"bug,API,update",0.82
```

**CSV Format (With Raw Samples):**
```csv
Date,Subreddit,Type,Author,Content,Sentiment,Score,Confidence,Reddit URL
2025-09-24,r/ClaudeAI,post,developer_jane,"Just tried the new...",positive,0.87,0.94,https://...
```

**Error Handling:**
- 400: Invalid parameters
- 413: Export too large (>10MB)
- 500: Export generation failed

---

### Authentication & Authorization Strategy

**Current MVP (Public Dashboard):**
- No authentication for read endpoints (aggregate, samples, export)
- API key required for sync endpoint
- Rate limiting: 100 requests/minute per IP

**Future Enhancements:**
- OAuth 2.0 for user accounts
- API keys for programmatic access
- Role-based access control (viewer, analyst, admin)

**Rate Limiting Configuration:**
```typescript
const rateLimits = {
  '/api/sentiment/aggregate': { requests: 60, window: '1m' },
  '/api/sentiment/samples': { requests: 30, window: '1m' },
  '/api/reddit/sync': { requests: 1, window: '5m', requireAuth: true },
  '/api/export/csv': { requests: 5, window: '1h' }
};
```

---

## Frontend-Backend Data Flow

### Initial Page Load (Server Components)

**Flow Diagram:**
```
User Navigates to Dashboard
        ↓
Next.js Server Component (page.tsx)
        ↓
Fetch default data (subreddit='all', timeRange='30d')
        ↓
Server-side API call to /api/sentiment/aggregate
        ↓
AggregationService queries database
        ↓
Returns aggregated data + cache headers
        ↓
Server Component renders HTML with initial data
        ↓
Hydration with Client Components
        ↓
Client Components mount (charts, tabs, controls)
        ↓
Page ready for interaction
```

**Implementation:**
```typescript
// app/page.tsx (Server Component)
export default async function DashboardPage({
  searchParams
}: {
  searchParams: Promise<{ subreddit?: string; timeRange?: string }>
}) {
  const params = await searchParams;
  const subreddit = params.subreddit || 'all';
  const timeRange = params.timeRange || '30d';

  // Server-side data fetch
  const aggregateData = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/sentiment/aggregate?subreddit=${subreddit}&timeRange=${timeRange}`,
    {
      cache: 'no-store', // or 'force-cache' for static data
      next: { revalidate: 300 } // Revalidate every 5 minutes
    }
  ).then(res => res.json());

  return (
    <DashboardLayout>
      <DashboardClient initialData={aggregateData} />
    </DashboardLayout>
  );
}
```

**Benefits:**
- SEO-friendly with server-rendered content
- Faster First Contentful Paint (FCP)
- Progressive enhancement
- Reduced client-side JavaScript

---

### Client-Side Data Updates

**Tab Switch Flow:**
```
User clicks r/ClaudeAI tab
        ↓
Client Component updates local state
        ↓
Check if data exists in client cache
        ↓
If cached: Update UI immediately
        ↓
If not cached: Fetch from /api/sentiment/aggregate
        ↓
Show loading overlay on charts
        ↓
API returns data
        ↓
Update client cache
        ↓
Animate transition to new data
        ↓
Update URL query params (for shareable links)
```

**Implementation:**
```typescript
// components/DashboardClient.tsx (Client Component)
'use client';

export function DashboardClient({ initialData }: { initialData: AggregateResponse }) {
  const [subreddit, setSubreddit] = useState('all');
  const [timeRange, setTimeRange] = useState('30d');

  // React Query for client-side data fetching
  const { data, isLoading, error } = useQuery({
    queryKey: ['aggregate', subreddit, timeRange],
    queryFn: () => fetchAggregate({ subreddit, timeRange }),
    initialData: initialData,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false
  });

  const handleTabChange = (newSubreddit: string) => {
    setSubreddit(newSubreddit);
    // Update URL without page reload
    window.history.pushState(null, '', `/?subreddit=${newSubreddit}&timeRange=${timeRange}`);
  };

  return (
    <>
      <SubredditTabs active={subreddit} onChange={handleTabChange} />
      {isLoading && <ChartLoadingOverlay />}
      {data && <ChartsSection data={data.aggregates} />}
    </>
  );
}
```

---

### Drill-Down Modal Flow

**Flow Diagram:**
```
User clicks chart point (date: 2025-09-24)
        ↓
Client Component captures click event
        ↓
Extract date from chart data point
        ↓
Open modal with loading state
        ↓
Fetch /api/sentiment/samples?date=2025-09-24
        ↓
API returns sample posts/comments
        ↓
Render sample cards in modal
        ↓
User scrolls, clicks "Load More"
        ↓
Fetch next page (page=2)
        ↓
Append to existing samples
        ↓
User clicks "View on Reddit" → Opens new tab
```

**Implementation:**
```typescript
// components/SentimentChart.tsx
'use client';

export function SentimentChart({ data }: { data: DailyAggregate[] }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const handleChartClick = (dataPoint: DailyAggregate) => {
    setSelectedDate(dataPoint.date);
    setModalOpen(true);
  };

  return (
    <>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data} onClick={handleChartClick}>
          {/* Chart configuration */}
        </LineChart>
      </ResponsiveContainer>

      {modalOpen && selectedDate && (
        <DrillDownModal
          date={selectedDate}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}

// components/DrillDownModal.tsx
export function DrillDownModal({ date, onClose }: { date: string; onClose: () => void }) {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['samples', date, page],
    queryFn: () => fetchSamples({ date, page }),
    keepPreviousData: true
  });

  const loadMore = () => setPage(prev => prev + 1);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Daily Detail - {date}</DialogTitle>
        </DialogHeader>

        {isLoading && <Skeleton />}

        {data && (
          <>
            <DaySummaryMetrics summary={data.daySummary} />
            <SamplesList samples={data.samples} />
            {data.pagination.page < data.pagination.totalPages && (
              <Button onClick={loadMore}>Load More</Button>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

---

### Real-Time Data Refresh Strategy

**Polling Approach (MVP):**
```
Background job completes (every 30 min)
        ↓
Invalidate server cache
        ↓
Client polls /api/sentiment/aggregate with If-None-Match header
        ↓
If data changed: Return 200 with new data
        ↓
If no change: Return 304 Not Modified
        ↓
Client updates UI if data changed
```

**Implementation:**
```typescript
// components/DashboardClient.tsx
'use client';

export function DashboardClient({ initialData }: { initialData: AggregateResponse }) {
  const { data } = useQuery({
    queryKey: ['aggregate', subreddit, timeRange],
    queryFn: () => fetchAggregate({ subreddit, timeRange }),
    refetchInterval: 5 * 60 * 1000, // Poll every 5 minutes
    refetchIntervalInBackground: false
  });

  // Show toast notification when new data arrives
  useEffect(() => {
    if (data?.meta.lastUpdated !== initialData.meta.lastUpdated) {
      toast.info('Dashboard updated with latest data');
    }
  }, [data]);

  return <>{/* Dashboard UI */}</>;
}
```

**Future Enhancement (WebSockets):**
- Establish WebSocket connection on page load
- Server pushes updates when background job completes
- Client invalidates queries and refetches
- More efficient than polling

---

### Optimistic UI Updates

**Not Required for MVP** (data is read-only), but future considerations:

**For User Annotations (Future):**
```typescript
const mutation = useMutation({
  mutationFn: (annotation) => saveAnnotation(annotation),
  onMutate: async (newAnnotation) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries(['samples', date]);

    // Snapshot previous value
    const previous = queryClient.getQueryData(['samples', date]);

    // Optimistically update
    queryClient.setQueryData(['samples', date], (old) => ({
      ...old,
      samples: old.samples.map(s =>
        s.id === newAnnotation.sampleId
          ? { ...s, userAnnotation: newAnnotation }
          : s
      )
    }));

    return { previous };
  },
  onError: (err, variables, context) => {
    // Rollback on error
    queryClient.setQueryData(['samples', date], context.previous);
  }
});
```

---

### Error Boundary Handling

**Component-Level Error Boundaries:**
```typescript
// components/ErrorBoundary.tsx
'use client';

export class ChartErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Chart error:', error, errorInfo);
    // Send to error tracking service (Sentry, etc.)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="chart-error">
          <AlertCircle className="w-12 h-12 text-amber-500" />
          <h3>Failed to load chart</h3>
          <p>{this.state.error?.message}</p>
          <Button onClick={() => this.setState({ hasError: false })}>
            Retry
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Usage in parent component
<ChartErrorBoundary>
  <SentimentChart data={data} />
</ChartErrorBoundary>
```

**API Error Handling:**
```typescript
// lib/api-client.ts
export async function fetchAggregate(params: AggregateRequest): Promise<AggregateResponse> {
  try {
    const response = await fetch(`/api/sentiment/aggregate?${new URLSearchParams(params)}`);

    if (!response.ok) {
      const error = await response.json();
      throw new APIError(error.code, error.message, response.status);
    }

    return response.json();
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    // Network error
    throw new APIError('NETWORK_ERROR', 'Failed to connect to server', 0);
  }
}

// Custom error class
export class APIError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number
  ) {
    super(message);
    this.name = 'APIError';
  }
}
```

---

## State Management Strategy

### Server State vs Client State Separation

**Server State (Managed by React Query):**
- Aggregated sentiment data
- Sample posts/comments
- Export data
- Sync job status

**Client State (Managed by React Context or Zustand):**
- Active subreddit tab
- Selected time range
- Modal open/close state
- Chart zoom/pan state (if implemented)
- User preferences (theme, chart type)

---

### React Query Configuration

**Query Client Setup:**
```typescript
// lib/query-client.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error instanceof APIError && error.status >= 400 && error.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
    },
    mutations: {
      retry: false
    }
  }
});

// Prefetch strategies
export async function prefetchDashboardData(subreddit: string, timeRange: string) {
  await queryClient.prefetchQuery({
    queryKey: ['aggregate', subreddit, timeRange],
    queryFn: () => fetchAggregate({ subreddit, timeRange })
  });
}
```

**Provider Setup:**
```typescript
// app/providers.tsx
'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

---

### Chart Data Management

**Option 1: React Context (Lightweight)**
```typescript
// contexts/ChartContext.tsx
'use client';

interface ChartState {
  hoveredDate: string | null;
  selectedDateRange: [string, string] | null;
  zoomLevel: number;
}

const ChartContext = createContext<{
  state: ChartState;
  dispatch: React.Dispatch<ChartAction>;
} | null>(null);

export function ChartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(chartReducer, initialState);

  return (
    <ChartContext.Provider value={{ state, dispatch }}>
      {children}
    </ChartContext.Provider>
  );
}

export function useChart() {
  const context = useContext(ChartContext);
  if (!context) throw new Error('useChart must be used within ChartProvider');
  return context;
}
```

**Option 2: Zustand (More Features)**
```typescript
// stores/chartStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface ChartStore {
  hoveredDate: string | null;
  selectedDateRange: [string, string] | null;
  zoomLevel: number;
  setHoveredDate: (date: string | null) => void;
  setDateRange: (range: [string, string] | null) => void;
  setZoomLevel: (level: number) => void;
}

export const useChartStore = create<ChartStore>()(
  devtools(
    persist(
      (set) => ({
        hoveredDate: null,
        selectedDateRange: null,
        zoomLevel: 1,
        setHoveredDate: (date) => set({ hoveredDate: date }),
        setDateRange: (range) => set({ selectedDateRange: range }),
        setZoomLevel: (level) => set({ zoomLevel: level })
      }),
      { name: 'chart-storage' }
    )
  )
);
```

**Recommendation:** Use React Context for MVP (simpler), migrate to Zustand if complexity grows.

---

### Cache Invalidation on Tab/Time Range Changes

**Strategy:**
```typescript
// hooks/useDashboardData.ts
export function useDashboardData(subreddit: string, timeRange: string) {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['aggregate', subreddit, timeRange],
    queryFn: () => fetchAggregate({ subreddit, timeRange }),
    staleTime: 5 * 60 * 1000
  });

  // Prefetch adjacent data for faster navigation
  useEffect(() => {
    const adjacentSubreddits = getAdjacentSubreddits(subreddit);
    adjacentSubreddits.forEach(sub => {
      queryClient.prefetchQuery({
        queryKey: ['aggregate', sub, timeRange],
        queryFn: () => fetchAggregate({ subreddit: sub, timeRange })
      });
    });
  }, [subreddit, timeRange]);

  return { data, isLoading, error };
}

function getAdjacentSubreddits(current: string): string[] {
  const subreddits = ['all', 'claudeai', 'claudecode', 'anthropic'];
  const index = subreddits.indexOf(current);
  return [
    subreddits[index - 1],
    subreddits[index + 1]
  ].filter(Boolean);
}
```

---

### Loading and Error States

**Loading State Patterns:**
```typescript
// components/LoadingStates.tsx

// Skeleton loader for metric cards
export function MetricCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-4 bg-slate-700 rounded w-1/2 mb-2"></div>
      <div className="h-8 bg-slate-700 rounded w-3/4 mb-1"></div>
      <div className="h-3 bg-slate-700 rounded w-1/3"></div>
    </div>
  );
}

// Skeleton loader for charts
export function ChartSkeleton() {
  return (
    <div className="animate-pulse h-[320px] bg-slate-800 rounded-lg flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
    </div>
  );
}

// Loading overlay for chart updates
export function ChartLoadingOverlay() {
  return (
    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-10">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="w-6 h-6 animate-spin text-sky-400" />
        <p className="text-sm text-slate-300">Updating chart...</p>
      </div>
    </div>
  );
}
```

**Error State Components:**
```typescript
// components/ErrorStates.tsx

export function ChartError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="h-[320px] border border-amber-500/30 bg-amber-500/10 rounded-lg flex flex-col items-center justify-center gap-4">
      <AlertCircle className="w-12 h-12 text-amber-500" />
      <div className="text-center">
        <h3 className="text-lg font-semibold text-slate-100 mb-1">Failed to load chart</h3>
        <p className="text-sm text-slate-400 mb-4">{error.message}</p>
        <Button onClick={onRetry} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    </div>
  );
}

export function APIErrorToast({ error }: { error: APIError }) {
  const getMessage = () => {
    switch (error.code) {
      case 'RATE_LIMIT_EXCEEDED':
        return 'Too many requests. Please wait a moment.';
      case 'DATABASE_ERROR':
        return 'Database connection failed. We\'re working on it.';
      case 'NETWORK_ERROR':
        return 'Network connection lost. Check your internet.';
      default:
        return error.message;
    }
  };

  return (
    <div className="flex items-start gap-3">
      <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
      <div>
        <p className="font-medium text-slate-100">{getMessage()}</p>
        {error.code && (
          <p className="text-sm text-slate-400 mt-1">Error code: {error.code}</p>
        )}
      </div>
    </div>
  );
}
```

---

## Service Architecture

### Service Layer Design Principles

1. **Single Responsibility**: Each service handles one domain
2. **Dependency Injection**: Services receive dependencies via constructor
3. **Interface-Based**: Services implement interfaces for testability
4. **Stateless**: Services don't maintain state between requests
5. **Error Handling**: Services throw typed errors, routes handle HTTP responses

---

### Reddit API Service

**Purpose**: Manage all interactions with Reddit's OAuth API, including authentication, data fetching, and caching.

**Interface Definition:**
```typescript
// services/reddit/reddit-api.interface.ts
export interface RedditAPIService {
  // Authentication
  authenticate(): Promise<RedditAccessToken>;
  refreshToken(): Promise<RedditAccessToken>;

  // Data fetching
  fetchSubredditPosts(subreddit: string, options: FetchOptions): Promise<RedditPost[]>;
  fetchPostComments(postId: string, options: FetchOptions): Promise<RedditComment[]>;

  // Caching
  getCachedPosts(subreddit: string, since: Date): Promise<RedditPost[]>;
  cachePosts(posts: RedditPost[]): Promise<void>;
}

export interface FetchOptions {
  limit?: number;
  after?: string; // Pagination cursor
  before?: string;
  sort?: 'hot' | 'new' | 'top' | 'rising';
  timeRange?: 'hour' | 'day' | 'week' | 'month' | 'year' | 'all';
}

export interface RedditPost {
  id: string;
  subreddit: string;
  author: string;
  title: string;
  selftext: string;
  score: number;
  num_comments: number;
  created_utc: number;
  link_flair_text?: string;
  permalink: string;
  is_self: boolean;
  removed?: boolean;
  deleted?: boolean;
}

export interface RedditComment {
  id: string;
  post_id: string;
  subreddit: string;
  author: string;
  body: string;
  score: number;
  created_utc: number;
  permalink: string;
  parent_id: string;
  removed?: boolean;
  deleted?: boolean;
}
```

**Implementation:**
```typescript
// services/reddit/reddit-api.service.ts
import Snoowrap from 'snoowrap';
import { RedditAPIService, RedditPost, FetchOptions } from './reddit-api.interface';
import { RedditCache } from './reddit-cache';

export class RedditAPIServiceImpl implements RedditAPIService {
  private client: Snoowrap;
  private cache: RedditCache;

  constructor(
    private config: {
      clientId: string;
      clientSecret: string;
      refreshToken: string;
      userAgent: string;
    },
    cache: RedditCache
  ) {
    this.cache = cache;
    this.client = new Snoowrap({
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      refreshToken: config.refreshToken,
      userAgent: config.userAgent
    });
  }

  async authenticate(): Promise<RedditAccessToken> {
    // Snoowrap handles OAuth automatically
    return {
      accessToken: this.client.accessToken,
      expiresAt: Date.now() + 3600 * 1000
    };
  }

  async fetchSubredditPosts(
    subreddit: string,
    options: FetchOptions = {}
  ): Promise<RedditPost[]> {
    // Check cache first (7-day retention)
    const cacheKey = `posts:${subreddit}:${JSON.stringify(options)}`;
    const cached = await this.cache.get<RedditPost[]>(cacheKey);

    if (cached) {
      console.log(`Cache hit for ${cacheKey}`);
      return cached;
    }

    // Fetch from Reddit
    const posts = await this.client
      .getSubreddit(subreddit)
      .getNew({
        limit: options.limit || 100,
        after: options.after,
        before: options.before
      });

    const mappedPosts = posts.map(p => ({
      id: p.id,
      subreddit: p.subreddit.display_name,
      author: p.author.name,
      title: p.title,
      selftext: p.selftext,
      score: p.score,
      num_comments: p.num_comments,
      created_utc: p.created_utc,
      link_flair_text: p.link_flair_text,
      permalink: p.permalink,
      is_self: p.is_self,
      removed: p.removed,
      deleted: p.author.name === '[deleted]'
    }));

    // Cache for 7 days
    await this.cache.set(cacheKey, mappedPosts, 7 * 24 * 60 * 60);

    return mappedPosts;
  }

  async fetchPostComments(
    postId: string,
    options: FetchOptions = {}
  ): Promise<RedditComment[]> {
    const cacheKey = `comments:${postId}`;
    const cached = await this.cache.get<RedditComment[]>(cacheKey);

    if (cached) return cached;

    const submission = await this.client.getSubmission(postId);
    const comments = await submission.comments.fetchAll({
      limit: options.limit || 100
    });

    // Flatten comment tree to top-level comments only
    const topLevelComments = comments
      .filter(c => c.parent_id.startsWith('t3_')) // t3_ = post
      .map(c => ({
        id: c.id,
        post_id: postId,
        subreddit: c.subreddit.display_name,
        author: c.author.name,
        body: c.body,
        score: c.score,
        created_utc: c.created_utc,
        permalink: c.permalink,
        parent_id: c.parent_id,
        removed: c.removed,
        deleted: c.author.name === '[deleted]'
      }));

    await this.cache.set(cacheKey, topLevelComments, 7 * 24 * 60 * 60);

    return topLevelComments;
  }

  async getCachedPosts(subreddit: string, since: Date): Promise<RedditPost[]> {
    // Query cache by time range
    const keys = await this.cache.keys(`posts:${subreddit}:*`);
    const allPosts: RedditPost[] = [];

    for (const key of keys) {
      const posts = await this.cache.get<RedditPost[]>(key);
      if (posts) {
        allPosts.push(
          ...posts.filter(p => p.created_utc * 1000 >= since.getTime())
        );
      }
    }

    return allPosts;
  }

  async cachePosts(posts: RedditPost[]): Promise<void> {
    // Group by subreddit for efficient caching
    const grouped = posts.reduce((acc, post) => {
      if (!acc[post.subreddit]) acc[post.subreddit] = [];
      acc[post.subreddit].push(post);
      return acc;
    }, {} as Record<string, RedditPost[]>);

    for (const [subreddit, subredditPosts] of Object.entries(grouped)) {
      const cacheKey = `posts:${subreddit}:cached`;
      await this.cache.set(cacheKey, subredditPosts, 7 * 24 * 60 * 60);
    }
  }
}
```

**Caching Implementation:**
```typescript
// services/reddit/reddit-cache.ts
import { Redis } from 'ioredis';

export class RedditCache {
  private redis: Redis;

  constructor(redisUrl: string) {
    this.redis = new Redis(redisUrl);
  }

  async get<T>(key: string): Promise<T | null> {
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  async set(key: string, value: any, ttlSeconds: number): Promise<void> {
    await this.redis.setex(key, ttlSeconds, JSON.stringify(value));
  }

  async keys(pattern: string): Promise<string[]> {
    return this.redis.keys(pattern);
  }

  async invalidate(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}
```

---

### OpenAI Sentiment Service

**Purpose**: Analyze sentiment of text content using OpenAI GPT-4, with batching and caching to minimize costs.

**Interface Definition:**
```typescript
// services/sentiment/sentiment-api.interface.ts
export interface SentimentAPIService {
  analyzeSentiment(text: string): Promise<SentimentResult>;
  analyzeBatch(texts: string[]): Promise<SentimentResult[]>;
  getCachedSentiment(textHash: string): Promise<SentimentResult | null>;
  cacheSentiment(textHash: string, result: SentimentResult): Promise<void>;
}

export interface SentimentResult {
  label: 'positive' | 'neutral' | 'negative';
  score: number; // -1 to 1
  confidence: number; // 0 to 1
  reasoning?: string; // Optional explanation
}
```

**Implementation:**
```typescript
// services/sentiment/openai-sentiment.service.ts
import OpenAI from 'openai';
import { createHash } from 'crypto';
import { SentimentAPIService, SentimentResult } from './sentiment-api.interface';
import { SentimentCache } from './sentiment-cache';

export class OpenAISentimentService implements SentimentAPIService {
  private openai: OpenAI;
  private cache: SentimentCache;

  constructor(apiKey: string, cache: SentimentCache) {
    this.openai = new OpenAI({ apiKey });
    this.cache = cache;
  }

  async analyzeSentiment(text: string): Promise<SentimentResult> {
    const textHash = this.hashText(text);

    // Check cache first (7-day retention)
    const cached = await this.getCachedSentiment(textHash);
    if (cached) {
      console.log(`Sentiment cache hit for hash ${textHash}`);
      return cached;
    }

    // Call OpenAI API
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are a sentiment analysis expert. Analyze the sentiment of Reddit posts/comments about Claude Code (an AI coding assistant).

          Respond with a JSON object containing:
          - label: "positive", "neutral", or "negative"
          - score: a number from -1 (very negative) to 1 (very positive)
          - confidence: a number from 0 to 1 indicating confidence in the analysis
          - reasoning: brief explanation (1 sentence)

          Consider context about software development, AI tools, and user feedback.`
        },
        {
          role: 'user',
          content: `Analyze this text:\n\n${text}`
        }
      ],
      temperature: 0.3, // Lower temperature for consistent results
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(completion.choices[0].message.content!) as SentimentResult;

    // Cache result
    await this.cacheSentiment(textHash, result);

    return result;
  }

  async analyzeBatch(texts: string[]): Promise<SentimentResult[]> {
    const results: SentimentResult[] = [];
    const uncachedTexts: { index: number; text: string; hash: string }[] = [];

    // Check cache for each text
    for (let i = 0; i < texts.length; i++) {
      const hash = this.hashText(texts[i]);
      const cached = await this.getCachedSentiment(hash);

      if (cached) {
        results[i] = cached;
      } else {
        uncachedTexts.push({ index: i, text: texts[i], hash });
      }
    }

    // Batch analyze uncached texts (max 20 per request to stay within token limits)
    const batchSize = 20;
    for (let i = 0; i < uncachedTexts.length; i += batchSize) {
      const batch = uncachedTexts.slice(i, i + batchSize);

      const batchResults = await this.analyzeBatchInternal(batch.map(b => b.text));

      // Map results back to original indices
      batch.forEach((item, batchIndex) => {
        const result = batchResults[batchIndex];
        results[item.index] = result;
        this.cacheSentiment(item.hash, result);
      });
    }

    return results;
  }

  private async analyzeBatchInternal(texts: string[]): Promise<SentimentResult[]> {
    const prompt = texts.map((text, i) => `[${i}] ${text}`).join('\n\n');

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `Analyze sentiment for multiple Reddit posts/comments about Claude Code.

          Respond with a JSON array where each element corresponds to the input text index and contains:
          - label: "positive", "neutral", or "negative"
          - score: -1 to 1
          - confidence: 0 to 1

          Keep it concise to fit within token limits.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    const response = JSON.parse(completion.choices[0].message.content!);
    return response.results as SentimentResult[];
  }

  async getCachedSentiment(textHash: string): Promise<SentimentResult | null> {
    return this.cache.get(textHash);
  }

  async cacheSentiment(textHash: string, result: SentimentResult): Promise<void> {
    await this.cache.set(textHash, result, 7 * 24 * 60 * 60); // 7 days
  }

  private hashText(text: string): string {
    return createHash('sha256').update(text.toLowerCase().trim()).digest('hex');
  }
}
```

**Cost Optimization Strategies:**
1. **Aggressive Caching**: 7-day cache for identical texts (hash-based)
2. **Batch Processing**: Analyze up to 20 texts per API call
3. **Incremental Analysis**: Only analyze new/uncached content
4. **Model Selection**: Use GPT-4 Turbo for balance of quality and cost
5. **Temperature Control**: Low temperature (0.3) for consistent results

---

### Aggregation Service

**Purpose**: Compute daily rollups, keyword extraction, and trend calculations.

**Interface Definition:**
```typescript
// services/aggregation/aggregation.interface.ts
export interface AggregationService {
  aggregateDailySentiment(date: string, subreddit?: string): Promise<DailyAggregate>;
  calculateTrends(current: DailyAggregate, previous: DailyAggregate): TrendMetrics;
  extractKeywords(texts: string[], minFrequency?: number): Promise<KeywordCount[]>;
  computeSummaryMetrics(aggregates: DailyAggregate[]): SummaryMetrics;
}

export interface TrendMetrics {
  sentimentChange: number; // % change
  volumeChange: number;
  positiveChange: number;
  negativeChange: number;
}
```

**Implementation:**
```typescript
// services/aggregation/aggregation.service.ts
import { DatabaseService } from '../database/database.interface';
import { AggregationService, DailyAggregate, TrendMetrics } from './aggregation.interface';
import { extractKeywords as extractKeywordsNLP } from '@/lib/nlp-utils';

export class AggregationServiceImpl implements AggregationService {
  constructor(private db: DatabaseService) {}

  async aggregateDailySentiment(
    date: string,
    subreddit: string = 'all'
  ): Promise<DailyAggregate> {
    // Fetch all scored posts/comments for the date
    const scoredItems = await this.db.getScoredItemsByDate(date, subreddit);

    if (scoredItems.length === 0) {
      throw new Error(`No data available for ${date}`);
    }

    // Calculate aggregates
    const positiveCount = scoredItems.filter(i => i.sentiment.label === 'positive').length;
    const neutralCount = scoredItems.filter(i => i.sentiment.label === 'neutral').length;
    const negativeCount = scoredItems.filter(i => i.sentiment.label === 'negative').length;
    const totalCount = scoredItems.length;

    const avgSentiment = scoredItems.reduce((sum, i) => sum + i.sentiment.score, 0) / totalCount;
    const avgConfidence = scoredItems.reduce((sum, i) => sum + i.sentiment.confidence, 0) / totalCount;

    // Extract keywords
    const allTexts = scoredItems.map(i => i.content);
    const keywords = await this.extractKeywords(allTexts, 5);

    return {
      date,
      sentimentScore: avgSentiment,
      volume: totalCount,
      positiveCount,
      neutralCount,
      negativeCount,
      positivePercent: (positiveCount / totalCount) * 100,
      neutralPercent: (neutralCount / totalCount) * 100,
      negativePercent: (negativeCount / totalCount) * 100,
      topKeywords: keywords,
      avgConfidence
    };
  }

  calculateTrends(current: DailyAggregate, previous: DailyAggregate): TrendMetrics {
    const sentimentChange = ((current.sentimentScore - previous.sentimentScore) / Math.abs(previous.sentimentScore)) * 100;
    const volumeChange = ((current.volume - previous.volume) / previous.volume) * 100;
    const positiveChange = ((current.positivePercent - previous.positivePercent) / previous.positivePercent) * 100;
    const negativeChange = ((current.negativePercent - previous.negativePercent) / previous.negativePercent) * 100;

    return {
      sentimentChange: Number(sentimentChange.toFixed(1)),
      volumeChange: Number(volumeChange.toFixed(1)),
      positiveChange: Number(positiveChange.toFixed(1)),
      negativeChange: Number(negativeChange.toFixed(1))
    };
  }

  async extractKeywords(texts: string[], minFrequency: number = 5): Promise<KeywordCount[]> {
    // Use NLP library (e.g., natural, compromise) or custom implementation
    const keywords = await extractKeywordsNLP(texts, {
      minFrequency,
      maxKeywords: 10,
      excludeStopwords: true,
      extractPhrases: true
    });

    return keywords.map(k => ({
      keyword: k.term,
      count: k.frequency,
      trend: 0 // Calculate separately by comparing with previous period
    }));
  }

  async computeSummaryMetrics(aggregates: DailyAggregate[]): Promise<SummaryMetrics> {
    const totalVolume = aggregates.reduce((sum, a) => sum + a.volume, 0);
    const avgSentiment = aggregates.reduce((sum, a) => sum + a.sentimentScore, 0) / aggregates.length;

    const totalPositive = aggregates.reduce((sum, a) => sum + a.positiveCount, 0);
    const totalNegative = aggregates.reduce((sum, a) => sum + a.negativeCount, 0);

    const positivePercent = (totalPositive / totalVolume) * 100;
    const negativePercent = (totalNegative / totalVolume) * 100;

    // Compare with previous period (if exists)
    const midpoint = Math.floor(aggregates.length / 2);
    const currentPeriod = aggregates.slice(midpoint);
    const previousPeriod = aggregates.slice(0, midpoint);

    const currentAvg = currentPeriod.reduce((sum, a) => sum + a.sentimentScore, 0) / currentPeriod.length;
    const previousAvg = previousPeriod.reduce((sum, a) => sum + a.sentimentScore, 0) / previousPeriod.length;

    const trendChange = ((currentAvg - previousAvg) / Math.abs(previousAvg)) * 100;

    const currentVolume = currentPeriod.reduce((sum, a) => sum + a.volume, 0);
    const previousVolume = previousPeriod.reduce((sum, a) => sum + a.volume, 0);

    const volumeTrend = ((currentVolume - previousVolume) / previousVolume) * 100;

    return {
      avgSentiment: Number(avgSentiment.toFixed(2)),
      totalVolume,
      positivePercent: Number(positivePercent.toFixed(1)),
      negativePercent: Number(negativePercent.toFixed(1)),
      trendChange: Number(trendChange.toFixed(1)),
      volumeTrend: Number(volumeTrend.toFixed(1))
    };
  }
}
```

---

### Database Service

**Purpose**: Abstract database operations for flexibility (PostgreSQL or SQLite).

**Interface Definition:**
```typescript
// services/database/database.interface.ts
export interface DatabaseService {
  // Raw posts
  saveRawPosts(posts: RedditPost[]): Promise<void>;
  getRawPostsByDate(date: string, subreddit?: string): Promise<RedditPost[]>;

  // Scored posts
  saveScoredItems(items: ScoredItem[]): Promise<void>;
  getScoredItemsByDate(date: string, subreddit?: string): Promise<ScoredItem[]>;

  // Aggregates
  saveDailyAggregate(aggregate: DailyAggregate): Promise<void>;
  getDailyAggregates(startDate: string, endDate: string, subreddit?: string): Promise<DailyAggregate[]>;

  // Utility
  deduplicatePosts(posts: RedditPost[]): Promise<RedditPost[]>;
}

export interface ScoredItem {
  id: string;
  type: 'post' | 'comment';
  subreddit: string;
  author: string;
  content: string;
  timestamp: string;
  score: number;
  sentiment: SentimentResult;
  redditUrl: string;
}
```

**PostgreSQL Implementation:**
```typescript
// services/database/postgres.service.ts
import { Pool } from 'pg';
import { DatabaseService, ScoredItem } from './database.interface';

export class PostgresService implements DatabaseService {
  private pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString });
  }

  async saveRawPosts(posts: RedditPost[]): Promise<void> {
    const query = `
      INSERT INTO raw_posts (id, subreddit, author, title, selftext, score, num_comments, created_utc, permalink, flair, is_self, removed, deleted)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      ON CONFLICT (id) DO NOTHING
    `;

    for (const post of posts) {
      await this.pool.query(query, [
        post.id,
        post.subreddit,
        post.author,
        post.title,
        post.selftext,
        post.score,
        post.num_comments,
        new Date(post.created_utc * 1000),
        post.permalink,
        post.link_flair_text,
        post.is_self,
        post.removed,
        post.deleted
      ]);
    }
  }

  async saveScoredItems(items: ScoredItem[]): Promise<void> {
    const query = `
      INSERT INTO scored_posts (id, type, subreddit, author, content, timestamp, score, sentiment_label, sentiment_score, sentiment_confidence, reddit_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (id) DO UPDATE SET
        sentiment_label = EXCLUDED.sentiment_label,
        sentiment_score = EXCLUDED.sentiment_score,
        sentiment_confidence = EXCLUDED.sentiment_confidence
    `;

    for (const item of items) {
      await this.pool.query(query, [
        item.id,
        item.type,
        item.subreddit,
        item.author,
        item.content,
        item.timestamp,
        item.score,
        item.sentiment.label,
        item.sentiment.score,
        item.sentiment.confidence,
        item.redditUrl
      ]);
    }
  }

  async getScoredItemsByDate(date: string, subreddit: string = 'all'): Promise<ScoredItem[]> {
    const query = subreddit === 'all'
      ? `SELECT * FROM scored_posts WHERE DATE(timestamp) = $1`
      : `SELECT * FROM scored_posts WHERE DATE(timestamp) = $1 AND subreddit = $2`;

    const params = subreddit === 'all' ? [date] : [date, subreddit];
    const result = await this.pool.query(query, params);

    return result.rows.map(row => ({
      id: row.id,
      type: row.type,
      subreddit: row.subreddit,
      author: row.author,
      content: row.content,
      timestamp: row.timestamp.toISOString(),
      score: row.score,
      sentiment: {
        label: row.sentiment_label,
        score: row.sentiment_score,
        confidence: row.sentiment_confidence
      },
      redditUrl: row.reddit_url
    }));
  }

  async saveDailyAggregate(aggregate: DailyAggregate): Promise<void> {
    const query = `
      INSERT INTO daily_aggregates (date, subreddit, sentiment_score, volume, positive_count, neutral_count, negative_count, top_keywords, avg_confidence)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (date, subreddit) DO UPDATE SET
        sentiment_score = EXCLUDED.sentiment_score,
        volume = EXCLUDED.volume,
        positive_count = EXCLUDED.positive_count,
        neutral_count = EXCLUDED.neutral_count,
        negative_count = EXCLUDED.negative_count,
        top_keywords = EXCLUDED.top_keywords,
        avg_confidence = EXCLUDED.avg_confidence
    `;

    await this.pool.query(query, [
      aggregate.date,
      'all', // Or specific subreddit
      aggregate.sentimentScore,
      aggregate.volume,
      aggregate.positiveCount,
      aggregate.neutralCount,
      aggregate.negativeCount,
      JSON.stringify(aggregate.topKeywords),
      aggregate.avgConfidence
    ]);
  }

  async getDailyAggregates(
    startDate: string,
    endDate: string,
    subreddit: string = 'all'
  ): Promise<DailyAggregate[]> {
    const query = subreddit === 'all'
      ? `SELECT * FROM daily_aggregates WHERE date >= $1 AND date <= $2 ORDER BY date ASC`
      : `SELECT * FROM daily_aggregates WHERE date >= $1 AND date <= $2 AND subreddit = $3 ORDER BY date ASC`;

    const params = subreddit === 'all' ? [startDate, endDate] : [startDate, endDate, subreddit];
    const result = await this.pool.query(query, params);

    return result.rows.map(row => ({
      date: row.date,
      sentimentScore: row.sentiment_score,
      volume: row.volume,
      positiveCount: row.positive_count,
      neutralCount: row.neutral_count,
      negativeCount: row.negative_count,
      positivePercent: (row.positive_count / row.volume) * 100,
      neutralPercent: (row.neutral_count / row.volume) * 100,
      negativePercent: (row.negative_count / row.volume) * 100,
      topKeywords: JSON.parse(row.top_keywords),
      avgConfidence: row.avg_confidence
    }));
  }

  async deduplicatePosts(posts: RedditPost[]): Promise<RedditPost[]> {
    const seen = new Set<string>();
    return posts.filter(post => {
      if (seen.has(post.id)) return false;
      seen.add(post.id);
      return true;
    });
  }
}
```

**Database Schema:**
```sql
-- raw_posts table
CREATE TABLE raw_posts (
  id VARCHAR(20) PRIMARY KEY,
  subreddit VARCHAR(50) NOT NULL,
  author VARCHAR(50) NOT NULL,
  title TEXT,
  selftext TEXT,
  score INTEGER,
  num_comments INTEGER,
  created_utc TIMESTAMP NOT NULL,
  permalink TEXT,
  flair VARCHAR(100),
  is_self BOOLEAN,
  removed BOOLEAN DEFAULT FALSE,
  deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_raw_posts_date ON raw_posts(created_utc);
CREATE INDEX idx_raw_posts_subreddit ON raw_posts(subreddit);

-- scored_posts table
CREATE TABLE scored_posts (
  id VARCHAR(20) PRIMARY KEY,
  type VARCHAR(10) NOT NULL, -- 'post' or 'comment'
  subreddit VARCHAR(50) NOT NULL,
  author VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  score INTEGER,
  sentiment_label VARCHAR(10) NOT NULL, -- 'positive', 'neutral', 'negative'
  sentiment_score DECIMAL(3,2) NOT NULL, -- -1 to 1
  sentiment_confidence DECIMAL(3,2) NOT NULL, -- 0 to 1
  reddit_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_scored_posts_date ON scored_posts(timestamp);
CREATE INDEX idx_scored_posts_subreddit ON scored_posts(subreddit);

-- daily_aggregates table
CREATE TABLE daily_aggregates (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  subreddit VARCHAR(50) NOT NULL,
  sentiment_score DECIMAL(3,2) NOT NULL,
  volume INTEGER NOT NULL,
  positive_count INTEGER NOT NULL,
  neutral_count INTEGER NOT NULL,
  negative_count INTEGER NOT NULL,
  top_keywords JSONB,
  avg_confidence DECIMAL(3,2),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(date, subreddit)
);

CREATE INDEX idx_aggregates_date ON daily_aggregates(date);
CREATE INDEX idx_aggregates_subreddit ON daily_aggregates(subreddit);
```

---

## Data Pipeline Design

### Pipeline Stages

**1. Ingest: Reddit API → Raw Data Storage**
```
Trigger: Cron job (every 30 minutes)
Input: Reddit API (r/ClaudeAI, r/ClaudeCode, r/Anthropic)
Process:
  - Fetch new posts since last run
  - Fetch top-level comments for each post
  - Store in raw_posts table
Output: Raw Reddit data in database
Error Handling: Retry 3x with exponential backoff, log failures
```

**2. Clean: Normalize, Filter, Dedupe → Cleaned Data**
```
Input: Raw posts from database
Process:
  - Remove markdown, links, emojis
  - Filter non-English (language detection)
  - Remove deleted/removed posts
  - Deduplicate by ID
  - Bot detection (low karma, spam patterns)
Output: Cleaned text ready for sentiment analysis
Error Handling: Skip invalid entries, log cleaning stats
```

**3. Analyze: Sentiment Scoring → Scored Data**
```
Input: Cleaned text
Process:
  - Check sentiment cache by text hash
  - Batch uncached texts (20 per request)
  - Call OpenAI API for sentiment analysis
  - Cache results (7-day TTL)
  - Store in scored_posts table
Output: Posts/comments with sentiment labels and scores
Error Handling: Retry on API errors, fallback to neutral if quota exceeded
```

**4. Aggregate: Daily Rollups → Aggregated Data**
```
Input: Scored posts for each day
Process:
  - Calculate avg sentiment, volume, pos/neu/neg %
  - Extract top keywords (frequency analysis)
  - Compare with previous period for trends
  - Store in daily_aggregates table
Output: Daily summary metrics
Error Handling: Validate data completeness, log anomalies
```

**5. Serve: API Routes → Frontend**
```
Input: Aggregated data from database
Process:
  - Query by subreddit and time range
  - Apply caching (5-min TTL)
  - Format response for frontend
Output: JSON responses for dashboard
Error Handling: Return cached data if DB unavailable
```

---

### Job Scheduling and Error Recovery

**Cron Job Implementation (Node.js):**
```typescript
// jobs/reddit-sync.job.ts
import cron from 'node-cron';
import { RedditAPIService } from '@/services/reddit/reddit-api.service';
import { SentimentAPIService } from '@/services/sentiment/openai-sentiment.service';
import { AggregationService } from '@/services/aggregation/aggregation.service';
import { DatabaseService } from '@/services/database/database.interface';

export class RedditSyncJob {
  constructor(
    private reddit: RedditAPIService,
    private sentiment: SentimentAPIService,
    private aggregation: AggregationService,
    private db: DatabaseService
  ) {}

  // Run every 30 minutes
  schedule() {
    cron.schedule('*/30 * * * *', async () => {
      console.log('[Job] Reddit sync started at', new Date().toISOString());

      try {
        await this.run();
        console.log('[Job] Reddit sync completed successfully');
      } catch (error) {
        console.error('[Job] Reddit sync failed:', error);
        // Send alert to monitoring service
        this.alertFailure(error);
      }
    });
  }

  async run() {
    const subreddits = ['ClaudeAI', 'ClaudeCode', 'Anthropic'];

    for (const subreddit of subreddits) {
      try {
        // Stage 1: Ingest
        const posts = await this.reddit.fetchSubredditPosts(subreddit, {
          limit: 100,
          sort: 'new'
        });

        const comments = await this.fetchCommentsForPosts(posts);

        await this.db.saveRawPosts(posts);
        console.log(`[Job] Ingested ${posts.length} posts and ${comments.length} comments from r/${subreddit}`);

        // Stage 2: Clean
        const cleanedPosts = await this.cleanData(posts);
        const cleanedComments = await this.cleanData(comments);

        // Stage 3: Analyze
        const scoredPosts = await this.analyzeItems(cleanedPosts, 'post');
        const scoredComments = await this.analyzeItems(cleanedComments, 'comment');

        await this.db.saveScoredItems([...scoredPosts, ...scoredComments]);
        console.log(`[Job] Analyzed sentiment for ${scoredPosts.length + scoredComments.length} items`);

        // Stage 4: Aggregate
        const today = new Date().toISOString().split('T')[0];
        const aggregate = await this.aggregation.aggregateDailySentiment(today, subreddit);

        await this.db.saveDailyAggregate(aggregate);
        console.log(`[Job] Aggregated data for ${today}`);

      } catch (error) {
        console.error(`[Job] Failed to process r/${subreddit}:`, error);
        // Continue with next subreddit
      }
    }
  }

  private async fetchCommentsForPosts(posts: RedditPost[]): Promise<RedditComment[]> {
    const allComments: RedditComment[] = [];

    for (const post of posts) {
      try {
        const comments = await this.reddit.fetchPostComments(post.id, { limit: 50 });
        allComments.push(...comments);
      } catch (error) {
        console.error(`Failed to fetch comments for post ${post.id}:`, error);
      }
    }

    return allComments;
  }

  private async cleanData(items: (RedditPost | RedditComment)[]): Promise<any[]> {
    return items
      .filter(item => !item.deleted && !item.removed)
      .filter(item => {
        const text = 'title' in item ? item.title + ' ' + item.selftext : item.body;
        return text && text.trim().length > 0;
      })
      .map(item => ({
        ...item,
        content: this.normalizeText('title' in item ? item.title + ' ' + item.selftext : item.body)
      }));
  }

  private normalizeText(text: string): string {
    return text
      .replace(/\[.*?\]\(.*?\)/g, '') // Remove markdown links
      .replace(/https?:\/\/[^\s]+/g, '') // Remove URLs
      .replace(/[^\w\s]/g, '') // Remove special chars
      .trim();
  }

  private async analyzeItems(items: any[], type: 'post' | 'comment'): Promise<ScoredItem[]> {
    const texts = items.map(i => i.content);
    const sentiments = await this.sentiment.analyzeBatch(texts);

    return items.map((item, index) => ({
      id: item.id,
      type,
      subreddit: item.subreddit,
      author: item.author,
      content: item.content,
      timestamp: new Date(item.created_utc * 1000).toISOString(),
      score: item.score,
      sentiment: sentiments[index],
      redditUrl: `https://reddit.com${item.permalink}`
    }));
  }

  private alertFailure(error: any) {
    // Send to Sentry, DataDog, or email alert
    console.error('[Alert] Job failure:', error);
  }
}
```

**Vercel Cron (Alternative for Vercel Deployment):**
```typescript
// app/api/cron/reddit-sync/route.ts
import { NextResponse } from 'next/server';
import { RedditSyncJob } from '@/jobs/reddit-sync.job';
import { getServices } from '@/lib/service-factory';

export async function GET(request: Request) {
  // Verify cron secret (Vercel adds this header)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const services = getServices();
  const job = new RedditSyncJob(
    services.reddit,
    services.sentiment,
    services.aggregation,
    services.database
  );

  try {
    await job.run();
    return NextResponse.json({ success: true, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Cron job failed:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
```

**vercel.json:**
```json
{
  "crons": [
    {
      "path": "/api/cron/reddit-sync",
      "schedule": "*/30 * * * *"
    }
  ]
}
```

---

### Backfill Strategy (Initial 90-Day Data)

**Backfill Job:**
```typescript
// jobs/backfill.job.ts
export class BackfillJob {
  constructor(
    private reddit: RedditAPIService,
    private sentiment: SentimentAPIService,
    private aggregation: AggregationService,
    private db: DatabaseService
  ) {}

  async backfill(daysBack: number = 90) {
    console.log(`[Backfill] Starting ${daysBack}-day backfill...`);

    const subreddits = ['ClaudeAI', 'ClaudeCode', 'Anthropic'];
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    for (const subreddit of subreddits) {
      let after: string | undefined;
      let postsIngested = 0;

      while (true) {
        try {
          // Fetch posts in batches
          const posts = await this.reddit.fetchSubredditPosts(subreddit, {
            limit: 100,
            after,
            sort: 'new'
          });

          if (posts.length === 0) break;

          // Filter by date range
          const filtered = posts.filter(p => {
            const date = new Date(p.created_utc * 1000);
            return date >= startDate && date <= endDate;
          });

          if (filtered.length === 0) break;

          // Process batch
          await this.db.saveRawPosts(filtered);

          // Fetch comments for each post
          const comments = await this.fetchCommentsForPosts(filtered);

          // Clean, analyze, and store
          const cleanedPosts = await this.cleanData(filtered);
          const cleanedComments = await this.cleanData(comments);

          const scoredPosts = await this.analyzeItems(cleanedPosts, 'post');
          const scoredComments = await this.analyzeItems(cleanedComments, 'comment');

          await this.db.saveScoredItems([...scoredPosts, ...scoredComments]);

          postsIngested += filtered.length;
          after = posts[posts.length - 1]?.id;

          console.log(`[Backfill] r/${subreddit}: ${postsIngested} posts ingested`);

          // Rate limit: Wait 2 seconds between batches
          await new Promise(resolve => setTimeout(resolve, 2000));

        } catch (error) {
          console.error(`[Backfill] Error for r/${subreddit}:`, error);
          break;
        }
      }
    }

    // Aggregate all days
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];

      for (const subreddit of subreddits) {
        try {
          const aggregate = await this.aggregation.aggregateDailySentiment(dateStr, subreddit);
          await this.db.saveDailyAggregate(aggregate);
        } catch (error) {
          console.log(`[Backfill] No data for ${dateStr} r/${subreddit}`);
        }
      }
    }

    console.log('[Backfill] Completed successfully');
  }

  // ... (same helper methods as RedditSyncJob)
}
```

**Run Backfill (CLI):**
```bash
npm run backfill -- --days=90
```

---

## Dependency Injection & Configuration

### Environment Variables

**Required Environment Variables:**
```bash
# .env.local

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/sentiment_monitor
# Or for SQLite: DATABASE_URL=sqlite:./data/sentiment.db

# Redis Cache
REDIS_URL=redis://localhost:6379

# Reddit API
REDDIT_CLIENT_ID=your_client_id
REDDIT_CLIENT_SECRET=your_client_secret
REDDIT_REFRESH_TOKEN=your_refresh_token
REDDIT_USER_AGENT=ClaudeCodeSentimentMonitor/1.0

# OpenAI API
OPENAI_API_KEY=sk-...

# Cron Job Authentication
CRON_SECRET=your_secret_key

# Application
NEXT_PUBLIC_API_URL=http://localhost:3000
NODE_ENV=development
```

---

### Service Factory Pattern

**Centralized Service Instantiation:**
```typescript
// lib/service-factory.ts
import { RedditAPIServiceImpl } from '@/services/reddit/reddit-api.service';
import { RedditCache } from '@/services/reddit/reddit-cache';
import { OpenAISentimentService } from '@/services/sentiment/openai-sentiment.service';
import { SentimentCache } from '@/services/sentiment/sentiment-cache';
import { AggregationServiceImpl } from '@/services/aggregation/aggregation.service';
import { PostgresService } from '@/services/database/postgres.service';

export interface Services {
  reddit: RedditAPIServiceImpl;
  sentiment: OpenAISentimentService;
  aggregation: AggregationServiceImpl;
  database: PostgresService;
}

let servicesInstance: Services | null = null;

export function getServices(): Services {
  if (!servicesInstance) {
    // Initialize caches
    const redditCache = new RedditCache(process.env.REDIS_URL!);
    const sentimentCache = new SentimentCache(process.env.REDIS_URL!);

    // Initialize database
    const database = new PostgresService(process.env.DATABASE_URL!);

    // Initialize Reddit API service
    const reddit = new RedditAPIServiceImpl(
      {
        clientId: process.env.REDDIT_CLIENT_ID!,
        clientSecret: process.env.REDDIT_CLIENT_SECRET!,
        refreshToken: process.env.REDDIT_REFRESH_TOKEN!,
        userAgent: process.env.REDDIT_USER_AGENT!
      },
      redditCache
    );

    // Initialize Sentiment API service
    const sentiment = new OpenAISentimentService(
      process.env.OPENAI_API_KEY!,
      sentimentCache
    );

    // Initialize Aggregation service
    const aggregation = new AggregationServiceImpl(database);

    servicesInstance = {
      reddit,
      sentiment,
      aggregation,
      database
    };
  }

  return servicesInstance;
}
```

**Usage in API Routes:**
```typescript
// app/api/sentiment/aggregate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServices } from '@/lib/service-factory';

export async function GET(request: NextRequest) {
  const services = getServices();

  const { searchParams } = new URL(request.url);
  const subreddit = searchParams.get('subreddit') || 'all';
  const timeRange = searchParams.get('timeRange') || '30d';

  try {
    const { startDate, endDate } = parseTimeRange(timeRange);
    const aggregates = await services.database.getDailyAggregates(startDate, endDate, subreddit);
    const summary = await services.aggregation.computeSummaryMetrics(aggregates);

    return NextResponse.json({
      success: true,
      data: {
        subreddit,
        timeRange,
        aggregates,
        summary
      },
      meta: {
        lastUpdated: new Date().toISOString(),
        cacheHit: false
      }
    });
  } catch (error) {
    console.error('Aggregate API error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'DATABASE_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}

function parseTimeRange(timeRange: string): { startDate: string; endDate: string } {
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date();

  switch (timeRange) {
    case '7d':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(startDate.getDate() - 30);
      break;
    case '90d':
      startDate.setDate(startDate.getDate() - 90);
      break;
    default:
      startDate.setDate(startDate.getDate() - 30);
  }

  return { startDate: startDate.toISOString().split('T')[0], endDate };
}
```

---

### Singleton vs Request-Scoped Services

**Singleton Services (Shared Across Requests):**
- Database connection pool
- Redis cache clients
- External API clients (Reddit, OpenAI)

**Request-Scoped Services (New Instance Per Request):**
- None in current architecture (all services are stateless)

**Recommendation:** Use singleton pattern for all services since they're stateless and share resources efficiently.

---

## Error Handling & Retry Patterns

### Reddit API Rate Limit Handling

**Rate Limit Strategy:**
```typescript
// services/reddit/rate-limiter.ts
export class RedditRateLimiter {
  private requestCount = 0;
  private resetTime: number = Date.now() + 60000; // 1 minute window

  async executeWithRateLimit<T>(fn: () => Promise<T>): Promise<T> {
    // Reddit API: 60 requests per minute
    if (this.requestCount >= 60) {
      const waitTime = this.resetTime - Date.now();
      if (waitTime > 0) {
        console.log(`[RateLimit] Waiting ${waitTime}ms before next request`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        this.requestCount = 0;
        this.resetTime = Date.now() + 60000;
      }
    }

    this.requestCount++;
    return fn();
  }
}

// Updated RedditAPIServiceImpl
export class RedditAPIServiceImpl implements RedditAPIService {
  private rateLimiter = new RedditRateLimiter();

  async fetchSubredditPosts(subreddit: string, options: FetchOptions): Promise<RedditPost[]> {
    return this.rateLimiter.executeWithRateLimit(async () => {
      // ... existing implementation
    });
  }
}
```

**Reddit API Error Handling:**
```typescript
async fetchSubredditPosts(subreddit: string, options: FetchOptions): Promise<RedditPost[]> {
  try {
    return await this.rateLimiter.executeWithRateLimit(async () => {
      const posts = await this.client.getSubreddit(subreddit).getNew(options);
      return this.mapPosts(posts);
    });
  } catch (error) {
    if (error.statusCode === 429) {
      // Rate limited
      throw new RedditAPIError('RATE_LIMIT_EXCEEDED', 'Reddit API rate limit hit', 429);
    } else if (error.statusCode === 503) {
      // Reddit down
      throw new RedditAPIError('SERVICE_UNAVAILABLE', 'Reddit is temporarily unavailable', 503);
    } else if (error.statusCode === 401) {
      // Auth expired, refresh token
      await this.refreshToken();
      return this.fetchSubredditPosts(subreddit, options); // Retry once
    } else {
      throw new RedditAPIError('UNKNOWN_ERROR', error.message, error.statusCode);
    }
  }
}
```

---

### OpenAI API Quota Management

**Token Budget Tracking:**
```typescript
// services/sentiment/token-tracker.ts
export class TokenTracker {
  private monthlyTokensUsed = 0;
  private monthlyLimit = 1000000; // Example: 1M tokens/month

  async trackUsage(tokensUsed: number): Promise<void> {
    this.monthlyTokensUsed += tokensUsed;

    if (this.monthlyTokensUsed >= this.monthlyLimit) {
      throw new Error('Monthly OpenAI token quota exceeded');
    }

    // Store in Redis for persistence
    await redis.set('openai:tokens:used', this.monthlyTokensUsed);
  }

  getRemainingQuota(): number {
    return this.monthlyLimit - this.monthlyTokensUsed;
  }
}
```

**Quota Exceeded Fallback:**
```typescript
// services/sentiment/openai-sentiment.service.ts
async analyzeSentiment(text: string): Promise<SentimentResult> {
  try {
    // ... existing implementation

    const tokensUsed = completion.usage?.total_tokens || 0;
    await this.tokenTracker.trackUsage(tokensUsed);

    return result;
  } catch (error) {
    if (error.code === 'insufficient_quota') {
      console.warn('[Sentiment] OpenAI quota exceeded, using fallback');
      return this.fallbackSentiment(text);
    }
    throw error;
  }
}

private fallbackSentiment(text: string): SentimentResult {
  // Simple keyword-based sentiment (not as accurate but free)
  const positiveKeywords = ['amazing', 'great', 'love', 'perfect', 'awesome'];
  const negativeKeywords = ['bug', 'broken', 'terrible', 'hate', 'worst'];

  const lowerText = text.toLowerCase();
  const positiveCount = positiveKeywords.filter(k => lowerText.includes(k)).length;
  const negativeCount = negativeKeywords.filter(k => lowerText.includes(k)).length;

  if (positiveCount > negativeCount) {
    return { label: 'positive', score: 0.5, confidence: 0.3 };
  } else if (negativeCount > positiveCount) {
    return { label: 'negative', score: -0.5, confidence: 0.3 };
  } else {
    return { label: 'neutral', score: 0, confidence: 0.3 };
  }
}
```

---

### Database Transaction Failures

**Transaction Wrapper:**
```typescript
// services/database/postgres.service.ts
async withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await this.pool.connect();

  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Usage in aggregation service
async saveDailyAggregate(aggregate: DailyAggregate): Promise<void> {
  await this.db.withTransaction(async (client) => {
    // Delete existing aggregate if exists
    await client.query('DELETE FROM daily_aggregates WHERE date = $1 AND subreddit = $2', [
      aggregate.date,
      'all'
    ]);

    // Insert new aggregate
    await client.query(
      'INSERT INTO daily_aggregates (...) VALUES (...)',
      [/* values */]
    );
  });
}
```

---

### Network Errors and Timeouts

**Retry with Exponential Backoff:**
```typescript
// lib/retry.ts
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    shouldRetry?: (error: any) => boolean;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    shouldRetry = () => true
  } = options;

  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries || !shouldRetry(error)) {
        throw error;
      }

      const delay = Math.min(initialDelay * Math.pow(2, attempt), maxDelay);
      console.log(`[Retry] Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

// Usage
const posts = await retryWithBackoff(
  () => redditAPI.fetchSubredditPosts('ClaudeAI'),
  {
    maxRetries: 3,
    shouldRetry: (error) => error.statusCode !== 404 // Don't retry 404s
  }
);
```

---

### User-Facing Error Messages

**Error Message Mapping:**
```typescript
// lib/error-messages.ts
export function getUserFriendlyError(error: APIError): string {
  const messages: Record<string, string> = {
    'DATABASE_ERROR': 'Unable to load data. Please try again in a moment.',
    'RATE_LIMIT_EXCEEDED': 'Too many requests. Please wait a moment and try again.',
    'REDDIT_API_ERROR': 'Unable to fetch Reddit data. The service may be temporarily unavailable.',
    'OPENAI_QUOTA_EXCEEDED': 'Sentiment analysis is temporarily unavailable. Showing cached data.',
    'NETWORK_ERROR': 'Network connection lost. Please check your internet connection.',
    'UNKNOWN_ERROR': 'An unexpected error occurred. Our team has been notified.'
  };

  return messages[error.code] || messages['UNKNOWN_ERROR'];
}

// Usage in frontend
try {
  const data = await fetchAggregate({ subreddit, timeRange });
} catch (error) {
  if (error instanceof APIError) {
    toast.error(getUserFriendlyError(error));
  } else {
    toast.error('An unexpected error occurred');
  }
}
```

---

## Critical Implementation Sequencing

### Phase 1: Database Schema + Reddit API Service
**Duration:** 3-4 days
**Dependencies:** None

**Tasks:**
1. Set up PostgreSQL database
2. Create schema (raw_posts, scored_posts, daily_aggregates)
3. Implement RedditAPIService with OAuth
4. Implement RedditCache with Redis
5. Write unit tests for Reddit API service

**Deliverables:**
- Database migrations
- Reddit API service
- Cache implementation
- Test coverage >80%

**Blocking For:** Phase 2 (data ingestion)

---

### Phase 2: Data Ingestion Pipeline + Background Jobs
**Duration:** 4-5 days
**Dependencies:** Phase 1

**Tasks:**
1. Implement data cleaning/normalization logic
2. Build deduplication and bot detection
3. Create backfill job for 90-day history
4. Create incremental sync job (30-min cron)
5. Set up job scheduling (Vercel Cron or node-cron)
6. Error handling and retry logic

**Deliverables:**
- Data cleaning service
- Backfill job script
- Incremental sync job
- Job monitoring dashboard

**Blocking For:** Phase 3 (sentiment analysis)

---

### Phase 3: Sentiment Analysis Integration
**Duration:** 3-4 days
**Dependencies:** Phase 2

**Tasks:**
1. Implement OpenAISentimentService
2. Set up sentiment caching with Redis
3. Implement batch processing (20 texts per request)
4. Add token usage tracking and quota management
5. Create fallback sentiment logic
6. Test with real Reddit data

**Deliverables:**
- Sentiment service
- Batch processing
- Cost optimization
- Fallback mechanisms

**Blocking For:** Phase 4 (aggregation)

---

### Phase 4: Aggregation Layer
**Duration:** 2-3 days
**Dependencies:** Phase 3

**Tasks:**
1. Implement AggregationService
2. Build keyword extraction (NLP library)
3. Create trend calculation logic
4. Compute daily rollups
5. Test aggregation accuracy

**Deliverables:**
- Aggregation service
- Keyword extraction
- Trend calculations
- Daily rollup logic

**Blocking For:** Phase 5 (API routes)

---

### Phase 5: API Routes + Frontend Integration
**Duration:** 5-6 days
**Dependencies:** Phase 4

**Tasks:**
1. Implement /api/sentiment/aggregate endpoint
2. Implement /api/sentiment/samples endpoint
3. Implement /api/reddit/sync endpoint
4. Implement /api/export/csv endpoint
5. Add API caching and rate limiting
6. Build frontend Server Components (initial data load)
7. Build frontend Client Components (charts, tabs, modals)
8. Integrate React Query for data fetching
9. Add error boundaries and loading states
10. Implement drill-down modal
11. Add CSV export functionality

**Deliverables:**
- Complete API routes
- Frontend dashboard
- Data fetching layer
- Error handling
- Export functionality

**Blocking For:** None (MVP complete)

---

### Phase 6: Testing & Deployment (Optional)
**Duration:** 3-4 days
**Dependencies:** Phase 5

**Tasks:**
1. Write integration tests for API routes
2. Write E2E tests for frontend (Playwright)
3. Load testing for background jobs
4. Set up monitoring (Sentry, DataDog)
5. Deploy to Vercel/production
6. Monitor first 24-hour cycle

**Deliverables:**
- Test suite
- Monitoring dashboard
- Production deployment
- Documentation

---

### Dependency Graph

```
Phase 1 (DB + Reddit API)
    ↓
Phase 2 (Data Ingestion)
    ↓
Phase 3 (Sentiment Analysis)
    ↓
Phase 4 (Aggregation)
    ↓
Phase 5 (API + Frontend)
    ↓
Phase 6 (Testing + Deploy)
```

**Critical Path:** Phases 1 → 2 → 3 → 4 → 5
**Total Duration:** 17-22 days

**Parallel Work Opportunities:**
- Frontend UI components can be built in parallel with backend (using mock data)
- Documentation can be written throughout all phases
- Test writing can happen alongside implementation

---

## Implementation Checklist

### Phase 1: Database + Reddit API
- [ ] PostgreSQL setup and configuration
- [ ] Database schema creation (3 tables)
- [ ] Redis setup for caching
- [ ] Reddit OAuth credentials obtained
- [ ] RedditAPIService implementation
- [ ] RedditCache implementation
- [ ] Unit tests for Reddit service
- [ ] Documentation for Reddit API integration

### Phase 2: Data Ingestion
- [ ] Text normalization logic
- [ ] Language detection (English filter)
- [ ] Deduplication by post ID
- [ ] Bot detection heuristics
- [ ] Backfill job script
- [ ] Incremental sync job
- [ ] Cron job scheduling
- [ ] Error recovery mechanisms
- [ ] Job monitoring logs

### Phase 3: Sentiment Analysis
- [ ] OpenAI API key obtained
- [ ] OpenAISentimentService implementation
- [ ] Sentiment caching (hash-based)
- [ ] Batch processing (20 texts/request)
- [ ] Token usage tracking
- [ ] Quota management
- [ ] Fallback sentiment logic
- [ ] Cost optimization validation

### Phase 4: Aggregation
- [ ] AggregationService implementation
- [ ] Daily rollup calculations
- [ ] Keyword extraction (NLP library)
- [ ] Trend calculation logic
- [ ] Summary metrics computation
- [ ] Data validation
- [ ] Aggregation accuracy tests

### Phase 5: API Routes + Frontend
- [ ] /api/sentiment/aggregate endpoint
- [ ] /api/sentiment/samples endpoint
- [ ] /api/reddit/sync endpoint
- [ ] /api/export/csv endpoint
- [ ] API caching middleware
- [ ] Rate limiting
- [ ] Server Components (page.tsx)
- [ ] Client Components (charts, tabs)
- [ ] React Query setup
- [ ] Error boundaries
- [ ] Loading states
- [ ] Drill-down modal
- [ ] CSV export
- [ ] Responsive design
- [ ] Accessibility (WCAG AA)

### Phase 6: Testing + Deployment
- [ ] API route integration tests
- [ ] Frontend E2E tests
- [ ] Load testing for jobs
- [ ] Error tracking (Sentry)
- [ ] Performance monitoring
- [ ] Vercel deployment
- [ ] Environment variables configured
- [ ] First 24-hour cycle validation
- [ ] Documentation complete

---

## Conclusion

This integration architecture provides a complete blueprint for building the Claude Code Sentiment Monitor, connecting all layers from Reddit API ingestion through OpenAI sentiment analysis to the Next.js 15 frontend dashboard.

**Key Takeaways:**

1. **API Route Specifications**: RESTful endpoints with clear request/response schemas, caching strategies, and error handling
2. **Frontend-Backend Data Flow**: Server Components for initial load, Client Components for interactivity, React Query for data management
3. **State Management**: Clear separation between server state (React Query) and client state (React Context/Zustand)
4. **Service Architecture**: Dependency injection, interface-based design, singleton services for efficiency
5. **Data Pipeline**: 5-stage pipeline (Ingest → Clean → Analyze → Aggregate → Serve) with robust error recovery
6. **Configuration**: Environment-based config, service factory pattern, centralized dependency management
7. **Error Handling**: Rate limiting, quota management, retry with backoff, user-friendly messages
8. **Implementation Sequencing**: 6 phases with clear dependencies, 17-22 day timeline

**Next Steps:**
1. Review and approve architecture
2. Begin Phase 1 implementation (Database + Reddit API)
3. Set up monitoring and alerting infrastructure
4. Establish CI/CD pipeline
5. Plan capacity and scaling strategy

---

**Document Status:** Complete ✓
**Last Updated:** 2025-10-02
**Review Required:** Yes
**Approver:** Product/Engineering Lead
