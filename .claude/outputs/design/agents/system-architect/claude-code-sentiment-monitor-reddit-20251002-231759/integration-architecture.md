# System Integration Architecture
**Project:** Claude Code Sentiment Monitor (Reddit)
**Version:** 1.0
**Date:** 2025-10-02
**Platform:** Next.js 15 App Router with React 19

---

## Table of Contents
1. [System Architecture Overview](#1-system-architecture-overview)
2. [API Route Specifications](#2-api-route-specifications)
3. [Frontend-Backend Data Flow](#3-frontend-backend-data-flow)
4. [Service Layer Architecture](#4-service-layer-architecture)
5. [Data Storage & Schema](#5-data-storage--schema)
6. [Dependency Injection & Configuration](#6-dependency-injection--configuration)
7. [Caching Coordination](#7-caching-coordination)
8. [Error Handling & Retry Patterns](#8-error-handling--retry-patterns)
9. [Critical Implementation Sequencing](#9-critical-implementation-sequencing)
10. [Next.js 15 App Router Patterns](#10-nextjs-15-app-router-patterns)
11. [Performance Optimization](#11-performance-optimization)
12. [Security & Compliance](#12-security--compliance)

---

## 1. System Architecture Overview

### 1.1 High-Level System Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          PRESENTATION LAYER                              │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  Next.js 15 App Router (React 19)                                  │ │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐              │ │
│  │  │  Dashboard   │ │   Modal      │ │  CSV Export  │              │ │
│  │  │  Page (SSR)  │ │  (Client)    │ │  (Client)    │              │ │
│  │  └──────────────┘ └──────────────┘ └──────────────┘              │ │
│  │           ↓ SWR/TanStack Query for data fetching                   │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓ HTTP/JSON
┌─────────────────────────────────────────────────────────────────────────┐
│                           API ROUTES LAYER                               │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  /app/api/*                                                        │ │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐              │ │
│  │  │  /dashboard  │ │  /drill-down │ │  /export/csv │              │ │
│  │  │  /data       │ │              │ │              │              │ │
│  │  └──────────────┘ └──────────────┘ └──────────────┘              │ │
│  │  ┌──────────────┐ ┌──────────────┐                               │ │
│  │  │  /ingest     │ │  /ingest     │                               │ │
│  │  │  /poll       │ │  /backfill   │                               │ │
│  │  └──────────────┘ └──────────────┘                               │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                          SERVICE LAYER                                   │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  Business Logic & Data Processing                                  │ │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐              │ │
│  │  │  Reddit      │ │  Sentiment   │ │  Aggregation │              │ │
│  │  │  Service     │ │  Service     │ │  Service     │              │ │
│  │  └──────────────┘ └──────────────┘ └──────────────┘              │ │
│  │  ┌──────────────┐ ┌──────────────┐                               │ │
│  │  │  Cache       │ │  Export      │                               │ │
│  │  │  Service     │ │  Service     │                               │ │
│  │  └──────────────┘ └──────────────┘                               │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                      ↓                        ↓
┌─────────────────────────────────┐  ┌────────────────────────────────────┐
│      EXTERNAL APIs               │  │     DATA STORAGE                   │
│  ┌────────────┐ ┌──────────────┐│  │  ┌──────────────────────────────┐ │
│  │  Reddit    │ │  OpenAI API  ││  │  │  PostgreSQL / SQLite         │ │
│  │  OAuth API │ │  (GPT-4)     ││  │  │  ┌────────────────────────┐  │ │
│  └────────────┘ └──────────────┘│  │  │  │  raw_posts             │  │ │
│                                  │  │  │  │  raw_comments          │  │ │
│  Rate Limiting:                  │  │  │  │  sentiment_results     │  │ │
│  - Reddit: 60 req/min            │  │  │  │  daily_aggregates      │  │ │
│  - OpenAI: 10,000 TPM            │  │  │  └────────────────────────┘  │ │
└─────────────────────────────────┘  └────────────────────────────────────┘
                                                       ↑
                                            ┌──────────────────────────────┐
                                            │  CACHING LAYER               │
                                            │  - Redis (optional)          │
                                            │  - In-memory LRU cache       │
                                            │  - File-based cache (dev)    │
                                            └──────────────────────────────┘
```

### 1.2 Data Flow Overview

**Ingestion Flow (Polling - Every 30 minutes):**
```
Cron Trigger → /api/ingest/poll → RedditService.fetchNew()
    → Filter & Deduplicate → SentimentService.analyze()
    → AggregationService.updateDailyStats() → Database
```

**Dashboard Load Flow:**
```
User → Dashboard Page (SSR) → Initial data from API route
    → Client hydration → SWR fetches /api/dashboard/data
    → AggregationService.getAggregates(subreddit, timeRange)
    → Return cached aggregates or compute from DB → Frontend renders
```

**Drill-Down Flow:**
```
User clicks chart point → /api/drill-down?date=2025-10-15&subreddit=ClaudeAI
    → Query raw posts + sentiment results for that day
    → Return top 10 by engagement → Modal displays
```

**Backfill Flow (One-time or manual trigger):**
```
Admin trigger → /api/ingest/backfill → RedditService.backfill(90 days)
    → Batch fetch historical posts → SentimentService.analyzeBatch()
    → AggregationService.computeHistoricalAggregates() → Database
```

### 1.3 Component Layers

**Layer 1: Presentation (Next.js App Router)**
- Server Components: Dashboard page, initial data fetch
- Client Components: Charts, tabs, modal, interactive elements
- Uses SWR or TanStack Query for client-side data fetching

**Layer 2: API Routes (Next.js API Handlers)**
- Thin controllers that delegate to service layer
- Handle request validation, error responses, caching headers
- No business logic (all in services)

**Layer 3: Service Layer (Business Logic)**
- RedditService: Fetch, filter, deduplicate Reddit data
- SentimentService: OpenAI API calls, caching, batch processing
- AggregationService: Daily rollups, keyword extraction, statistics
- CacheService: Unified caching across all services
- ExportService: CSV generation

**Layer 4: Data Access (Repository Pattern)**
- Database abstraction (supports PostgreSQL or SQLite)
- Raw data storage: posts, comments
- Processed data: sentiment results, daily aggregates

**Layer 5: External Integrations**
- Reddit API Client (OAuth, rate limiting, pagination)
- OpenAI API Client (GPT-4, error handling, retries)

### 1.4 Caching Strategy Across Layers

**Frontend Cache (SWR/TanStack Query):**
- Dashboard data: 60s stale time, 5min cache
- Drill-down data: 5min cache
- Revalidate on window focus

**API Route Cache:**
- Dashboard aggregates: 30min HTTP cache header
- Drill-down: 5min cache header
- Export: No cache (always fresh)

**Service Layer Cache:**
- Reddit API responses: 30min in-memory cache
- OpenAI sentiment results: 7 days in Redis/file cache
- Daily aggregates: Computed once, cached indefinitely until new data

**Database:**
- Aggregates table acts as persistent cache for rollups
- Indexed for fast range queries

---

## 2. API Route Specifications

### 2.1 GET /api/dashboard/data

**Purpose:** Fetch aggregated sentiment and volume data for dashboard display.

**Query Parameters:**
```typescript
interface DashboardDataParams {
  subreddit: 'all' | 'ClaudeAI' | 'ClaudeCode' | 'Anthropic'
  timeRange: 7 | 30 | 90  // days
}
```

**Response Schema:**
```typescript
interface DashboardDataResponse {
  summary: {
    avgSentiment: number        // -1 to +1
    positivePercent: number     // 0-100
    negativePercent: number     // 0-100
    neutralPercent: number      // 0-100
    totalPosts: number
    timeRange: number           // days
    lastUpdated: string         // ISO timestamp
  }
  timeseries: Array<{
    date: string                // YYYY-MM-DD
    sentiment: number           // -1 to +1
    volume: number              // post count
    positiveCount: number
    negativeCount: number
    neutralCount: number
  }>
  keywords: Array<{
    keyword: string
    frequency: number           // absolute count
    relativeFrequency: number   // 0-1 (for sizing)
  }>
  metadata: {
    subreddit: string
    dataSource: 'live' | 'cached'
    cacheAge?: string           // ISO duration (e.g., "PT2H" = 2 hours)
  }
}
```

**Implementation:**
```typescript
// /app/api/dashboard/data/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { AggregationService } from '@/services/aggregation'
import { CacheService } from '@/services/cache'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const subreddit = searchParams.get('subreddit') || 'all'
  const timeRange = parseInt(searchParams.get('timeRange') || '30')

  try {
    // Check cache first
    const cacheKey = `dashboard:${subreddit}:${timeRange}`
    const cached = await CacheService.get(cacheKey)

    if (cached) {
      return NextResponse.json(cached, {
        headers: { 'Cache-Control': 'public, max-age=1800' }
      })
    }

    // Fetch from aggregation service
    const aggregationService = new AggregationService()
    const data = await aggregationService.getDashboardData(subreddit, timeRange)

    // Cache for 30 minutes
    await CacheService.set(cacheKey, data, 1800)

    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, max-age=1800' }
    })
  } catch (error) {
    // If API quota exceeded, try to return last cached data
    if (error.code === 'QUOTA_EXCEEDED') {
      const lastCached = await CacheService.getStale(`dashboard:${subreddit}:${timeRange}`)
      if (lastCached) {
        return NextResponse.json({
          ...lastCached,
          metadata: { ...lastCached.metadata, dataSource: 'cached' }
        }, {
          status: 200,
          headers: { 'X-Data-Source': 'stale-cache' }
        })
      }
    }

    return NextResponse.json(
      { error: 'Failed to fetch dashboard data', details: error.message },
      { status: 500 }
    )
  }
}
```

**Caching Behavior:**
- Primary cache: 30 minutes
- Stale cache: Serve if API quota exceeded (with warning)
- Cache invalidation: On new data ingestion

### 2.2 GET /api/drill-down

**Purpose:** Fetch detailed posts/comments for a specific day and subreddit.

**Query Parameters:**
```typescript
interface DrillDownParams {
  date: string         // YYYY-MM-DD
  subreddit: string    // 'all', 'ClaudeAI', etc.
  limit?: number       // default 10, max 50
  offset?: number      // for pagination
}
```

**Response Schema:**
```typescript
interface DrillDownResponse {
  date: string
  subreddit: string
  summary: {
    totalCount: number
    avgSentiment: number
    positiveCount: number
    negativeCount: number
    neutralCount: number
  }
  posts: Array<{
    id: string
    type: 'post' | 'comment'
    subreddit: string
    author: string
    timestamp: string        // ISO
    text: string
    sentiment: number        // -1 to +1
    sentimentLabel: 'positive' | 'neutral' | 'negative'
    confidence: number       // 0-1
    score: number           // Reddit score
    commentCount: number
    redditUrl: string
  }>
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}
```

**Implementation:**
```typescript
// /app/api/drill-down/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { DrillDownService } from '@/services/drill-down'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const date = searchParams.get('date')
  const subreddit = searchParams.get('subreddit') || 'all'
  const limit = parseInt(searchParams.get('limit') || '10')
  const offset = parseInt(searchParams.get('offset') || '0')

  if (!date) {
    return NextResponse.json(
      { error: 'Date parameter is required' },
      { status: 400 }
    )
  }

  try {
    const drillDownService = new DrillDownService()
    const data = await drillDownService.getPostsForDay(
      date,
      subreddit,
      limit,
      offset
    )

    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, max-age=300' }
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch drill-down data', details: error.message },
      { status: 500 }
    )
  }
}
```

### 2.3 POST /api/ingest/poll

**Purpose:** Triggered by cron job every 30 minutes to fetch new Reddit content.

**Request Body:**
```typescript
interface PollRequest {
  force?: boolean  // Skip rate limit check
}
```

**Response Schema:**
```typescript
interface PollResponse {
  success: boolean
  processed: {
    posts: number
    comments: number
    newSentimentAnalyses: number
    aggregatesUpdated: number
  }
  errors?: Array<{
    stage: 'fetch' | 'sentiment' | 'aggregation'
    error: string
  }>
  nextPollAt: string  // ISO timestamp
}
```

**Implementation:**
```typescript
// /app/api/ingest/poll/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { RedditService } from '@/services/reddit'
import { SentimentService } from '@/services/sentiment'
import { AggregationService } from '@/services/aggregation'

export async function POST(request: NextRequest) {
  const { force } = await request.json()

  try {
    const redditService = new RedditService()
    const sentimentService = new SentimentService()
    const aggregationService = new AggregationService()

    // Step 1: Fetch new posts/comments
    const newItems = await redditService.fetchNewItems(['ClaudeAI', 'ClaudeCode', 'Anthropic'])

    // Step 2: Filter and deduplicate
    const filtered = await redditService.filterAndDeduplicate(newItems)

    // Step 3: Sentiment analysis (batch)
    const analyzed = await sentimentService.analyzeBatch(filtered)

    // Step 4: Update daily aggregates
    const aggregatesUpdated = await aggregationService.updateFromNewData(analyzed)

    // Step 5: Invalidate caches
    await CacheService.invalidatePattern('dashboard:*')

    return NextResponse.json({
      success: true,
      processed: {
        posts: newItems.posts.length,
        comments: newItems.comments.length,
        newSentimentAnalyses: analyzed.length,
        aggregatesUpdated
      },
      nextPollAt: new Date(Date.now() + 30 * 60 * 1000).toISOString()
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
```

**Cron Configuration (Vercel):**
```json
// vercel.json
{
  "crons": [{
    "path": "/api/ingest/poll",
    "schedule": "*/30 * * * *"
  }]
}
```

### 2.4 POST /api/ingest/backfill

**Purpose:** One-time or manual backfill of historical data (90 days).

**Request Body:**
```typescript
interface BackfillRequest {
  days?: number         // default 90
  subreddits?: string[] // default all configured
  batchSize?: number    // default 100 posts per batch
}
```

**Response Schema:**
```typescript
interface BackfillResponse {
  success: boolean
  status: 'completed' | 'in_progress' | 'failed'
  progress: {
    daysProcessed: number
    totalDays: number
    postsProcessed: number
    commentsProcessed: number
    sentimentAnalyzed: number
  }
  estimatedCompletion?: string  // ISO timestamp
  jobId?: string                // for tracking async jobs
}
```

**Implementation:**
```typescript
// /app/api/ingest/backfill/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { BackfillService } from '@/services/backfill'

export async function POST(request: NextRequest) {
  const { days = 90, subreddits, batchSize = 100 } = await request.json()

  try {
    const backfillService = new BackfillService()

    // Start backfill job (async)
    const jobId = await backfillService.startBackfill({
      days,
      subreddits: subreddits || ['ClaudeAI', 'ClaudeCode', 'Anthropic'],
      batchSize
    })

    return NextResponse.json({
      success: true,
      status: 'in_progress',
      jobId,
      message: 'Backfill started. Check /api/ingest/backfill/status/{jobId} for progress.'
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
```

### 2.5 GET /api/export/csv

**Purpose:** Export dashboard data as CSV file.

**Query Parameters:**
```typescript
interface ExportParams {
  subreddit: string
  timeRange: number
  format?: 'summary' | 'detailed'  // default 'summary'
}
```

**Response:**
- Content-Type: `text/csv`
- Content-Disposition: `attachment; filename="claude-code-sentiment-{subreddit}-{range}d-{date}.csv"`

**CSV Schema (Summary):**
```csv
Date,Subreddit,Sentiment,PostCount,PositivePercent,NegativePercent,NeutralPercent,TopKeywords
2025-10-01,all,0.42,127,62,12,26,"claude code,release,cursor"
2025-10-02,all,0.38,143,58,15,27,"update,bug,feature"
```

**Implementation:**
```typescript
// /app/api/export/csv/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { ExportService } from '@/services/export'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const subreddit = searchParams.get('subreddit') || 'all'
  const timeRange = parseInt(searchParams.get('timeRange') || '30')
  const format = searchParams.get('format') || 'summary'

  try {
    const exportService = new ExportService()
    const csv = await exportService.generateCSV(subreddit, timeRange, format)

    const filename = `claude-code-sentiment-${subreddit}-${timeRange}d-${new Date().toISOString().split('T')[0]}.csv`

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate CSV', details: error.message },
      { status: 500 }
    )
  }
}
```

---

## 3. Frontend-Backend Data Flow

### 3.1 Dashboard Page Data Flow

**Initial Server-Side Render:**
```typescript
// /app/dashboard/page.tsx (Server Component)
import { AggregationService } from '@/services/aggregation'

export default async function DashboardPage() {
  // Fetch initial data during SSR
  const aggregationService = new AggregationService()
  const initialData = await aggregationService.getDashboardData('all', 30)

  return <DashboardClient initialData={initialData} />
}
```

**Client-Side Hydration & Updates:**
```typescript
// /app/dashboard/client.tsx (Client Component)
'use client'

import useSWR from 'swr'

export default function DashboardClient({ initialData }) {
  const [subreddit, setSubreddit] = useState('all')
  const [timeRange, setTimeRange] = useState(30)

  // SWR for client-side data fetching
  const { data, error, isLoading } = useSWR(
    `/api/dashboard/data?subreddit=${subreddit}&timeRange=${timeRange}`,
    fetcher,
    {
      fallbackData: initialData,
      revalidateOnFocus: true,
      refreshInterval: 60000,  // Refresh every minute
      dedupingInterval: 30000  // Dedupe requests within 30s
    }
  )

  // Handle tab changes
  const handleSubredditChange = (newSubreddit) => {
    setSubreddit(newSubreddit)
    // SWR automatically fetches new data
  }

  // Handle time range changes
  const handleTimeRangeChange = (newRange) => {
    setTimeRange(newRange)
    // SWR automatically fetches new data
  }

  return (
    <DashboardShell>
      <ControlsBar
        activeSubreddit={subreddit}
        onSubredditChange={handleSubredditChange}
        activeTimeRange={timeRange}
        onTimeRangeChange={handleTimeRangeChange}
      />
      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState error={error} />
      ) : (
        <MainContent
          data={data}
          onDayClick={handleDayClick}
        />
      )}
    </DashboardShell>
  )
}
```

### 3.2 State Management Strategy

**Global State (React Context):**
```typescript
// /contexts/DashboardContext.tsx
import { createContext, useContext, useState } from 'react'

interface DashboardContextValue {
  subreddit: string
  setSubreddit: (s: string) => void
  timeRange: number
  setTimeRange: (t: number) => void
  drillDownDate: string | null
  setDrillDownDate: (d: string | null) => void
}

const DashboardContext = createContext<DashboardContextValue>(null)

export function DashboardProvider({ children }) {
  const [subreddit, setSubreddit] = useState('all')
  const [timeRange, setTimeRange] = useState(30)
  const [drillDownDate, setDrillDownDate] = useState(null)

  return (
    <DashboardContext.Provider value={{
      subreddit, setSubreddit,
      timeRange, setTimeRange,
      drillDownDate, setDrillDownDate
    }}>
      {children}
    </DashboardContext.Provider>
  )
}

export const useDashboard = () => useContext(DashboardContext)
```

**Data Fetching Strategy (SWR vs TanStack Query):**

**Recommendation: SWR** (lighter, Next.js optimized)

```typescript
// /lib/fetchers.ts
export const fetcher = (url: string) => fetch(url).then(r => r.json())

// /hooks/useDashboardData.ts
import useSWR from 'swr'

export function useDashboardData(subreddit: string, timeRange: number) {
  return useSWR(
    `/api/dashboard/data?subreddit=${subreddit}&timeRange=${timeRange}`,
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 30000,
      refreshInterval: 60000
    }
  )
}

// /hooks/useDrillDown.ts
export function useDrillDown(date: string | null, subreddit: string) {
  return useSWR(
    date ? `/api/drill-down?date=${date}&subreddit=${subreddit}` : null,
    fetcher
  )
}
```

### 3.3 Optimistic Updates vs Server-Driven

**Strategy: Server-Driven (No Optimistic Updates)**

**Rationale:**
- Data is read-heavy, not write-heavy (no user mutations)
- Accuracy is critical (sentiment data should not be predicted)
- Polling happens server-side, not triggered by users
- Simple architecture: single source of truth

**Exception: CSV Export**
- Client-side download trigger
- No server state mutation
- Fire-and-forget pattern

### 3.4 Real-Time Polling vs Static Refresh

**Strategy: Static Refresh with SWR Auto-Revalidation**

**Configuration:**
- Background refresh: Every 60 seconds (SWR refreshInterval)
- On window focus: Revalidate immediately
- No WebSocket/SSE required (data updates every 30min via cron)

**Alternative for Future:**
If real-time updates needed:
```typescript
// Server-Sent Events (SSE)
// /app/api/dashboard/stream/route.ts
export async function GET() {
  const stream = new TransformStream()
  const writer = stream.writable.getWriter()

  // Send updates when new data available
  const interval = setInterval(async () => {
    const data = await getLatestData()
    writer.write(`data: ${JSON.stringify(data)}\n\n`)
  }, 30000)

  return new Response(stream.readable, {
    headers: { 'Content-Type': 'text/event-stream' }
  })
}
```

---

## 4. Service Layer Architecture

### 4.1 RedditService

**Purpose:** Fetch, filter, and deduplicate Reddit posts/comments.

**Dependencies:**
- RedditAPIClient (OAuth, rate limiting)
- Database (for deduplication)
- CacheService

**Key Methods:**
```typescript
class RedditService {
  constructor(
    private redditClient: RedditAPIClient,
    private db: Database,
    private cache: CacheService
  ) {}

  // Fetch new items since last poll
  async fetchNewItems(subreddits: string[]): Promise<RedditItems> {
    const lastPollTime = await this.getLastPollTime()
    const items = { posts: [], comments: [] }

    for (const subreddit of subreddits) {
      const cacheKey = `reddit:${subreddit}:latest`
      const cached = await this.cache.get(cacheKey)

      if (cached && Date.now() - cached.timestamp < 30 * 60 * 1000) {
        items.posts.push(...cached.posts)
        items.comments.push(...cached.comments)
        continue
      }

      // Fetch from Reddit API
      const newPosts = await this.redditClient.getNewPosts(subreddit, lastPollTime)
      const newComments = await this.redditClient.getNewComments(subreddit, lastPollTime)

      items.posts.push(...newPosts)
      items.comments.push(...newComments)

      // Cache for 30 minutes
      await this.cache.set(cacheKey, { posts: newPosts, comments: newComments, timestamp: Date.now() }, 1800)
    }

    return items
  }

  // Filter spam, bots, non-English content
  async filterAndDeduplicate(items: RedditItems): Promise<RedditItems> {
    const filtered = { posts: [], comments: [] }

    for (const post of items.posts) {
      // Skip if already processed
      if (await this.db.postExists(post.id)) continue

      // Quality filters
      if (this.isSpam(post)) continue
      if (this.isBot(post.author)) continue
      if (!this.isEnglish(post.text)) continue

      filtered.posts.push(post)
    }

    // Same for comments
    for (const comment of items.comments) {
      if (await this.db.commentExists(comment.id)) continue
      if (this.isSpam(comment)) continue
      if (this.isBot(comment.author)) continue
      if (!this.isEnglish(comment.text)) continue

      filtered.comments.push(comment)
    }

    return filtered
  }

  // Spam detection
  private isSpam(item: RedditPost | RedditComment): boolean {
    const text = item.title || item.body

    // Check for excessive links
    const linkCount = (text.match(/https?:\/\//g) || []).length
    if (linkCount > 3) return true

    // Check for common spam patterns
    if (text.match(/\b(buy|cheap|discount|click here)\b/i)) return true

    // Check if deleted/removed
    if (item.removed || item.deleted) return true

    return false
  }

  // Bot detection
  private isBot(author: string): boolean {
    const botPatterns = [/bot$/i, /^AutoModerator$/i, /^ModeratorBot$/i]
    return botPatterns.some(pattern => pattern.test(author))
  }

  // Language detection (simple heuristic)
  private isEnglish(text: string): boolean {
    // Use language detection library or simple heuristic
    const nonEnglishChars = text.match(/[^\x00-\x7F]/g) || []
    return nonEnglishChars.length / text.length < 0.3
  }

  // Backfill historical data
  async backfill(days: number, subreddits: string[]): Promise<void> {
    const endDate = new Date()
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000)

    for (const subreddit of subreddits) {
      let after = null
      let hasMore = true

      while (hasMore) {
        const batch = await this.redditClient.getHistoricalPosts(
          subreddit,
          startDate,
          endDate,
          after
        )

        await this.db.insertPosts(batch.posts)

        after = batch.after
        hasMore = batch.hasMore

        // Rate limit: wait 1 second between batches
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
  }
}
```

### 4.2 SentimentService

**Purpose:** Analyze sentiment using OpenAI API with 7-day caching.

**Dependencies:**
- OpenAI API Client
- CacheService (7-day TTL)
- Database (store results)

**Key Methods:**
```typescript
class SentimentService {
  constructor(
    private openai: OpenAIClient,
    private cache: CacheService,
    private db: Database
  ) {}

  // Analyze single item
  async analyze(item: RedditPost | RedditComment): Promise<SentimentResult> {
    const cacheKey = `sentiment:${item.id}`
    const cached = await this.cache.get(cacheKey)

    if (cached) {
      return cached
    }

    const text = item.title ? `${item.title}\n${item.body}` : item.body
    const result = await this.openai.analyzeSentiment(text)

    // Cache for 7 days
    await this.cache.set(cacheKey, result, 7 * 24 * 60 * 60)

    // Store in database
    await this.db.insertSentimentResult({
      itemId: item.id,
      itemType: item.type,
      sentiment: result.sentiment,
      positive: result.scores.positive,
      negative: result.scores.negative,
      neutral: result.scores.neutral,
      confidence: result.confidence,
      analyzedAt: new Date()
    })

    return result
  }

  // Batch analysis (efficient for backfill)
  async analyzeBatch(items: Array<RedditPost | RedditComment>): Promise<SentimentResult[]> {
    const results = []
    const uncached = []

    // Check cache first
    for (const item of items) {
      const cacheKey = `sentiment:${item.id}`
      const cached = await this.cache.get(cacheKey)

      if (cached) {
        results.push({ ...cached, itemId: item.id })
      } else {
        uncached.push(item)
      }
    }

    // Batch analyze uncached items (max 20 per batch for API limits)
    const batchSize = 20
    for (let i = 0; i < uncached.length; i += batchSize) {
      const batch = uncached.slice(i, i + batchSize)
      const batchResults = await this.openai.analyzeSentimentBatch(
        batch.map(item => item.title ? `${item.title}\n${item.body}` : item.body)
      )

      for (let j = 0; j < batch.length; j++) {
        const item = batch[j]
        const result = batchResults[j]

        // Cache and store
        await this.cache.set(`sentiment:${item.id}`, result, 7 * 24 * 60 * 60)
        await this.db.insertSentimentResult({
          itemId: item.id,
          itemType: item.type,
          ...result,
          analyzedAt: new Date()
        })

        results.push({ ...result, itemId: item.id })
      }

      // Rate limit: wait 2 seconds between batches
      await new Promise(resolve => setTimeout(resolve, 2000))
    }

    return results
  }
}
```

**OpenAI Prompt Template:**
```typescript
const SENTIMENT_PROMPT = `Analyze the sentiment of the following Reddit post/comment about Claude Code (an AI coding assistant).

Return a JSON object with:
- sentiment: number from -1 (very negative) to +1 (very positive)
- scores: { positive: 0-1, negative: 0-1, neutral: 0-1 }
- confidence: 0-1 (how confident you are in this analysis)

Text: "{text}"

Response (JSON only):
`
```

### 4.3 AggregationService

**Purpose:** Compute daily rollups, keyword extraction, statistics.

**Dependencies:**
- Database (read sentiment results, write aggregates)
- CacheService (cache computed aggregates)

**Key Methods:**
```typescript
class AggregationService {
  constructor(
    private db: Database,
    private cache: CacheService
  ) {}

  // Get dashboard data (aggregates for time range)
  async getDashboardData(subreddit: string, timeRange: number): Promise<DashboardData> {
    const endDate = new Date()
    const startDate = new Date(endDate.getTime() - timeRange * 24 * 60 * 60 * 1000)

    // Try cache first
    const cacheKey = `aggregates:${subreddit}:${timeRange}`
    const cached = await this.cache.get(cacheKey)
    if (cached) return cached

    // Query daily aggregates from database
    const aggregates = await this.db.getDailyAggregates(subreddit, startDate, endDate)

    // Compute summary metrics
    const summary = this.computeSummary(aggregates)

    // Extract keywords
    const keywords = await this.extractKeywords(subreddit, startDate, endDate)

    const result = {
      summary,
      timeseries: aggregates.map(a => ({
        date: a.date,
        sentiment: a.avgSentiment,
        volume: a.totalCount,
        positiveCount: a.positiveCount,
        negativeCount: a.negativeCount,
        neutralCount: a.neutralCount
      })),
      keywords,
      metadata: {
        subreddit,
        dataSource: 'live',
        lastUpdated: new Date().toISOString()
      }
    }

    // Cache for 30 minutes
    await this.cache.set(cacheKey, result, 1800)

    return result
  }

  // Update aggregates from new data
  async updateFromNewData(items: Array<{ itemId: string, sentiment: number }>): Promise<number> {
    const updates = new Map<string, DailyAggregate>()

    for (const item of items) {
      const itemData = await this.db.getItem(item.itemId)
      const date = itemData.timestamp.toISOString().split('T')[0]
      const subreddit = itemData.subreddit

      const key = `${date}:${subreddit}`
      if (!updates.has(key)) {
        const existing = await this.db.getDailyAggregate(date, subreddit)
        updates.set(key, existing || this.createEmptyAggregate(date, subreddit))
      }

      const agg = updates.get(key)
      agg.totalCount++
      agg.sentimentSum += item.sentiment
      agg.avgSentiment = agg.sentimentSum / agg.totalCount

      if (item.sentiment > 0.3) agg.positiveCount++
      else if (item.sentiment < -0.3) agg.negativeCount++
      else agg.neutralCount++
    }

    // Save all updated aggregates
    for (const [key, agg] of updates) {
      await this.db.upsertDailyAggregate(agg)
    }

    // Invalidate cache
    await this.cache.invalidatePattern('aggregates:*')

    return updates.size
  }

  // Extract top keywords
  async extractKeywords(subreddit: string, startDate: Date, endDate: Date): Promise<Keyword[]> {
    const items = await this.db.getItemsInRange(subreddit, startDate, endDate)

    const wordFreq = new Map<string, number>()
    const stopWords = new Set(['the', 'a', 'an', 'is', 'it', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for'])

    for (const item of items) {
      const text = (item.title || '') + ' ' + (item.body || '')
      const words = text.toLowerCase().match(/\b[a-z]{3,}\b/g) || []

      for (const word of words) {
        if (!stopWords.has(word)) {
          wordFreq.set(word, (wordFreq.get(word) || 0) + 1)
        }
      }
    }

    // Sort by frequency, take top 20
    const sorted = Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)

    const maxFreq = sorted[0]?.[1] || 1

    return sorted.map(([keyword, frequency]) => ({
      keyword,
      frequency,
      relativeFrequency: frequency / maxFreq
    }))
  }

  private computeSummary(aggregates: DailyAggregate[]): DashboardSummary {
    const totalPosts = aggregates.reduce((sum, a) => sum + a.totalCount, 0)
    const avgSentiment = aggregates.reduce((sum, a) => sum + a.avgSentiment * a.totalCount, 0) / totalPosts
    const totalPositive = aggregates.reduce((sum, a) => sum + a.positiveCount, 0)
    const totalNegative = aggregates.reduce((sum, a) => sum + a.negativeCount, 0)
    const totalNeutral = aggregates.reduce((sum, a) => sum + a.neutralCount, 0)

    return {
      avgSentiment,
      positivePercent: (totalPositive / totalPosts) * 100,
      negativePercent: (totalNegative / totalPosts) * 100,
      neutralPercent: (totalNeutral / totalPosts) * 100,
      totalPosts,
      timeRange: aggregates.length,
      lastUpdated: new Date().toISOString()
    }
  }
}
```

### 4.4 CacheService

**Purpose:** Unified caching layer with TTL support.

**Backends:**
- Development: In-memory LRU cache
- Production: Redis (optional) or file-based cache

**Key Methods:**
```typescript
class CacheService {
  private cache: LRUCache | Redis

  async get<T>(key: string): Promise<T | null> {
    const value = await this.cache.get(key)
    if (!value) return null

    const parsed = JSON.parse(value)
    if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
      await this.cache.del(key)
      return null
    }

    return parsed.data
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    const data = {
      data: value,
      expiresAt: Date.now() + ttlSeconds * 1000
    }
    await this.cache.set(key, JSON.stringify(data))
  }

  async getStale<T>(key: string): Promise<T | null> {
    const value = await this.cache.get(key)
    if (!value) return null
    return JSON.parse(value).data
  }

  async invalidatePattern(pattern: string): Promise<void> {
    const keys = await this.cache.keys(pattern)
    for (const key of keys) {
      await this.cache.del(key)
    }
  }
}
```

---

## 5. Data Storage & Schema

### 5.1 Database Choice

**Recommendation: PostgreSQL** (with SQLite fallback for development)

**Rationale:**
- Need for complex queries (date ranges, aggregations, joins)
- PostgreSQL's JSONB for flexible metadata storage
- Better indexing for time-series data
- Supports full-text search (future keyword filtering)
- Easy to deploy on Vercel/Railway/Supabase

**Alternative: SQLite** (for simple deployments)
- Single file, no external dependencies
- Good performance for <1M rows
- Limited concurrent writes (not ideal for polling + web requests)

### 5.2 Schema Design

**raw_posts table:**
```sql
CREATE TABLE raw_posts (
  id VARCHAR(50) PRIMARY KEY,           -- Reddit post ID
  subreddit VARCHAR(50) NOT NULL,       -- 'ClaudeAI', 'ClaudeCode', etc.
  author VARCHAR(100),
  title TEXT,
  body TEXT,
  score INTEGER DEFAULT 0,              -- Reddit score
  num_comments INTEGER DEFAULT 0,
  flair TEXT,
  url TEXT,                             -- Reddit URL
  created_at TIMESTAMP NOT NULL,        -- Post timestamp
  removed BOOLEAN DEFAULT FALSE,
  deleted BOOLEAN DEFAULT FALSE,
  metadata JSONB,                       -- Additional fields
  ingested_at TIMESTAMP DEFAULT NOW(),  -- When we fetched it

  INDEX idx_subreddit_created (subreddit, created_at),
  INDEX idx_created_at (created_at)
);
```

**raw_comments table:**
```sql
CREATE TABLE raw_comments (
  id VARCHAR(50) PRIMARY KEY,           -- Reddit comment ID
  post_id VARCHAR(50),                  -- Parent post ID
  subreddit VARCHAR(50) NOT NULL,
  author VARCHAR(100),
  body TEXT,
  score INTEGER DEFAULT 0,
  parent_id VARCHAR(50),                -- Parent comment (if nested)
  created_at TIMESTAMP NOT NULL,
  removed BOOLEAN DEFAULT FALSE,
  deleted BOOLEAN DEFAULT FALSE,
  metadata JSONB,
  ingested_at TIMESTAMP DEFAULT NOW(),

  INDEX idx_subreddit_created (subreddit, created_at),
  INDEX idx_post_id (post_id)
);
```

**sentiment_results table:**
```sql
CREATE TABLE sentiment_results (
  id SERIAL PRIMARY KEY,
  item_id VARCHAR(50) NOT NULL,         -- post or comment ID
  item_type VARCHAR(10) NOT NULL,       -- 'post' or 'comment'
  sentiment FLOAT NOT NULL,             -- -1 to +1
  positive_score FLOAT,                 -- 0-1
  negative_score FLOAT,                 -- 0-1
  neutral_score FLOAT,                  -- 0-1
  confidence FLOAT,                     -- 0-1
  analyzed_at TIMESTAMP DEFAULT NOW(),

  UNIQUE (item_id, item_type),
  INDEX idx_item_id (item_id),
  INDEX idx_analyzed_at (analyzed_at)
);
```

**daily_aggregates table:**
```sql
CREATE TABLE daily_aggregates (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  subreddit VARCHAR(50) NOT NULL,       -- 'all', 'ClaudeAI', etc.
  total_count INTEGER DEFAULT 0,
  sentiment_sum FLOAT DEFAULT 0,
  avg_sentiment FLOAT DEFAULT 0,
  positive_count INTEGER DEFAULT 0,
  negative_count INTEGER DEFAULT 0,
  neutral_count INTEGER DEFAULT 0,
  top_keywords JSONB,                   -- [{keyword, frequency}, ...]
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE (date, subreddit),
  INDEX idx_date_subreddit (date, subreddit),
  INDEX idx_subreddit_date (subreddit, date)
);
```

**keywords table (optional, for better keyword search):**
```sql
CREATE TABLE keywords (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  subreddit VARCHAR(50) NOT NULL,
  keyword VARCHAR(100) NOT NULL,
  frequency INTEGER DEFAULT 0,

  INDEX idx_date_subreddit (date, subreddit),
  INDEX idx_keyword (keyword)
);
```

### 5.3 Indexes for Performance

**Critical Indexes:**
```sql
-- Fast date range queries for dashboard
CREATE INDEX idx_posts_subreddit_created ON raw_posts (subreddit, created_at DESC);
CREATE INDEX idx_comments_subreddit_created ON raw_comments (subreddit, created_at DESC);

-- Fast aggregate lookups
CREATE INDEX idx_aggregates_date_range ON daily_aggregates (subreddit, date DESC);

-- Fast drill-down queries
CREATE INDEX idx_posts_date ON raw_posts (created_at::date, subreddit);
CREATE INDEX idx_comments_date ON raw_comments (created_at::date, subreddit);

-- Sentiment joins
CREATE INDEX idx_sentiment_item ON sentiment_results (item_id, item_type);
```

**Query Optimization Examples:**

**Dashboard data query (optimized):**
```sql
-- Get daily aggregates for last 30 days, r/ClaudeAI
SELECT * FROM daily_aggregates
WHERE subreddit = 'ClaudeAI'
  AND date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY date DESC;
-- Uses: idx_aggregates_date_range (index scan, <10ms)
```

**Drill-down query (optimized):**
```sql
-- Get top posts for Oct 15, 2025 with sentiment
SELECT p.*, s.sentiment, s.confidence
FROM raw_posts p
JOIN sentiment_results s ON s.item_id = p.id AND s.item_type = 'post'
WHERE p.created_at::date = '2025-10-15'
  AND p.subreddit = 'ClaudeAI'
ORDER BY p.score DESC
LIMIT 10;
-- Uses: idx_posts_date + idx_sentiment_item (fast join, <50ms)
```

### 5.4 Data Retention & Cleanup

**90-Day Rolling Window:**
```sql
-- Cron job to delete old data (run daily)
DELETE FROM raw_posts WHERE created_at < CURRENT_DATE - INTERVAL '90 days';
DELETE FROM raw_comments WHERE created_at < CURRENT_DATE - INTERVAL '90 days';
DELETE FROM sentiment_results WHERE analyzed_at < CURRENT_DATE - INTERVAL '90 days';
DELETE FROM daily_aggregates WHERE date < CURRENT_DATE - INTERVAL '90 days';
```

**Archive Strategy (optional):**
```sql
-- Archive to S3/cold storage before deletion
INSERT INTO archive_posts SELECT * FROM raw_posts WHERE created_at < CURRENT_DATE - INTERVAL '90 days';
-- Then delete
```

---

## 6. Dependency Injection & Configuration

### 6.1 Service Instantiation Pattern

**Singleton Pattern for Services:**
```typescript
// /lib/services/index.ts
import { RedditService } from './reddit'
import { SentimentService } from './sentiment'
import { AggregationService } from './aggregation'
import { CacheService } from './cache'

// Singleton instances
let redditService: RedditService
let sentimentService: SentimentService
let aggregationService: AggregationService
let cacheService: CacheService

export function getRedditService(): RedditService {
  if (!redditService) {
    const redditClient = new RedditAPIClient({
      clientId: process.env.REDDIT_CLIENT_ID,
      clientSecret: process.env.REDDIT_CLIENT_SECRET,
      userAgent: process.env.REDDIT_USER_AGENT
    })
    const db = getDatabase()
    const cache = getCacheService()

    redditService = new RedditService(redditClient, db, cache)
  }
  return redditService
}

export function getSentimentService(): SentimentService {
  if (!sentimentService) {
    const openai = new OpenAIClient({
      apiKey: process.env.OPENAI_API_KEY
    })
    const db = getDatabase()
    const cache = getCacheService()

    sentimentService = new SentimentService(openai, db, cache)
  }
  return sentimentService
}

export function getAggregationService(): AggregationService {
  if (!aggregationService) {
    const db = getDatabase()
    const cache = getCacheService()

    aggregationService = new AggregationService(db, cache)
  }
  return aggregationService
}

export function getCacheService(): CacheService {
  if (!cacheService) {
    if (process.env.REDIS_URL) {
      cacheService = new RedisCacheService(process.env.REDIS_URL)
    } else {
      cacheService = new InMemoryCacheService()
    }
  }
  return cacheService
}
```

### 6.2 Environment Variables

```bash
# .env.local

# Reddit API
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret
REDDIT_USER_AGENT="Claude Code Sentiment Monitor/1.0"
REDDIT_USERNAME=your_reddit_username  # For OAuth
REDDIT_PASSWORD=your_reddit_password

# OpenAI API
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4  # or gpt-3.5-turbo for cost savings

# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname
# or for SQLite:
# DATABASE_URL=sqlite:./data/sentiment.db

# Cache (optional)
REDIS_URL=redis://localhost:6379
# or leave empty for in-memory cache

# Application
SUBREDDITS=ClaudeAI,ClaudeCode,Anthropic
POLLING_INTERVAL_MINUTES=30
BACKFILL_DAYS=90

# Sentiment Analysis
SENTIMENT_CACHE_DAYS=7
BATCH_SIZE=20

# Rate Limiting
REDDIT_REQUESTS_PER_MINUTE=60
OPENAI_TOKENS_PER_MINUTE=10000
```

### 6.3 Configuration Management

```typescript
// /lib/config.ts
export const config = {
  reddit: {
    clientId: process.env.REDDIT_CLIENT_ID!,
    clientSecret: process.env.REDDIT_CLIENT_SECRET!,
    userAgent: process.env.REDDIT_USER_AGENT!,
    username: process.env.REDDIT_USERNAME!,
    password: process.env.REDDIT_PASSWORD!,
    subreddits: (process.env.SUBREDDITS || 'ClaudeAI,ClaudeCode,Anthropic').split(','),
    requestsPerMinute: parseInt(process.env.REDDIT_REQUESTS_PER_MINUTE || '60')
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY!,
    model: process.env.OPENAI_MODEL || 'gpt-4',
    tokensPerMinute: parseInt(process.env.OPENAI_TOKENS_PER_MINUTE || '10000')
  },
  database: {
    url: process.env.DATABASE_URL!
  },
  cache: {
    redisUrl: process.env.REDIS_URL,
    sentimentCacheDays: parseInt(process.env.SENTIMENT_CACHE_DAYS || '7')
  },
  app: {
    pollingIntervalMinutes: parseInt(process.env.POLLING_INTERVAL_MINUTES || '30'),
    backfillDays: parseInt(process.env.BACKFILL_DAYS || '90'),
    batchSize: parseInt(process.env.BATCH_SIZE || '20')
  }
}
```

### 6.4 Dependency Injection in API Routes

```typescript
// /app/api/dashboard/data/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getAggregationService } from '@/lib/services'

export async function GET(request: NextRequest) {
  // Service instantiated via singleton pattern
  const aggregationService = getAggregationService()

  const searchParams = request.nextUrl.searchParams
  const subreddit = searchParams.get('subreddit') || 'all'
  const timeRange = parseInt(searchParams.get('timeRange') || '30')

  const data = await aggregationService.getDashboardData(subreddit, timeRange)

  return NextResponse.json(data)
}
```

---

## 7. Caching Coordination

### 7.1 Multi-Layer Cache Strategy

```
┌─────────────────────────────────────────────────────────────┐
│  Layer 1: Frontend (SWR/TanStack Query)                     │
│  - Dashboard data: 60s stale time, 5min cache               │
│  - Drill-down: 5min cache                                   │
│  - Automatic revalidation on focus/reconnect                │
└─────────────────────────────────────────────────────────────┘
                           ↓ miss
┌─────────────────────────────────────────────────────────────┐
│  Layer 2: HTTP Cache Headers (CDN/Browser)                  │
│  - Cache-Control: public, max-age=1800 (30min)             │
│  - ETag for conditional requests                            │
└─────────────────────────────────────────────────────────────┘
                           ↓ miss
┌─────────────────────────────────────────────────────────────┐
│  Layer 3: Service Layer Cache (Redis/In-Memory)             │
│  - Reddit API responses: 30min                              │
│  - OpenAI sentiment: 7 days                                 │
│  - Dashboard aggregates: 30min                              │
└─────────────────────────────────────────────────────────────┘
                           ↓ miss
┌─────────────────────────────────────────────────────────────┐
│  Layer 4: Database (Persistent Cache)                       │
│  - daily_aggregates table (pre-computed rollups)            │
│  - sentiment_results table (analyzed sentiment)             │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 Cache Key Patterns

```typescript
// Cache key naming convention
const CACHE_KEYS = {
  // Reddit API responses
  redditLatest: (subreddit: string) => `reddit:${subreddit}:latest`,
  redditPost: (postId: string) => `reddit:post:${postId}`,

  // Sentiment analysis
  sentiment: (itemId: string) => `sentiment:${itemId}`,

  // Dashboard aggregates
  dashboard: (subreddit: string, timeRange: number) => `dashboard:${subreddit}:${timeRange}`,
  aggregates: (subreddit: string, timeRange: number) => `aggregates:${subreddit}:${timeRange}`,

  // Drill-down
  drillDown: (date: string, subreddit: string) => `drilldown:${date}:${subreddit}`,

  // Keywords
  keywords: (subreddit: string, startDate: string, endDate: string) =>
    `keywords:${subreddit}:${startDate}:${endDate}`
}
```

### 7.3 Cache Invalidation Strategy

**Event-Driven Invalidation:**
```typescript
class CacheInvalidator {
  // Invalidate after new data ingestion
  async invalidateOnNewData(subreddits: string[]) {
    // Invalidate dashboard caches for affected subreddits
    for (const subreddit of subreddits) {
      await this.cache.invalidatePattern(`dashboard:${subreddit}:*`)
      await this.cache.invalidatePattern(`aggregates:${subreddit}:*`)
    }

    // Also invalidate 'all' subreddit
    await this.cache.invalidatePattern('dashboard:all:*')
    await this.cache.invalidatePattern('aggregates:all:*')
  }

  // Invalidate specific date (for drill-down)
  async invalidateDrillDown(date: string, subreddit: string) {
    await this.cache.del(`drilldown:${date}:${subreddit}`)
  }

  // Invalidate sentiment cache (rare, only if re-analysis needed)
  async invalidateSentiment(itemId: string) {
    await this.cache.del(`sentiment:${itemId}`)
    await this.db.deleteSentimentResult(itemId)
  }
}
```

**Time-Based Invalidation (TTL):**
```typescript
const CACHE_TTL = {
  reddit: 30 * 60,        // 30 minutes
  sentiment: 7 * 24 * 60 * 60,  // 7 days
  dashboard: 30 * 60,     // 30 minutes
  drillDown: 5 * 60,      // 5 minutes
  keywords: 60 * 60       // 1 hour
}
```

### 7.4 Stale-While-Revalidate Pattern

```typescript
// Serve stale cache if API quota exceeded
async function getWithFallback<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number
): Promise<{ data: T, source: 'live' | 'cache' | 'stale' }> {
  // Try fresh cache
  const cached = await cache.get<T>(key)
  if (cached) {
    return { data: cached, source: 'cache' }
  }

  try {
    // Fetch live data
    const data = await fetchFn()
    await cache.set(key, data, ttl)
    return { data, source: 'live' }
  } catch (error) {
    // If quota exceeded, serve stale cache
    if (error.code === 'QUOTA_EXCEEDED') {
      const stale = await cache.getStale<T>(key)
      if (stale) {
        return { data: stale, source: 'stale' }
      }
    }
    throw error
  }
}
```

---

## 8. Error Handling & Retry Patterns

### 8.1 Reddit API Error Handling

**Error Types:**
- 401 Unauthorized: OAuth token expired → Re-authenticate
- 403 Forbidden: Access denied → Log and skip
- 429 Too Many Requests: Rate limit → Exponential backoff
- 500/503 Server Error: Reddit down → Retry with backoff

**Implementation:**
```typescript
class RedditAPIClient {
  private async requestWithRetry<T>(
    url: string,
    options: RequestInit,
    maxRetries = 3
  ): Promise<T> {
    let lastError: Error

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch(url, options)

        // Handle rate limiting
        if (response.status === 429) {
          const retryAfter = parseInt(response.headers.get('Retry-After') || '60')
          console.warn(`Rate limited. Retrying after ${retryAfter}s`)
          await this.sleep(retryAfter * 1000)
          continue
        }

        // Handle OAuth expiration
        if (response.status === 401) {
          await this.refreshToken()
          options.headers['Authorization'] = `Bearer ${this.accessToken}`
          continue
        }

        // Handle server errors with backoff
        if (response.status >= 500) {
          const backoff = Math.pow(2, attempt) * 1000
          console.warn(`Server error ${response.status}. Retrying in ${backoff}ms`)
          await this.sleep(backoff)
          continue
        }

        if (!response.ok) {
          throw new Error(`Reddit API error: ${response.status} ${response.statusText}`)
        }

        return await response.json()
      } catch (error) {
        lastError = error
        const backoff = Math.pow(2, attempt) * 1000
        await this.sleep(backoff)
      }
    }

    throw new Error(`Max retries exceeded: ${lastError.message}`)
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
```

### 8.2 OpenAI API Error Handling

**Error Types:**
- 400 Bad Request: Invalid prompt → Log and skip
- 401 Unauthorized: Invalid API key → Fatal error
- 429 Rate Limit: Quota exceeded → Queue for retry
- 500/503 Server Error: OpenAI down → Exponential backoff

**Implementation:**
```typescript
class OpenAIClient {
  private queue: Array<{ text: string, resolve: Function, reject: Function }> = []
  private processing = false

  async analyzeSentiment(text: string): Promise<SentimentResult> {
    return new Promise((resolve, reject) => {
      this.queue.push({ text, resolve, reject })
      this.processQueue()
    })
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) return
    this.processing = true

    while (this.queue.length > 0) {
      const { text, resolve, reject } = this.queue.shift()!

      try {
        const result = await this.analyzeWithRetry(text, 3)
        resolve(result)
      } catch (error) {
        if (error.code === 'RATE_LIMIT') {
          // Re-queue for later
          this.queue.unshift({ text, resolve, reject })
          await this.sleep(60000)  // Wait 1 minute
        } else {
          reject(error)
        }
      }

      // Rate limit: max 60 requests per minute
      await this.sleep(1000)
    }

    this.processing = false
  }

  private async analyzeWithRetry(text: string, maxRetries: number): Promise<SentimentResult> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await this.openai.chat.completions.create({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: SENTIMENT_SYSTEM_PROMPT },
            { role: 'user', content: text }
          ],
          temperature: 0.3,
          max_tokens: 150
        })

        const result = JSON.parse(response.choices[0].message.content)
        return result
      } catch (error) {
        if (error.status === 429) {
          const backoff = Math.pow(2, attempt) * 2000
          await this.sleep(backoff)
          continue
        }
        throw error
      }
    }

    throw new Error('Max retries exceeded for OpenAI API')
  }
}
```

### 8.3 Database Error Handling

**Error Types:**
- Connection errors: Retry with backoff
- Constraint violations: Skip duplicate, log warning
- Query timeouts: Optimize query or increase timeout
- Deadlocks: Retry transaction

**Implementation:**
```typescript
class Database {
  async withRetry<T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        // Connection errors
        if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
          const backoff = Math.pow(2, attempt) * 1000
          console.warn(`Database connection error. Retrying in ${backoff}ms`)
          await this.sleep(backoff)
          continue
        }

        // Unique constraint violation (duplicate)
        if (error.code === '23505') {
          console.warn(`Duplicate entry: ${error.detail}`)
          return null  // Skip gracefully
        }

        // Deadlock
        if (error.code === '40P01') {
          console.warn('Deadlock detected. Retrying...')
          await this.sleep(100)
          continue
        }

        throw error
      }
    }

    throw new Error('Database operation failed after retries')
  }

  async insertPost(post: RedditPost): Promise<void> {
    await this.withRetry(async () => {
      await this.client.query(
        'INSERT INTO raw_posts (...) VALUES (...) ON CONFLICT (id) DO NOTHING'
      )
    })
  }
}
```

### 8.4 User-Facing Error Messages

**Error Banner Component:**
```typescript
interface ErrorConfig {
  type: 'quota_exceeded' | 'network_error' | 'server_error' | 'no_data'
  message: string
  action?: { label: string, onClick: () => void }
}

const ERROR_MESSAGES: Record<string, ErrorConfig> = {
  quota_exceeded: {
    type: 'quota_exceeded',
    message: 'API quota exceeded. Showing data from {cacheAge}. Next refresh at {nextRefresh}.',
    action: { label: 'Retry Now', onClick: () => window.location.reload() }
  },
  network_error: {
    type: 'network_error',
    message: 'Network error. Please check your connection and try again.',
    action: { label: 'Retry', onClick: () => window.location.reload() }
  },
  server_error: {
    type: 'server_error',
    message: 'Server error. Our team has been notified. Please try again later.',
    action: { label: 'Retry', onClick: () => window.location.reload() }
  },
  no_data: {
    type: 'no_data',
    message: 'No data available yet. Data collection is in progress.',
    action: { label: 'Refresh', onClick: () => window.location.reload() }
  }
}
```

---

## 9. Critical Implementation Sequencing

### Phase 1: Foundation & Setup (Week 1)
**Goal:** Basic infrastructure and Reddit data ingestion

**Tasks:**
1. Set up Next.js 15 project with App Router
   - Initialize with TypeScript, Tailwind CSS
   - Configure environment variables
   - Set up folder structure

2. Database setup (PostgreSQL)
   - Create tables: raw_posts, raw_comments, sentiment_results, daily_aggregates
   - Set up indexes
   - Configure connection pooling

3. Reddit API integration
   - Implement OAuth flow
   - Create RedditAPIClient with rate limiting
   - Build RedditService (fetch, filter, deduplicate)
   - Test with single subreddit

4. Basic API route: /api/ingest/poll
   - Manual trigger for testing
   - Fetch last 24 hours of posts

**Deliverable:** Can fetch Reddit data manually and store in database

### Phase 2: Sentiment Analysis (Week 2)
**Goal:** OpenAI integration with caching

**Tasks:**
1. OpenAI API integration
   - Implement SentimentService
   - Create prompt template for sentiment analysis
   - Test with sample posts

2. Caching layer
   - Implement CacheService (start with in-memory)
   - Add 7-day sentiment cache
   - Test cache hit/miss rates

3. Batch processing
   - Implement batch sentiment analysis
   - Add queue for rate limiting
   - Error handling and retries

4. Update /api/ingest/poll
   - Add sentiment analysis step
   - Store results in sentiment_results table

**Deliverable:** Can analyze sentiment of Reddit posts and cache results

### Phase 3: Aggregation Pipeline (Week 3)
**Goal:** Daily rollups and statistics

**Tasks:**
1. AggregationService
   - Implement daily rollup logic
   - Keyword extraction
   - Summary statistics

2. Database aggregates
   - Populate daily_aggregates table
   - Optimize queries for date ranges
   - Test with historical data

3. API route: /api/dashboard/data
   - Fetch aggregates by subreddit and time range
   - Return formatted response
   - Add caching

4. API route: /api/drill-down
   - Fetch posts for specific day
   - Join with sentiment results
   - Sort by engagement

**Deliverable:** API routes return aggregated data for frontend

### Phase 4: Frontend Dashboard (Week 4)
**Goal:** Build UI and connect to API

**Tasks:**
1. Dashboard shell
   - Header, ControlsBar, MainContent layout
   - Responsive design
   - Loading and error states

2. Charts integration
   - Install Recharts
   - SentimentChart (line chart)
   - VolumeChart (bar chart)
   - Wire up with API data

3. Summary metrics
   - MetricCard components
   - Calculate percentages
   - Display top keywords

4. SWR setup
   - Data fetching hooks
   - Cache configuration
   - Revalidation strategy

**Deliverable:** Functional dashboard with charts

### Phase 5: Drill-Down & CSV Export (Week 5)
**Goal:** Interactive features

**Tasks:**
1. Drill-down modal
   - Modal component
   - Fetch drill-down data on click
   - Display PostList with PostCards

2. CSV export
   - ExportService
   - API route: /api/export/csv
   - Download trigger from frontend

3. Tab switching
   - Subreddit filter logic
   - Update charts on tab change
   - URL query params for bookmarking

4. Time range selector
   - Toggle between 7/30/90 days
   - Update data on change

**Deliverable:** Full interactive dashboard

### Phase 6: Polling & Backfill (Week 6)
**Goal:** Automated data collection

**Tasks:**
1. Cron job setup
   - Configure Vercel cron
   - /api/ingest/poll every 30 minutes
   - Error notifications

2. Backfill implementation
   - /api/ingest/backfill route
   - Batch historical fetch (90 days)
   - Progress tracking

3. Cache invalidation
   - Invalidate on new data
   - Stale cache fallback

4. Monitoring and logging
   - Error tracking (Sentry)
   - Performance monitoring
   - API quota alerts

**Deliverable:** Automated data pipeline

### Phase 7: Polish & Optimization (Week 7)
**Goal:** Performance and UX improvements

**Tasks:**
1. Performance optimization
   - Database query optimization
   - Frontend lazy loading
   - Image optimization

2. Accessibility
   - ARIA labels
   - Keyboard navigation
   - Screen reader testing

3. Error handling polish
   - Better error messages
   - Graceful degradation
   - Retry mechanisms

4. Documentation
   - API documentation
   - Deployment guide
   - Methodology page

**Deliverable:** Production-ready application

---

## 10. Next.js 15 App Router Patterns

### 10.1 File Structure

```
/app
├── layout.tsx              # Root layout (global styles, fonts)
├── page.tsx                # Home page (redirect to /dashboard)
├── dashboard/
│   ├── page.tsx            # Dashboard page (Server Component)
│   ├── client.tsx          # Dashboard client components
│   ├── loading.tsx         # Loading UI
│   └── error.tsx           # Error boundary
├── api/
│   ├── dashboard/
│   │   └── data/
│   │       └── route.ts    # GET /api/dashboard/data
│   ├── drill-down/
│   │   └── route.ts        # GET /api/drill-down
│   ├── ingest/
│   │   ├── poll/
│   │   │   └── route.ts    # POST /api/ingest/poll
│   │   └── backfill/
│   │       └── route.ts    # POST /api/ingest/backfill
│   └── export/
│       └── csv/
│           └── route.ts    # GET /api/export/csv
└── methodology/
    └── page.tsx            # Methodology page (static)
```

### 10.2 Server Components (SSR)

```typescript
// /app/dashboard/page.tsx (Server Component)
import { Suspense } from 'react'
import { getAggregationService } from '@/lib/services'
import DashboardClient from './client'
import LoadingState from '@/components/LoadingState'

export default async function DashboardPage() {
  // Fetch initial data during SSR
  const aggregationService = getAggregationService()
  const initialData = await aggregationService.getDashboardData('all', 30)

  return (
    <Suspense fallback={<LoadingState />}>
      <DashboardClient initialData={initialData} />
    </Suspense>
  )
}

// Metadata API (SEO)
export const metadata = {
  title: 'Claude Code Sentiment Monitor | Dashboard',
  description: 'Track Reddit sentiment about Claude Code from r/ClaudeAI, r/ClaudeCode, and r/Anthropic',
  openGraph: {
    title: 'Claude Code Sentiment Monitor',
    description: 'Daily sentiment trends and discussion volume for Claude Code',
    images: ['/og-image.png']
  }
}
```

### 10.3 Client Components (Interactivity)

```typescript
// /app/dashboard/client.tsx (Client Component)
'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { DashboardShell } from '@/components/DashboardShell'

export default function DashboardClient({ initialData }) {
  const [subreddit, setSubreddit] = useState('all')
  const [timeRange, setTimeRange] = useState(30)

  const { data, error, isLoading } = useSWR(
    `/api/dashboard/data?subreddit=${subreddit}&timeRange=${timeRange}`,
    fetcher,
    { fallbackData: initialData }
  )

  return (
    <DashboardShell
      data={data}
      isLoading={isLoading}
      error={error}
      onSubredditChange={setSubreddit}
      onTimeRangeChange={setTimeRange}
    />
  )
}
```

### 10.4 Loading & Error UI

```typescript
// /app/dashboard/loading.tsx
export default function Loading() {
  return <LoadingState />
}

// /app/dashboard/error.tsx
'use client'

export default function Error({ error, reset }) {
  return (
    <div className="error-container">
      <h2>Something went wrong!</h2>
      <p>{error.message}</p>
      <button onClick={reset}>Try again</button>
    </div>
  )
}
```

### 10.5 Layouts for Shared UI

```typescript
// /app/layout.tsx (Root Layout)
import { Inter } from 'next/font/google'
import { DashboardProvider } from '@/contexts/DashboardContext'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <DashboardProvider>
          {children}
        </DashboardProvider>
      </body>
    </html>
  )
}

// /app/dashboard/layout.tsx (Dashboard Layout)
import Header from '@/components/Header'

export default function DashboardLayout({ children }) {
  return (
    <div className="dashboard-layout">
      <Header />
      <main>{children}</main>
    </div>
  )
}
```

---

## 11. Performance Optimization

### 11.1 Database Query Optimization

**Efficient Date Range Queries:**
```sql
-- Before (slow - table scan)
SELECT * FROM raw_posts WHERE created_at >= '2025-09-01' AND created_at <= '2025-09-30';

-- After (fast - index scan)
SELECT * FROM raw_posts
WHERE subreddit = 'ClaudeAI'
  AND created_at >= '2025-09-01'
  AND created_at <= '2025-09-30'
ORDER BY created_at DESC;
-- Uses: idx_posts_subreddit_created
```

**Aggregate Pre-Computation:**
```sql
-- Instead of computing on each request
SELECT
  DATE(created_at) as date,
  AVG(s.sentiment) as avg_sentiment,
  COUNT(*) as total_count
FROM raw_posts p
JOIN sentiment_results s ON s.item_id = p.id
WHERE p.created_at >= '2025-09-01'
GROUP BY DATE(created_at);

-- Pre-compute and store in daily_aggregates
SELECT * FROM daily_aggregates WHERE date >= '2025-09-01';
-- 100x faster
```

**Connection Pooling:**
```typescript
// /lib/database.ts
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,                    // Max connections
  idleTimeoutMillis: 30000,   // Close idle connections
  connectionTimeoutMillis: 2000
})

export async function query(text: string, params?: any[]) {
  const start = Date.now()
  const res = await pool.query(text, params)
  const duration = Date.now() - start

  if (duration > 1000) {
    console.warn(`Slow query (${duration}ms): ${text}`)
  }

  return res
}
```

### 11.2 API Route Response Caching

**HTTP Cache Headers:**
```typescript
// /app/api/dashboard/data/route.ts
export async function GET(request: NextRequest) {
  const data = await getAggregationService().getDashboardData(...)

  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
      'CDN-Cache-Control': 'public, s-maxage=1800',
      'Vercel-CDN-Cache-Control': 'public, s-maxage=1800'
    }
  })
}
```

**ETag Support:**
```typescript
import { createHash } from 'crypto'

export async function GET(request: NextRequest) {
  const data = await getAggregationService().getDashboardData(...)

  const etag = createHash('md5').update(JSON.stringify(data)).digest('hex')
  const ifNoneMatch = request.headers.get('if-none-match')

  if (ifNoneMatch === etag) {
    return new NextResponse(null, { status: 304 })
  }

  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, max-age=1800',
      'ETag': etag
    }
  })
}
```

### 11.3 Frontend Lazy Loading

**Chart Library Code Splitting:**
```typescript
// /components/SentimentChart.tsx
import dynamic from 'next/dynamic'

const Recharts = dynamic(() => import('recharts').then(mod => mod.LineChart), {
  loading: () => <ChartSkeleton />,
  ssr: false
})

export function SentimentChart({ data }) {
  return <Recharts data={data} ... />
}
```

**Image Optimization:**
```typescript
import Image from 'next/image'

<Image
  src="/og-image.png"
  alt="Dashboard preview"
  width={1200}
  height={630}
  priority={false}
  loading="lazy"
/>
```

### 11.4 Debouncing User Interactions

**Tab Switching:**
```typescript
import { useDebouncedCallback } from 'use-debounce'

export function SubredditTabs({ onChange }) {
  const debouncedChange = useDebouncedCallback(
    (subreddit) => onChange(subreddit),
    300
  )

  return (
    <div>
      <button onClick={() => debouncedChange('all')}>All</button>
      <button onClick={() => debouncedChange('ClaudeAI')}>r/ClaudeAI</button>
    </div>
  )
}
```

---

## 12. Security & Compliance

### 12.1 API Key Protection

**Environment Variables:**
```typescript
// Never expose in client-side code
// ❌ Bad
const apiKey = process.env.NEXT_PUBLIC_OPENAI_KEY  // Exposed to browser!

// ✅ Good
const apiKey = process.env.OPENAI_API_KEY  // Server-side only
```

**Secure Storage:**
```bash
# Use Vercel environment variables (encrypted at rest)
vercel env add OPENAI_API_KEY

# Or use secret management (AWS Secrets Manager, etc.)
```

### 12.2 Reddit OAuth Credentials

**OAuth Flow:**
```typescript
class RedditOAuthClient {
  private accessToken: string
  private tokenExpiry: Date

  async authenticate() {
    const auth = Buffer.from(
      `${process.env.REDDIT_CLIENT_ID}:${process.env.REDDIT_CLIENT_SECRET}`
    ).toString('base64')

    const response = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'password',
        username: process.env.REDDIT_USERNAME,
        password: process.env.REDDIT_PASSWORD
      })
    })

    const data = await response.json()
    this.accessToken = data.access_token
    this.tokenExpiry = new Date(Date.now() + data.expires_in * 1000)
  }

  async getAccessToken() {
    if (!this.accessToken || Date.now() >= this.tokenExpiry.getTime()) {
      await this.authenticate()
    }
    return this.accessToken
  }
}
```

### 12.3 Data Privacy (No PII)

**Reddit Data:**
- Store only public data (posts, comments)
- Do NOT store user emails, IPs, or private messages
- Anonymize usernames in exports (optional)

**Compliance:**
```typescript
// Filter out potentially sensitive data
function sanitizePost(post: RedditPost): RedditPost {
  return {
    id: post.id,
    subreddit: post.subreddit,
    author: post.author,  // Public Reddit username (OK)
    title: post.title,
    body: post.body,
    score: post.score,
    created_at: post.created_at,
    // Do NOT include: user_ip, email, etc.
  }
}
```

### 12.4 Rate Limiting on API Routes

**Prevent Abuse:**
```typescript
// /lib/rate-limiter.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.REDIS_URL,
  token: process.env.REDIS_TOKEN
})

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '10 s')
})

export async function checkRateLimit(identifier: string) {
  const { success, reset } = await ratelimit.limit(identifier)

  if (!success) {
    throw new Error(`Rate limit exceeded. Try again in ${Math.ceil((reset - Date.now()) / 1000)}s`)
  }
}

// In API route
export async function GET(request: NextRequest) {
  const ip = request.ip || 'anonymous'
  await checkRateLimit(ip)

  // ... rest of handler
}
```

**CORS Configuration:**
```typescript
// /middleware.ts
import { NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Allow only your domain
  response.headers.set('Access-Control-Allow-Origin', 'https://yourdomain.com')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type')

  return response
}
```

### 12.5 Input Validation

**API Route Validation:**
```typescript
import { z } from 'zod'

const DashboardParamsSchema = z.object({
  subreddit: z.enum(['all', 'ClaudeAI', 'ClaudeCode', 'Anthropic']),
  timeRange: z.number().int().min(1).max(90)
})

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams

  const params = DashboardParamsSchema.safeParse({
    subreddit: searchParams.get('subreddit') || 'all',
    timeRange: parseInt(searchParams.get('timeRange') || '30')
  })

  if (!params.success) {
    return NextResponse.json(
      { error: 'Invalid parameters', details: params.error.flatten() },
      { status: 400 }
    )
  }

  // ... use params.data
}
```

---

## Summary & Next Steps

### Architecture Deliverables Completed

✅ **System Architecture Overview**
- High-level component diagram
- Data flow visualization
- Layer separation (Presentation → API → Service → Data)

✅ **API Route Specifications**
- 5 core endpoints with schemas
- Caching strategy per route
- Error handling patterns

✅ **Frontend-Backend Integration**
- SWR-based data fetching
- Server/Client Component split
- State management strategy

✅ **Service Layer Design**
- RedditService (fetch, filter, deduplicate)
- SentimentService (OpenAI + 7-day cache)
- AggregationService (daily rollups, keywords)
- CacheService (unified caching)

✅ **Database Schema**
- PostgreSQL schema (4 tables, indexes)
- 90-day rolling window
- Optimized queries

✅ **Dependency Injection**
- Singleton service pattern
- Environment configuration
- Service instantiation

✅ **Caching Coordination**
- 4-layer cache strategy
- Invalidation patterns
- Stale-while-revalidate

✅ **Error Handling**
- Retry patterns for Reddit/OpenAI APIs
- Database error recovery
- User-facing error messages

✅ **Implementation Roadmap**
- 7-phase plan (7 weeks)
- Clear deliverables per phase

✅ **Next.js 15 Patterns**
- App Router best practices
- Server/Client Components
- Performance optimization

✅ **Security & Compliance**
- API key protection
- PII avoidance
- Rate limiting

### Critical Integration Points

**Frontend ↔ API Routes:**
- SWR hooks: `useDashboardData()`, `useDrillDown()`
- API contracts: DashboardDataResponse, DrillDownResponse
- Error boundaries for graceful degradation

**API Routes ↔ Services:**
- Singleton service access via `getAggregationService()`
- Request validation with Zod schemas
- Cache-first, fallback to database

**Services ↔ External APIs:**
- RedditService → RedditAPIClient (OAuth, rate limits)
- SentimentService → OpenAIClient (GPT-4, batch processing)
- CacheService → Redis/In-memory (7-day TTL)

**Services ↔ Database:**
- AggregationService reads daily_aggregates
- RedditService writes raw_posts/comments
- SentimentService writes sentiment_results

### Implementation Priority

**Phase 1 (Critical Path):**
1. Reddit API integration → RedditService
2. Database setup → raw_posts/comments tables
3. Basic polling → /api/ingest/poll

**Phase 2 (Core Value):**
1. OpenAI sentiment → SentimentService
2. 7-day caching → CacheService
3. Batch processing → Queue pattern

**Phase 3 (User-Facing):**
1. Aggregation → AggregationService
2. Dashboard API → /api/dashboard/data
3. Frontend → Charts + SWR

**Phase 4 (Polish):**
1. Drill-down modal
2. CSV export
3. Automated polling

### Key Architectural Decisions

**Why PostgreSQL over MongoDB?**
- Time-series data fits relational model
- Aggregation queries need JOINs
- Date range queries benefit from B-tree indexes

**Why SWR over TanStack Query?**
- Lighter bundle size
- Next.js first-party support
- Sufficient for read-heavy use case

**Why 7-day sentiment cache?**
- Reddit posts rarely change after 7 days
- Balances API cost vs data freshness
- Aligns with 90-day window (most data immutable)

**Why daily aggregates table?**
- Pre-computed rollups avoid expensive queries
- Dashboard loads <100ms vs 5s+ without
- Acts as persistent cache

### Files Generated

**Output Location:**
```
.claude/outputs/design/agents/system-architect/
  claude-code-sentiment-monitor-reddit-20251002-231759/
    integration-architecture.md  ← This file
```

**Next Agent Handoffs:**
1. **Backend Developer:** Use service layer specs to implement
2. **Frontend Developer:** Use API contracts to build UI
3. **DevOps:** Use deployment specs for CI/CD
4. **QA:** Use error handling patterns for test cases

---

**Architecture Complete ✓**

This integration architecture provides a complete blueprint for building the Claude Code Sentiment Monitor. All layers are defined, data flows are mapped, and implementation sequences are prioritized for efficient development.
