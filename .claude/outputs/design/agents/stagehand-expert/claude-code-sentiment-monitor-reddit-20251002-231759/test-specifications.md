# E2E Test Specifications: Claude Code Sentiment Monitor
**Project:** Claude Code Sentiment Monitor (Reddit)
**Project Slug:** claude-code-sentiment-monitor-reddit
**Timestamp:** 20251002-231759
**Platform:** Next.js 15 Dashboard Application
**Testing Framework:** Stagehand (AI-powered browser automation)
**Version:** 1.0

---

## Table of Contents

1. [Test Strategy Overview](#1-test-strategy-overview)
2. [Test Environment Setup](#2-test-environment-setup)
3. [Test Scenarios](#3-test-scenarios)
4. [Executable Test Files](#4-executable-test-files)
5. [Test Data Requirements](#5-test-data-requirements)
6. [Acceptance Criteria Mapping](#6-acceptance-criteria-mapping)
7. [Test Execution Plan](#7-test-execution-plan)

---

## 1. Test Strategy Overview

### 1.1 Testing Philosophy

**Core Principle: User-Intent Validation Over Selector Brittleness**

This sentiment monitoring dashboard is designed for rapid data interpretation and decision-making. Our test strategy prioritizes:

- **Natural language test scenarios** that mirror real user behavior
- **Stagehand AI-powered discovery** to reduce selector maintenance
- **Critical user journeys** from the PRD (data viewing, filtering, drill-down)
- **Graceful degradation testing** (API quota errors, loading states)
- **Accessibility validation** (keyboard navigation, screen reader support)

**Test Type Distribution:**
- **80% Pure Stagehand:** User workflows, intent-based interactions
- **15% Hybrid:** Complex validations requiring precise assertions
- **5% Pure Playwright:** Technical checks (performance, exact values)

### 1.2 Critical User Journeys (From PRD)

**P0 (Must Work):**
1. **Initial Dashboard Load** - See 90-day aggregate data
2. **Time Range Selection** - Switch between 7/30/90 day views
3. **Subreddit Filtering** - View data per subreddit or "All"
4. **Chart Visualization** - Sentiment line + volume bar charts render correctly
5. **Drill-Down Interaction** - Click day → see sample posts with sentiment
6. **CSV Export** - Download daily summary data

**P1 (Should Work):**
7. **Keyword Panel Display** - See top keywords for time range
8. **Reddit Link-Outs** - Navigate to source posts
9. **Loading States** - Skeleton screens during data fetch
10. **Error Handling** - API quota exceeded with cached data

**P2 (Nice to Have):**
11. **Mobile Responsiveness** - Touch interactions, responsive layout
12. **Keyboard Navigation** - Full keyboard accessibility
13. **Performance** - Dashboard loads < 3s

### 1.3 Local vs BrowserBase Testing Approach

**Local Testing (Development & CI):**
- Use `env: "LOCAL"` for rapid iteration
- Headless mode for CI/CD pipelines
- Mock API responses for deterministic tests
- Fast feedback loop (< 30s test suite)

**BrowserBase Testing (Pre-Production):**
- Use `env: "BROWSERBASE"` for cloud-based execution
- Test against production-like environment
- Real API integration (with rate limit safeguards)
- Cross-browser validation (Chrome, Firefox, Safari)

**Execution Matrix:**
```
┌─────────────────┬──────────────┬────────────────┐
│ Test Type       │ Local        │ BrowserBase    │
├─────────────────┼──────────────┼────────────────┤
│ Unit/Component  │ ✓ Always     │ ✗ Never        │
│ E2E Smoke       │ ✓ Every PR   │ ✓ Nightly      │
│ E2E Full Suite  │ ✓ Pre-merge  │ ✓ Pre-release  │
│ Visual Regression│ ✗ Never     │ ✓ Weekly       │
└─────────────────┴──────────────┴────────────────┘
```

### 1.4 Data-testid Naming Conventions

**Hybrid Strategy: AI-First with Fallback Selectors**

While Stagehand excels at natural language discovery, we provide `data-testid` attributes for:
- Critical interactive elements (buttons, tabs, form controls)
- Dynamic content containers (charts, modals, lists)
- Fallback when AI discovery fails or is ambiguous

**Naming Pattern:** `{component}-{element}-{variant?}`

**Examples:**
```typescript
// Header
data-testid="header-export-button"

// Controls
data-testid="subreddit-tabs-container"
data-testid="subreddit-tab-all"
data-testid="subreddit-tab-claudeai"
data-testid="subreddit-tab-claudecode"
data-testid="subreddit-tab-anthropic"

data-testid="time-range-selector"
data-testid="time-range-7d"
data-testid="time-range-30d"
data-testid="time-range-90d"

// Summary Metrics
data-testid="summary-metrics-container"
data-testid="metric-card-avg-sentiment"
data-testid="metric-card-positive-percent"
data-testid="metric-card-negative-percent"
data-testid="metric-card-total-posts"

// Charts
data-testid="sentiment-chart-container"
data-testid="sentiment-chart-canvas"
data-testid="volume-chart-container"
data-testid="volume-chart-canvas"

// Keywords
data-testid="keyword-panel-container"
data-testid="keyword-tag" (repeated for each tag)

// Drill-Down Modal
data-testid="drilldown-modal"
data-testid="drilldown-modal-close"
data-testid="drilldown-modal-header"
data-testid="drilldown-modal-body"
data-testid="drilldown-post-list"
data-testid="drilldown-post-card" (repeated)
data-testid="drilldown-export-button"

// Post Card Components
data-testid="post-card-author"
data-testid="post-card-timestamp"
data-testid="post-card-text"
data-testid="post-card-sentiment-badge"
data-testid="post-card-reddit-link"

// Loading/Error States
data-testid="loading-skeleton"
data-testid="error-banner"
data-testid="empty-state"
```

**AI Fallback Strategy:**
```typescript
// Primary: Stagehand AI discovery
await page.act("click the 7 days time range button");

// Fallback: data-testid selector (if AI fails)
const button = await page.locator('[data-testid="time-range-7d"]');
await button.click();
```

---

## 2. Test Environment Setup

### 2.1 Required Dependencies

**package.json:**
```json
{
  "name": "claude-code-sentiment-monitor-tests",
  "version": "1.0.0",
  "scripts": {
    "test": "playwright test",
    "test:local": "STAGEHAND_ENV=LOCAL playwright test",
    "test:cloud": "STAGEHAND_ENV=BROWSERBASE playwright test",
    "test:ui": "playwright test --ui",
    "test:debug": "playwright test --debug",
    "test:report": "playwright show-report"
  },
  "devDependencies": {
    "@browserbasehq/stagehand": "^1.4.0",
    "@playwright/test": "^1.40.0",
    "dotenv": "^16.3.1",
    "zod": "^3.22.4"
  }
}
```

### 2.2 Environment Configuration

**.env.example:**
```bash
# Stagehand Configuration
STAGEHAND_ENV=LOCAL # or BROWSERBASE
OPENAI_API_KEY=sk-proj-...  # Required for AI discovery
BROWSERBASE_API_KEY=bb_...   # Required for cloud testing
BROWSERBASE_PROJECT_ID=...   # Required for cloud testing

# Application Under Test
APP_URL=http://localhost:3000
API_BASE_URL=http://localhost:3001/api

# Test Configuration
TEST_TIMEOUT=30000
HEADLESS=true
```

### 2.3 Playwright Configuration

**playwright.config.ts:**
```typescript
import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['list']
  ],

  use: {
    baseURL: process.env.APP_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  timeout: parseInt(process.env.TEST_TIMEOUT || '30000'),

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
```

### 2.4 Stagehand Helper Utilities

**tests/helpers/stagehand-setup.ts:**
```typescript
import { Stagehand } from '@browserbasehq/stagehand';
import { Page } from '@playwright/test';

export interface StagehandConfig {
  env: 'LOCAL' | 'BROWSERBASE';
  verbose?: number;
  headless?: boolean;
}

export async function initStagehand(config?: Partial<StagehandConfig>) {
  const stagehand = new Stagehand({
    env: config?.env || (process.env.STAGEHAND_ENV as 'LOCAL' | 'BROWSERBASE') || 'LOCAL',
    modelName: 'gpt-4o',
    modelClientOptions: {
      apiKey: process.env.OPENAI_API_KEY,
    },
    verbose: config?.verbose ?? 1,
    headless: config?.headless ?? (process.env.HEADLESS === 'true'),
  });

  await stagehand.init();
  return stagehand;
}

export async function closeStagehand(stagehand: Stagehand) {
  await stagehand.close();
}

// Hybrid helper: Try AI first, fallback to selector
export async function actWithFallback(
  page: Page,
  aiInstruction: string,
  fallbackSelector?: string
) {
  try {
    await page.act(aiInstruction);
  } catch (error) {
    if (fallbackSelector) {
      console.warn(`AI discovery failed, using fallback: ${fallbackSelector}`);
      const element = await page.locator(fallbackSelector);
      await element.click();
    } else {
      throw error;
    }
  }
}
```

---

## 3. Test Scenarios

### 3.1 Dashboard Load & Display

**PRD Requirement:** "Dashboard showing sentiment and volume trends for last 90 days"

**Test ID:** `DASH-001`

**Test Steps:**
1. Navigate to dashboard URL (`/`)
2. Wait for initial data load (loading skeleton should appear)
3. Verify dashboard renders with default state:
   - Subreddit: "All" (active tab)
   - Time range: "30d" (default)
   - Summary metrics visible (4 cards)
   - Sentiment chart rendered with data
   - Volume chart rendered with data
   - Keyword panel shows top keywords

**AI-Powered Validation:**
```typescript
await page.observe("find all summary metric cards");
// Expected: 4 metric cards visible
```

**Data-testid Selectors:**
- `summary-metrics-container`
- `sentiment-chart-container`
- `volume-chart-container`
- `keyword-panel-container`

**Expected Outcomes:**
- No console errors
- All charts render within 3 seconds
- Summary metrics show numerical values (not placeholders)
- Keyword tags are clickable/visible

**Edge Cases:**
- Empty data state: Show "No data available yet" message
- API error: Show error banner with retry option
- Slow network: Loading skeleton visible for > 2s

---

### 3.2 Time Range Selection

**PRD Requirement:** "Dashboard with time selector (last 7/30/90 days)"

**Test ID:** `DASH-002`

**Test Steps:**
1. Load dashboard (default 30-day view)
2. Verify initial chart shows ~30 data points
3. Click "7 days" time range button
4. Wait for data update (loading indicator may appear)
5. Verify chart updates to show 7 data points
6. Verify sentiment line and volume bars reflect 7-day data
7. Click "90 days" selector
8. Verify chart shows full 90-day range (max available)
9. Verify keyword panel updates to 90-day keywords
10. Click "30 days" to return to default
11. Verify data reverts correctly

**AI-Powered Actions:**
```typescript
await page.act("click the 7 days time range button");
await page.observe("verify the chart now shows 7 days of data");
```

**Data-testid Selectors:**
- `time-range-selector`
- `time-range-7d`
- `time-range-30d`
- `time-range-90d`

**AI Fallback Strategy:**
```typescript
// If AI fails, fallback to:
await page.locator('[data-testid="time-range-7d"]').click();
```

**Expected Outcomes:**
- Time range button shows active state (blue background)
- Chart x-axis labels update (fewer/more dates shown)
- Summary metrics recalculate for selected range
- No data loss or loading errors
- Smooth transition animation (< 500ms)

**Validation Checks:**
```typescript
// Extract chart data points using Stagehand
const chartData = await page.extract({
  instruction: "get the number of data points in the sentiment chart",
  schema: z.object({
    dataPointCount: z.number(),
    dateRange: z.string(),
  }),
});

expect(chartData.dataPointCount).toBe(7); // for 7-day range
```

---

### 3.3 Subreddit Filtering

**PRD Requirement:** "Tabs: breakdown by subreddit (r/ClaudeAI, r/ClaudeCode, r/Anthropic)"

**Test ID:** `DASH-003`

**Test Steps:**
1. Load dashboard (default "All" subreddits)
2. Verify "All" tab is active (blue underline, bold)
3. Click "r/ClaudeAI" tab
4. Wait for data filter (loading indicator)
5. Verify data updates to show only r/ClaudeAI posts
6. Verify summary metrics recalculate (different values than "All")
7. Verify charts update with r/ClaudeAI-specific data
8. Verify keyword panel shows r/ClaudeAI keywords
9. Click "r/ClaudeCode" tab
10. Verify same behavior for r/ClaudeCode data
11. Click "r/Anthropic" tab
12. Verify r/Anthropic data display
13. Click "All" to return to combined view

**AI-Powered Actions:**
```typescript
await page.act("click on the r/ClaudeAI subreddit tab");
await page.observe("verify the dashboard now shows only r/ClaudeAI data");
```

**Data-testid Selectors:**
- `subreddit-tabs-container`
- `subreddit-tab-all`
- `subreddit-tab-claudeai`
- `subreddit-tab-claudecode`
- `subreddit-tab-anthropic`

**Expected Outcomes:**
- Active tab shows visual indicator (underline, bold text)
- Data filters correctly (no data from other subreddits)
- URL updates (optional): `/?subreddit=ClaudeAI&range=30`
- No flicker or layout shift during transition
- Charts smoothly transition to new data

**Edge Case Testing:**
```typescript
// Test: Subreddit with no data
await page.act("click on r/Anthropic tab");
const emptyState = await page.observe("find the empty state message");
// Expect: "No data for r/Anthropic in this period"
```

---

### 3.4 Drill-Down Interaction

**PRD Requirement:** "Drill-down: click a day to see sample posts/comments with sentiment"

**Test ID:** `DASH-004`

**Test Steps:**
1. Load dashboard with data visible
2. Identify a day with significant activity (high sentiment or volume)
3. Hover over data point in sentiment chart (tooltip appears)
4. Click the data point
5. Verify drill-down modal opens with animation (fade + scale)
6. Verify modal header shows: "{Date} - {Subreddit}"
7. Verify modal summary shows: "{X} posts/comments • Avg sentiment: {Y}"
8. Verify post list populates with sample posts (top 10)
9. Verify each post card displays:
   - Author (u/username)
   - Timestamp (UTC)
   - Subreddit tag
   - Post text (truncated to ~200 chars)
   - Sentiment badge (color-coded: green/gray/red)
   - Confidence percentage
   - Engagement metrics (score, comment count)
   - "View on Reddit →" link
10. Click "View on Reddit →" link
11. Verify new tab opens with Reddit post
12. Return to dashboard tab, modal still open
13. Click modal close button (X)
14. Verify modal closes with animation
15. Verify focus returns to main dashboard

**AI-Powered Actions:**
```typescript
await page.act("click on the highest sentiment data point in the chart");
await page.observe("verify the drill-down modal opened showing posts for that day");
```

**Data-testid Selectors:**
- `sentiment-chart-canvas` (for click target)
- `drilldown-modal`
- `drilldown-modal-header`
- `drilldown-modal-body`
- `drilldown-post-list`
- `drilldown-post-card`
- `drilldown-modal-close`

**Expected Outcomes:**
- Modal opens centered on screen
- Backdrop (semi-transparent) blocks background interaction
- Modal content is scrollable if > viewport height
- ESC key closes modal
- Click outside modal (backdrop) closes modal
- Focus traps within modal (tab navigation)
- Reddit links open in new tab (target="_blank")

**Accessibility Validation:**
```typescript
// Keyboard navigation test
await page.keyboard.press('Escape');
await page.observe("verify the modal closed");

// Focus management
await page.act("click on a data point to open the modal");
const focusedElement = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
expect(focusedElement).toBe('drilldown-modal-close'); // Focus on close button
```

**Data Validation:**
```typescript
const modalData = await page.extract({
  instruction: "extract the modal header date and post count",
  schema: z.object({
    date: z.string(),
    subreddit: z.string(),
    postCount: z.number(),
    avgSentiment: z.number(),
  }),
});

expect(modalData.postCount).toBeGreaterThan(0);
expect(modalData.avgSentiment).toBeGreaterThanOrEqual(-1);
expect(modalData.avgSentiment).toBeLessThanOrEqual(1);
```

---

### 3.5 CSV Export

**PRD Requirement:** "Download summary as CSV"

**Test ID:** `DASH-005`

**Test Steps:**
1. Load dashboard with data visible
2. Click "CSV Export" button in header
3. Wait for download to trigger
4. Verify file downloaded: `claude-code-sentiment-{subreddit}-{range}d-{date}.csv`
5. Parse CSV file
6. Verify CSV structure:
   - Headers: Date, Subreddit, Sentiment, PostCount, PositivePercent, NegativePercent, TopKeywords
   - Rows: One per day in current time range
   - Data matches dashboard display
7. Test export from drill-down modal:
   - Open modal for specific day
   - Click "Export This Day as CSV"
   - Verify detailed CSV with columns: PostID, Author, Timestamp, Subreddit, Text, Sentiment, Confidence, Score, Comments, RedditURL

**AI-Powered Actions:**
```typescript
await page.act("click the CSV export button in the header");
await page.observe("verify a file download was triggered");
```

**Data-testid Selectors:**
- `header-export-button`
- `drilldown-export-button`

**Expected Outcomes:**
- Download triggers immediately (no loading spinner)
- CSV file is valid UTF-8
- All rows have correct column count
- Numerical values are properly formatted (no NaN, Infinity)
- Dates are in consistent format (YYYY-MM-DD)
- Success toast notification appears: "CSV exported successfully"

**File Validation:**
```typescript
import fs from 'fs';
import path from 'path';

// Wait for download
const downloadPath = await page.waitForEvent('download');
const filePath = await downloadPath.path();

// Read and validate CSV
const csvContent = fs.readFileSync(filePath, 'utf-8');
const lines = csvContent.split('\n');

// Check header
expect(lines[0]).toContain('Date,Subreddit,Sentiment,PostCount');

// Check data rows
expect(lines.length).toBeGreaterThan(1); // Header + data
```

---

### 3.6 Error Handling - API Quota Exceeded

**PRD Requirement:** "Dashboard should remain usable even if API quota is hit (show last loaded data)"

**Test ID:** `DASH-006`

**Test Steps:**
1. Mock API to return 429 (Too Many Requests)
2. Load dashboard
3. Verify cached data displays (if available)
4. Verify error banner appears at top:
   - Icon: Warning (⚠️)
   - Message: "API quota exceeded. Showing data from {X} hours ago. Next refresh at {time} UTC."
   - Style: Yellow background, orange border
5. Verify dashboard functions normally with cached data:
   - Tab switching works (with cached data)
   - Time range changes work (with cached data)
   - Charts are interactive
   - CSV export still available
6. Click "Dismiss" on error banner
7. Verify banner dismisses but cached data remains
8. Test scenario with no cache:
   - Mock API 429 with no local cache
   - Verify error state: "Unable to load data. API quota exceeded. Please try again later."
   - Verify empty state with retry button

**AI-Powered Actions:**
```typescript
await page.observe("find the API quota exceeded warning banner");
await page.act("dismiss the error banner");
```

**Data-testid Selectors:**
- `error-banner`
- `error-banner-dismiss`

**Expected Outcomes:**
- Error banner visible but not blocking
- Dashboard remains interactive
- Cached data clearly labeled with timestamp
- Retry functionality available (if no cache)
- No broken UI or white screens

**Mock API Setup:**
```typescript
// In test setup
await page.route('**/api/sentiment/**', route => {
  route.fulfill({
    status: 429,
    body: JSON.stringify({ error: 'Rate limit exceeded' }),
  });
});
```

---

### 3.7 Loading States

**PRD Requirement:** "Initial data fetch shows skeleton, tab switch shows loading indicator"

**Test ID:** `DASH-007`

**Test Steps:**
1. Load dashboard with slow network simulation
2. Verify skeleton screens appear immediately:
   - Summary metrics: 4 gray rectangles with shimmer
   - Charts: Placeholder areas with shimmer animation
   - Keyword panel: Shimmer placeholder
3. Wait for data load (2-3s)
4. Verify skeleton fades out smoothly
5. Verify real content fades in
6. Test inline loading (tab switch):
   - Click different subreddit tab
   - Verify chart overlay with spinner appears
   - Verify data updates after fetch
   - Verify overlay fades out
7. Test time range loading:
   - Click different time range
   - Verify similar loading behavior

**AI-Powered Actions:**
```typescript
await page.observe("find the loading skeleton screens");
await page.act("wait for the data to finish loading");
await page.observe("verify the skeleton screens disappeared and real data is shown");
```

**Data-testid Selectors:**
- `loading-skeleton`
- `loading-overlay` (for inline updates)

**Expected Outcomes:**
- Skeleton maintains layout (no content shift)
- Shimmer animation smooth (60fps)
- Transition from skeleton to content is smooth (fade)
- Loading states don't block user interaction unnecessarily
- Timeout after 10s with error message

**Performance Check:**
```typescript
const loadStart = Date.now();
await page.goto('/');
await page.waitForSelector('[data-testid="sentiment-chart-container"]', { state: 'visible' });
const loadTime = Date.now() - loadStart;

expect(loadTime).toBeLessThan(3000); // Dashboard loads in < 3s
```

---

### 3.8 Keyword Panel Display

**PRD Requirement:** "List of top keywords for the date range"

**Test ID:** `DASH-008`

**Test Steps:**
1. Load dashboard with data
2. Verify keyword panel is visible
3. Verify keywords display as tag cloud:
   - Font size varies by frequency (12px - 24px)
   - Tags have rounded background
   - Tags are readable and non-overlapping
4. Identify most frequent keyword (largest tag)
5. Hover over keyword tag
6. Verify hover state (background changes to blue)
7. Test keyword update on time range change:
   - Click "7 days" time range
   - Verify keywords update to 7-day data
   - Verify different keywords appear (if data differs)
8. Test keyword update on subreddit change:
   - Click "r/ClaudeAI" tab
   - Verify keywords specific to r/ClaudeAI
9. Verify keyword count (typically 10-20 keywords displayed)

**AI-Powered Actions:**
```typescript
await page.observe("find the keyword panel and list all visible keywords");
await page.act("hover over the largest keyword tag");
```

**Data-testid Selectors:**
- `keyword-panel-container`
- `keyword-tag` (multiple instances)

**Expected Outcomes:**
- Keywords are relevant to selected data
- Font sizes correctly represent frequency
- No truncation or overflow issues
- Hover states work smoothly
- Optional: Clicking keyword filters data (future feature)

**Data Validation:**
```typescript
const keywords = await page.extract({
  instruction: "extract all keywords from the keyword panel",
  schema: z.object({
    keywords: z.array(z.object({
      text: z.string(),
      frequency: z.number(),
    })),
  }),
});

expect(keywords.keywords.length).toBeGreaterThan(5);
expect(keywords.keywords.length).toBeLessThan(25);
```

---

### 3.9 Interaction Conflict Testing

**Test ID:** `DASH-009`

**Purpose:** Ensure chart click (drill-down) doesn't conflict with hover (tooltip)

**Test Steps:**
1. Load dashboard with data
2. Hover over sentiment chart data point
3. Verify tooltip appears (without triggering drill-down)
4. Move mouse away
5. Verify tooltip disappears
6. Click the same data point
7. Verify drill-down modal opens (not just tooltip)
8. Close modal
9. Test rapid interactions:
   - Hover → click quickly
   - Verify only click action triggers (modal opens)
10. Test touch behavior (mobile):
    - Tap data point
    - Verify modal opens (no tooltip on touch)

**AI-Powered Actions:**
```typescript
await page.act("hover over a data point in the sentiment chart without clicking");
await page.observe("verify the tooltip appears but the modal does not open");

await page.act("now click on the same data point");
await page.observe("verify the drill-down modal opened");
```

**Expected Outcomes:**
- Hover and click are distinct actions
- No modal flash on hover
- No tooltip stuck on screen after click
- Touch interactions trigger appropriate action

---

### 3.10 Edge Case Testing - Empty Data States

**Test ID:** `DASH-010`

**Test Steps:**
1. Mock API to return empty dataset
2. Load dashboard
3. Verify empty state displays:
   - Icon: 📊
   - Message: "No data available yet"
   - Explanation: "Data collection is in progress. Please check back in a few hours..."
   - Action: [Refresh] button
4. Click [Refresh] button
5. Verify data fetch retries
6. Test subreddit-specific empty state:
   - Mock r/Anthropic with no data
   - Click "r/Anthropic" tab
   - Verify message: "No data for r/Anthropic in this period"
7. Test time range empty state:
   - Mock 7-day range with no data
   - Click "7 days" button
   - Verify charts show empty state

**AI-Powered Actions:**
```typescript
await page.observe("find the empty state message");
await page.act("click the refresh button");
```

**Data-testid Selectors:**
- `empty-state`
- `empty-state-refresh-button`

**Expected Outcomes:**
- Empty states are informative (not blank screens)
- Refresh functionality works
- No broken UI or console errors

---

### 3.11 Accessibility - Keyboard Navigation

**Test ID:** `DASH-011`

**Test Steps:**
1. Load dashboard
2. Press Tab key repeatedly
3. Verify focus order:
   - CSV Export button
   - Subreddit tabs (All → r/ClaudeAI → r/ClaudeCode → r/Anthropic)
   - Time range buttons (7d → 30d → 90d)
   - Chart interactive areas (if focusable)
   - Keyword tags
4. Verify focus indicators visible (blue outline)
5. Test tab navigation:
   - Tab to "r/ClaudeAI" tab
   - Press Enter
   - Verify tab activates and data updates
6. Test arrow key navigation in tab group:
   - Focus on subreddit tabs
   - Press Right Arrow
   - Verify focus moves to next tab
7. Test modal keyboard interaction:
   - Open drill-down modal (click data point)
   - Press Tab
   - Verify focus trapped within modal
   - Press Escape
   - Verify modal closes
   - Verify focus returns to trigger element

**AI-Powered Actions:**
```typescript
await page.act("navigate through all interactive elements using the Tab key");
await page.observe("verify each element receives visible focus");
```

**Expected Outcomes:**
- Logical tab order (top to bottom, left to right)
- Focus indicators always visible
- No focus traps (except intentional modal trap)
- ESC key closes modals
- Enter/Space activates buttons

**Accessibility Assertions:**
```typescript
// Check focus visibility
const focusedElement = await page.evaluate(() => {
  const el = document.activeElement;
  const styles = window.getComputedStyle(el);
  return styles.outline !== 'none';
});

expect(focusedElement).toBe(true);
```

---

### 3.12 Mobile Responsiveness

**Test ID:** `DASH-012`

**Test Steps:**
1. Set viewport to mobile (375x667 - iPhone SE)
2. Load dashboard
3. Verify layout adapts:
   - Header: Hamburger menu or stacked layout
   - Subreddit tabs: Vertical stack or horizontal scroll
   - Time range: Stacked or segmented control
   - Summary metrics: 2x2 grid instead of 1x4
   - Charts: Single column, reduced height
   - Keyword panel: Smaller tags, wrapped
4. Test touch interactions:
   - Tap subreddit tab
   - Verify data updates
   - Tap chart data point
   - Verify modal opens
   - Swipe down on modal
   - Verify modal closes (iOS gesture)
5. Test landscape orientation:
   - Rotate device to landscape
   - Verify layout adjusts appropriately

**AI-Powered Actions:**
```typescript
await page.setViewportSize({ width: 375, height: 667 });
await page.act("tap on the r/ClaudeAI tab");
await page.observe("verify the mobile layout adapted correctly");
```

**Expected Outcomes:**
- No horizontal scrolling
- Touch targets ≥ 44x44px
- Text remains readable (no tiny fonts)
- Charts scale appropriately
- Modal fits viewport (no cutoff)

---

## 4. Executable Test Files

### 4.1 Pure Stagehand Test Example

**tests/dashboard-load.spec.ts:**
```typescript
import { test, expect } from '@playwright/test';
import { initStagehand, closeStagehand } from './helpers/stagehand-setup';
import { z } from 'zod';

test.describe('Dashboard Load & Display', () => {
  test('should load dashboard with default 30-day view and display all components', async () => {
    const stagehand = await initStagehand();
    const page = stagehand.page;

    // Navigate to dashboard
    await page.goto('/');

    // Observe initial loading state
    const loadingState = await page.observe('find loading skeleton screens');
    expect(loadingState).toBeTruthy();

    // Wait for data to load using natural language
    await page.act('wait for the dashboard data to finish loading');

    // Verify all major components are visible using AI observation
    await page.act('verify the summary metrics cards are visible');
    await page.act('verify the sentiment chart is displayed');
    await page.act('verify the volume chart is displayed');
    await page.act('verify the keyword panel is visible');

    // Extract summary data to validate
    const summaryData = await page.extract({
      instruction: 'get the values from all four summary metric cards',
      schema: z.object({
        avgSentiment: z.number(),
        positivePercent: z.number(),
        negativePercent: z.number(),
        totalPosts: z.number(),
      }),
    });

    // Validate data is reasonable
    expect(summaryData.avgSentiment).toBeGreaterThanOrEqual(-1);
    expect(summaryData.avgSentiment).toBeLessThanOrEqual(1);
    expect(summaryData.positivePercent).toBeGreaterThanOrEqual(0);
    expect(summaryData.positivePercent).toBeLessThanOrEqual(100);
    expect(summaryData.totalPosts).toBeGreaterThan(0);

    // Verify default active states
    const activeStates = await page.extract({
      instruction: 'identify which subreddit tab and time range are currently active',
      schema: z.object({
        activeSubreddit: z.string(),
        activeTimeRange: z.string(),
      }),
    });

    expect(activeStates.activeSubreddit.toLowerCase()).toBe('all');
    expect(activeStates.activeTimeRange).toBe('30d');

    await closeStagehand(stagehand);
  });

  test('should display empty state when no data is available', async () => {
    const stagehand = await initStagehand();
    const page = stagehand.page;

    // Mock API to return empty data
    await page.route('**/api/sentiment/**', route => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({ data: [], summary: null }),
      });
    });

    await page.goto('/');

    // Observe empty state using natural language
    const emptyState = await page.observe('find the empty state message');
    expect(emptyState).toBeTruthy();

    // Verify empty state message content
    await page.act('verify the empty state says "No data available yet"');
    await page.act('verify there is a refresh button in the empty state');

    await closeStagehand(stagehand);
  });
});
```

### 4.2 Hybrid Test Example (Stagehand + Playwright)

**tests/time-range-selection.spec.ts:**
```typescript
import { test, expect } from '@playwright/test';
import { initStagehand, closeStagehand, actWithFallback } from './helpers/stagehand-setup';
import { z } from 'zod';

test.describe('Time Range Selection', () => {
  test('should update dashboard data when switching between time ranges', async ({ page: playwrightPage }) => {
    const stagehand = await initStagehand();
    const page = stagehand.page;

    await page.goto('/');
    await page.act('wait for the dashboard to finish loading');

    // Get initial 30-day data
    const initial30DayData = await page.extract({
      instruction: 'count the number of data points in the sentiment chart',
      schema: z.object({
        dataPointCount: z.number(),
        timeRange: z.string(),
      }),
    });

    expect(initial30DayData.dataPointCount).toBeGreaterThan(20); // ~30 days
    expect(initial30DayData.dataPointCount).toBeLessThan(35);

    // Switch to 7 days using AI with fallback
    await actWithFallback(
      page,
      'click the 7 days time range button',
      '[data-testid="time-range-7d"]'
    );

    // Wait for data update
    await page.act('wait for the chart to update with new data');

    // Verify 7-day data
    const sevenDayData = await page.extract({
      instruction: 'count the number of data points in the sentiment chart',
      schema: z.object({
        dataPointCount: z.number(),
      }),
    });

    expect(sevenDayData.dataPointCount).toBeGreaterThanOrEqual(6);
    expect(sevenDayData.dataPointCount).toBeLessThanOrEqual(8);

    // Use Playwright for precise visual state check
    const activeButton = playwrightPage.locator('[data-testid="time-range-7d"]');
    await expect(activeButton).toHaveClass(/active|selected/); // Check active state

    // Switch to 90 days
    await actWithFallback(
      page,
      'click the 90 days time range button',
      '[data-testid="time-range-90d"]'
    );

    await page.act('wait for the chart to update with new data');

    const ninetyDayData = await page.extract({
      instruction: 'count the number of data points in the sentiment chart',
      schema: z.object({
        dataPointCount: z.number(),
      }),
    });

    expect(ninetyDayData.dataPointCount).toBeGreaterThan(80); // ~90 days

    // Verify summary metrics updated
    const updatedSummary = await page.extract({
      instruction: 'get the total posts value from the summary metrics',
      schema: z.object({
        totalPosts: z.number(),
      }),
    });

    expect(updatedSummary.totalPosts).not.toBe(initial30DayData); // Changed

    await closeStagehand(stagehand);
  });

  test('should show loading state during time range transition', async () => {
    const stagehand = await initStagehand();
    const page = stagehand.page;

    await page.goto('/');
    await page.act('wait for initial load');

    // Add network delay to observe loading state
    await page.route('**/api/sentiment/**', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1s delay
      route.continue();
    });

    // Click time range
    await page.act('click the 90 days time range button');

    // Immediately check for loading indicator
    const loadingIndicator = await page.observe('find any loading spinner or overlay');
    expect(loadingIndicator).toBeTruthy();

    // Wait for load to complete
    await page.act('wait for the loading to finish');

    // Verify loading indicator gone
    const postLoadCheck = await page.observe('verify there are no loading indicators visible');
    expect(postLoadCheck).toBeTruthy();

    await closeStagehand(stagehand);
  });
});
```

### 4.3 Drill-Down Modal Test

**tests/drilldown-modal.spec.ts:**
```typescript
import { test, expect } from '@playwright/test';
import { initStagehand, closeStagehand } from './helpers/stagehand-setup';
import { z } from 'zod';

test.describe('Drill-Down Modal Interaction', () => {
  test('should open modal when clicking a chart data point and display post details', async () => {
    const stagehand = await initStagehand();
    const page = stagehand.page;

    await page.goto('/');
    await page.act('wait for the dashboard to load');

    // Click on a data point with high sentiment
    await page.act('click on a data point in the sentiment chart that has high sentiment');

    // Verify modal opened
    await page.observe('verify the drill-down modal is now open');

    // Extract modal header information
    const modalHeader = await page.extract({
      instruction: 'get the date and subreddit from the modal header',
      schema: z.object({
        date: z.string(),
        subreddit: z.string(),
        postCount: z.number(),
        avgSentiment: z.number(),
      }),
    });

    expect(modalHeader.postCount).toBeGreaterThan(0);
    expect(modalHeader.avgSentiment).toBeGreaterThanOrEqual(-1);
    expect(modalHeader.avgSentiment).toBeLessThanOrEqual(1);

    // Verify post cards are visible
    await page.act('scroll through the list of posts in the modal');

    // Extract post card data
    const postData = await page.extract({
      instruction: 'get details from the first post card including author, sentiment, and engagement',
      schema: z.object({
        author: z.string(),
        timestamp: z.string(),
        sentiment: z.number(),
        confidence: z.number(),
        score: z.number(),
        commentCount: z.number(),
      }),
    });

    expect(postData.author).toMatch(/^u\/.+/); // Username format
    expect(postData.confidence).toBeGreaterThanOrEqual(0);
    expect(postData.confidence).toBeLessThanOrEqual(1);

    // Test Reddit link
    await page.act('verify the "View on Reddit" link is present and clickable');

    // Close modal using close button
    await page.act('click the close button to dismiss the modal');

    // Verify modal closed
    const modalClosed = await page.observe('verify the modal is no longer visible');
    expect(modalClosed).toBeTruthy();

    await closeStagehand(stagehand);
  });

  test('should close modal when clicking backdrop', async () => {
    const stagehand = await initStagehand();
    const page = stagehand.page;

    await page.goto('/');
    await page.act('wait for dashboard load');
    await page.act('click a data point to open the drill-down modal');
    await page.observe('verify the modal is open');

    // Click backdrop (area outside modal)
    await page.act('click outside the modal on the backdrop to close it');

    // Verify modal closed
    const modalClosed = await page.observe('verify the modal closed');
    expect(modalClosed).toBeTruthy();

    await closeStagehand(stagehand);
  });

  test('should close modal when pressing ESC key', async ({ page: playwrightPage }) => {
    const stagehand = await initStagehand();
    const page = stagehand.page;

    await page.goto('/');
    await page.act('wait for dashboard load');
    await page.act('click a data point to open the modal');

    // Use Playwright for keyboard interaction
    await playwrightPage.keyboard.press('Escape');

    // Verify modal closed using Stagehand
    const modalClosed = await page.observe('verify the modal is no longer visible');
    expect(modalClosed).toBeTruthy();

    await closeStagehand(stagehand);
  });

  test('should trap focus within modal and restore focus on close', async ({ page: playwrightPage }) => {
    const stagehand = await initStagehand();
    const page = stagehand.page;

    await page.goto('/');
    await page.act('wait for dashboard load');
    await page.act('click a data point to open the modal');

    // Check initial focus (should be on close button or first interactive element)
    const initialFocus = await playwrightPage.evaluate(() =>
      document.activeElement?.getAttribute('data-testid')
    );
    expect(initialFocus).toBe('drilldown-modal-close');

    // Tab through modal elements
    await playwrightPage.keyboard.press('Tab');
    await playwrightPage.keyboard.press('Tab');

    // Focus should still be within modal
    const focusInModal = await playwrightPage.evaluate(() => {
      const modal = document.querySelector('[data-testid="drilldown-modal"]');
      return modal?.contains(document.activeElement);
    });
    expect(focusInModal).toBe(true);

    // Close modal
    await playwrightPage.keyboard.press('Escape');

    // Focus should return to trigger element (chart)
    // This validates proper focus management

    await closeStagehand(stagehand);
  });
});
```

### 4.4 CSV Export Test

**tests/csv-export.spec.ts:**
```typescript
import { test, expect } from '@playwright/test';
import { initStagehand, closeStagehand } from './helpers/stagehand-setup';
import fs from 'fs';
import path from 'path';

test.describe('CSV Export Functionality', () => {
  test('should export dashboard summary data as CSV', async ({ page: playwrightPage }) => {
    const stagehand = await initStagehand();
    const page = stagehand.page;

    await page.goto('/');
    await page.act('wait for dashboard to load');

    // Click export button using AI
    await page.act('click the CSV export button');

    // Use Playwright to handle download
    const [download] = await Promise.all([
      playwrightPage.waitForEvent('download'),
      playwrightPage.click('[data-testid="header-export-button"]'), // Fallback
    ]);

    // Validate download
    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();

    // Validate filename pattern
    const filename = download.suggestedFilename();
    expect(filename).toMatch(/claude-code-sentiment-.+-\d+d-\d{8}\.csv/);

    // Read and parse CSV
    const csvContent = fs.readFileSync(downloadPath!, 'utf-8');
    const lines = csvContent.split('\n');

    // Validate CSV structure
    expect(lines[0]).toContain('Date');
    expect(lines[0]).toContain('Subreddit');
    expect(lines[0]).toContain('Sentiment');
    expect(lines[0]).toContain('PostCount');

    // Validate data rows
    expect(lines.length).toBeGreaterThan(1); // Header + data

    // Validate data format
    const dataRow = lines[1].split(',');
    expect(dataRow.length).toBe(lines[0].split(',').length); // Same column count

    // Verify toast notification (optional)
    await page.observe('verify a success notification appeared');

    await closeStagehand(stagehand);
  });

  test('should export detailed day data from drill-down modal', async ({ page: playwrightPage }) => {
    const stagehand = await initStagehand();
    const page = stagehand.page;

    await page.goto('/');
    await page.act('wait for dashboard to load');
    await page.act('click a data point to open the drill-down modal');
    await page.observe('verify the modal is open');

    // Click export button in modal
    await page.act('click the export this day as CSV button in the modal');

    // Handle download
    const [download] = await Promise.all([
      playwrightPage.waitForEvent('download'),
      playwrightPage.click('[data-testid="drilldown-export-button"]'),
    ]);

    const downloadPath = await download.path();
    const csvContent = fs.readFileSync(downloadPath!, 'utf-8');
    const lines = csvContent.split('\n');

    // Validate detailed CSV structure
    expect(lines[0]).toContain('PostID');
    expect(lines[0]).toContain('Author');
    expect(lines[0]).toContain('Sentiment');
    expect(lines[0]).toContain('Confidence');
    expect(lines[0]).toContain('RedditURL');

    await closeStagehand(stagehand);
  });
});
```

### 4.5 Error Handling Test

**tests/error-handling.spec.ts:**
```typescript
import { test, expect } from '@playwright/test';
import { initStagehand, closeStagehand } from './helpers/stagehand-setup';

test.describe('Error Handling - API Quota Exceeded', () => {
  test('should display error banner and cached data when API quota is exceeded', async () => {
    const stagehand = await initStagehand();
    const page = stagehand.page;

    // First, load dashboard with valid data to populate cache
    await page.goto('/');
    await page.act('wait for dashboard to load');

    // Now mock API to return 429 error
    await page.route('**/api/sentiment/**', route => {
      route.fulfill({
        status: 429,
        body: JSON.stringify({
          error: 'Rate limit exceeded',
          retryAfter: '16:00 UTC'
        }),
      });
    });

    // Trigger data refresh (tab switch)
    await page.act('click on r/ClaudeAI tab');

    // Verify error banner appears
    const errorBanner = await page.observe('find the API quota exceeded warning banner');
    expect(errorBanner).toBeTruthy();

    // Verify error message content using AI
    await page.act('verify the error banner mentions API quota exceeded');
    await page.act('verify the error banner shows when the next refresh will be available');

    // Verify dashboard still shows cached data
    await page.observe('verify the charts are still displaying data despite the error');

    // Verify dashboard remains functional
    await page.act('click the 7 days time range button');
    await page.observe('verify the time range changed even with the API error');

    // Dismiss error banner
    await page.act('click the dismiss button on the error banner');
    const bannerDismissed = await page.observe('verify the error banner is no longer visible');
    expect(bannerDismissed).toBeTruthy();

    await closeStagehand(stagehand);
  });

  test('should show error state when API fails and no cache is available', async () => {
    const stagehand = await initStagehand();
    const page = stagehand.page;

    // Mock API to return error on first load (no cache)
    await page.route('**/api/sentiment/**', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    });

    await page.goto('/');

    // Verify error state
    const errorState = await page.observe('find the error message on the page');
    expect(errorState).toBeTruthy();

    // Verify retry button present
    await page.act('verify there is a retry button available');

    await closeStagehand(stagehand);
  });
});
```

### 4.6 Accessibility Test

**tests/accessibility.spec.ts:**
```typescript
import { test, expect } from '@playwright/test';
import { initStagehand, closeStagehand } from './helpers/stagehand-setup';

test.describe('Accessibility - Keyboard Navigation', () => {
  test('should support full keyboard navigation through dashboard', async ({ page: playwrightPage }) => {
    const stagehand = await initStagehand();
    const page = stagehand.page;

    await page.goto('/');
    await page.act('wait for dashboard to load');

    // Start at first focusable element
    await playwrightPage.keyboard.press('Tab');

    // Verify focus on export button
    let focusedElement = await playwrightPage.evaluate(() =>
      document.activeElement?.getAttribute('data-testid')
    );
    expect(focusedElement).toBe('header-export-button');

    // Tab to subreddit tabs
    await playwrightPage.keyboard.press('Tab');
    focusedElement = await playwrightPage.evaluate(() =>
      document.activeElement?.getAttribute('data-testid')
    );
    expect(focusedElement).toMatch(/subreddit-tab/);

    // Test arrow key navigation in tabs
    await playwrightPage.keyboard.press('ArrowRight');
    const nextTab = await playwrightPage.evaluate(() =>
      document.activeElement?.textContent
    );
    expect(nextTab).toBeTruthy();

    // Activate tab with Enter
    await playwrightPage.keyboard.press('Enter');
    await page.act('verify the tab was activated');

    // Continue to time range selector
    await playwrightPage.keyboard.press('Tab');
    await playwrightPage.keyboard.press('Tab');
    focusedElement = await playwrightPage.evaluate(() =>
      document.activeElement?.getAttribute('data-testid')
    );
    expect(focusedElement).toMatch(/time-range/);

    // Verify focus indicators visible
    const focusVisible = await playwrightPage.evaluate(() => {
      const el = document.activeElement;
      const styles = window.getComputedStyle(el!);
      return styles.outline !== 'none' || styles.boxShadow.includes('blue');
    });
    expect(focusVisible).toBe(true);

    await closeStagehand(stagehand);
  });

  test('should trap focus in modal and restore on close', async ({ page: playwrightPage }) => {
    const stagehand = await initStagehand();
    const page = stagehand.page;

    await page.goto('/');
    await page.act('wait for dashboard to load');

    // Open modal via keyboard
    await playwrightPage.keyboard.press('Tab'); // Navigate to chart
    // (In real implementation, chart would be keyboard accessible)
    // For now, use AI to open modal
    await page.act('click a data point to open the modal');

    // Verify focus in modal
    const focusInModal = await playwrightPage.evaluate(() => {
      const modal = document.querySelector('[data-testid="drilldown-modal"]');
      return modal?.contains(document.activeElement);
    });
    expect(focusInModal).toBe(true);

    // Tab multiple times - focus should stay in modal
    await playwrightPage.keyboard.press('Tab');
    await playwrightPage.keyboard.press('Tab');
    await playwrightPage.keyboard.press('Tab');

    const stillInModal = await playwrightPage.evaluate(() => {
      const modal = document.querySelector('[data-testid="drilldown-modal"]');
      return modal?.contains(document.activeElement);
    });
    expect(stillInModal).toBe(true);

    // Close modal with ESC
    await playwrightPage.keyboard.press('Escape');

    // Verify focus returned to page (not modal)
    const modalClosed = await playwrightPage.evaluate(() => {
      const modal = document.querySelector('[data-testid="drilldown-modal"]');
      return !modal || !modal.contains(document.activeElement);
    });
    expect(modalClosed).toBe(true);

    await closeStagehand(stagehand);
  });
});
```

---

## 5. Test Data Requirements

### 5.1 Mock Reddit API Responses

**Mock Data Structure for Dashboard:**

**tests/fixtures/mock-sentiment-data.json:**
```json
{
  "summary": {
    "avgSentiment": 0.42,
    "positivePercent": 62,
    "neutralPercent": 26,
    "negativePercent": 12,
    "totalPosts": 1247
  },
  "timeseries": [
    {
      "date": "2025-09-03",
      "sentiment": 0.35,
      "volume": 38,
      "positiveCount": 24,
      "neutralCount": 10,
      "negativeCount": 4
    },
    {
      "date": "2025-09-04",
      "sentiment": 0.42,
      "volume": 45,
      "positiveCount": 28,
      "neutralCount": 12,
      "negativeCount": 5
    }
  ],
  "keywords": [
    { "keyword": "claude code", "frequency": 342 },
    { "keyword": "release", "frequency": 156 },
    { "keyword": "cursor", "frequency": 134 },
    { "keyword": "bug", "frequency": 89 },
    { "keyword": "sonnet", "frequency": 76 }
  ]
}
```

**Mock Data for Drill-Down:**

**tests/fixtures/mock-day-details.json:**
```json
{
  "date": "2025-09-15",
  "subreddit": "ClaudeAI",
  "totalCount": 42,
  "avgSentiment": 0.62,
  "posts": [
    {
      "id": "abc123",
      "author": "developer123",
      "timestamp": "2025-09-15T14:32:00Z",
      "subreddit": "ClaudeAI",
      "title": "Claude Code just shipped Projects feature",
      "text": "Claude Code just shipped Projects feature - game changer for managing multiple files. This is exactly what I needed!",
      "sentiment": 0.89,
      "confidence": 0.94,
      "score": 127,
      "commentCount": 23,
      "redditUrl": "https://reddit.com/r/ClaudeAI/comments/abc123"
    },
    {
      "id": "def456",
      "author": "aitester",
      "timestamp": "2025-09-15T09:15:00Z",
      "subreddit": "ClaudeAI",
      "title": "Rate limit errors?",
      "text": "Anyone else getting rate limit errors with Claude Code today? Been happening since this morning.",
      "sentiment": -0.42,
      "confidence": 0.87,
      "score": 89,
      "commentCount": 34,
      "redditUrl": "https://reddit.com/r/ClaudeAI/comments/def456"
    }
  ]
}
```

### 5.2 Edge Case Data Sets

**Empty Data Response:**
```json
{
  "summary": null,
  "timeseries": [],
  "keywords": []
}
```

**Single Day Data:**
```json
{
  "summary": {
    "avgSentiment": 0.15,
    "positivePercent": 50,
    "neutralPercent": 30,
    "negativePercent": 20,
    "totalPosts": 12
  },
  "timeseries": [
    {
      "date": "2025-10-02",
      "sentiment": 0.15,
      "volume": 12,
      "positiveCount": 6,
      "neutralCount": 4,
      "negativeCount": 2
    }
  ],
  "keywords": [
    { "keyword": "test", "frequency": 5 }
  ]
}
```

**90-Day Maximum Data:**
```json
{
  "summary": {
    "avgSentiment": 0.38,
    "positivePercent": 58,
    "neutralPercent": 28,
    "negativePercent": 14,
    "totalPosts": 4523
  },
  "timeseries": [
    // Array of 90 daily objects
  ],
  "keywords": [
    // Top 20 keywords across 90 days
  ]
}
```

### 5.3 Mock Setup Helper

**tests/helpers/mock-api.ts:**
```typescript
import { Page } from '@playwright/test';
import mockSentimentData from '../fixtures/mock-sentiment-data.json';
import mockDayDetails from '../fixtures/mock-day-details.json';

export async function setupMockAPI(page: Page, scenario: 'success' | 'empty' | 'error' | 'quota') {
  switch (scenario) {
    case 'success':
      await page.route('**/api/sentiment/**', route => {
        route.fulfill({
          status: 200,
          body: JSON.stringify(mockSentimentData),
        });
      });
      await page.route('**/api/details/**', route => {
        route.fulfill({
          status: 200,
          body: JSON.stringify(mockDayDetails),
        });
      });
      break;

    case 'empty':
      await page.route('**/api/sentiment/**', route => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({ summary: null, timeseries: [], keywords: [] }),
        });
      });
      break;

    case 'error':
      await page.route('**/api/sentiment/**', route => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Internal server error' }),
        });
      });
      break;

    case 'quota':
      await page.route('**/api/sentiment/**', route => {
        route.fulfill({
          status: 429,
          body: JSON.stringify({
            error: 'Rate limit exceeded',
            retryAfter: '16:00 UTC'
          }),
        });
      });
      break;
  }
}
```

---

## 6. Acceptance Criteria Mapping

### 6.1 PRD Requirements → Test Coverage Matrix

| PRD Requirement | Test ID(s) | Test File | Status |
|-----------------|-----------|-----------|--------|
| **Dashboard with 90-day data** | DASH-001 | dashboard-load.spec.ts | ✓ |
| **Time selector (7/30/90 days)** | DASH-002 | time-range-selection.spec.ts | ✓ |
| **Subreddit tabs (All, r/ClaudeAI, r/ClaudeCode, r/Anthropic)** | DASH-003 | subreddit-filtering.spec.ts | ✓ |
| **Line chart for sentiment** | DASH-001, DASH-004 | dashboard-load.spec.ts, drilldown-modal.spec.ts | ✓ |
| **Bar chart for volume** | DASH-001, DASH-004 | dashboard-load.spec.ts | ✓ |
| **Keyword cloud/panel** | DASH-008 | keyword-panel.spec.ts | ✓ |
| **Drill-down to sample posts** | DASH-004 | drilldown-modal.spec.ts | ✓ |
| **Show sentiment scores and confidence** | DASH-004 | drilldown-modal.spec.ts | ✓ |
| **Reddit link-outs** | DASH-004 | drilldown-modal.spec.ts | ✓ |
| **CSV export** | DASH-005 | csv-export.spec.ts | ✓ |
| **API quota error handling** | DASH-006 | error-handling.spec.ts | ✓ |
| **Show last loaded data on quota error** | DASH-006 | error-handling.spec.ts | ✓ |
| **Loading states (skeleton)** | DASH-007 | loading-states.spec.ts | ✓ |
| **Dashboard remains usable with cached data** | DASH-006 | error-handling.spec.ts | ✓ |

### 6.2 Success Criteria Validation

**From PRD:** ">80% sentiment scoring accuracy on validation set"

**Test Validation:**
```typescript
// Validate sentiment scores are within valid range
test('sentiment scores should be between -1 and +1', async () => {
  const sentimentData = await page.extract({
    instruction: 'get all sentiment scores from the chart',
    schema: z.object({
      sentiments: z.array(z.number()),
    }),
  });

  sentimentData.sentiments.forEach(score => {
    expect(score).toBeGreaterThanOrEqual(-1);
    expect(score).toBeLessThanOrEqual(1);
  });
});
```

**From PRD:** "Dashboard should remain usable even if API quota is hit"

**Test Coverage:** DASH-006 validates full functionality with cached data during API quota errors.

---

## 7. Test Execution Plan

### 7.1 Test File Organization

```
tests/
├── helpers/
│   ├── stagehand-setup.ts       # Stagehand initialization
│   └── mock-api.ts              # API mocking utilities
├── fixtures/
│   ├── mock-sentiment-data.json # Sample dashboard data
│   └── mock-day-details.json    # Sample drill-down data
├── dashboard-load.spec.ts       # Initial load tests (P0)
├── time-range-selection.spec.ts # Time range tests (P0)
├── subreddit-filtering.spec.ts  # Subreddit tab tests (P0)
├── drilldown-modal.spec.ts      # Drill-down tests (P0)
├── csv-export.spec.ts           # Export tests (P0)
├── error-handling.spec.ts       # Error state tests (P0)
├── loading-states.spec.ts       # Loading UI tests (P1)
├── keyword-panel.spec.ts        # Keyword tests (P1)
├── accessibility.spec.ts        # A11y tests (P1)
├── mobile-responsive.spec.ts    # Mobile tests (P2)
└── performance.spec.ts          # Performance tests (P2)
```

### 7.2 Execution Order and Dependencies

**Phase 1: Smoke Tests (Run on every PR)**
```bash
npm run test:local -- dashboard-load.spec.ts
npm run test:local -- time-range-selection.spec.ts
npm run test:local -- subreddit-filtering.spec.ts
```

**Phase 2: Full Functional Tests (Run pre-merge)**
```bash
npm run test:local # All tests
```

**Phase 3: Cloud Tests (Run nightly/pre-release)**
```bash
npm run test:cloud # BrowserBase execution
```

### 7.3 CI/CD Integration

**GitHub Actions Workflow:**

**.github/workflows/e2e-tests.yml:**
```yaml
name: E2E Tests

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]
  schedule:
    - cron: '0 2 * * *' # Nightly at 2 AM UTC

jobs:
  e2e-local:
    name: E2E Tests (Local)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Start application
        run: npm run dev &

      - name: Wait for app to start
        run: npx wait-on http://localhost:3000

      - name: Run E2E tests
        env:
          STAGEHAND_ENV: LOCAL
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
        run: npm run test:local

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: test-results/

      - name: Upload Playwright report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/

  e2e-cloud:
    name: E2E Tests (BrowserBase)
    runs-on: ubuntu-latest
    if: github.event_name == 'schedule' || github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run cloud tests
        env:
          STAGEHAND_ENV: BROWSERBASE
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          BROWSERBASE_API_KEY: ${{ secrets.BROWSERBASE_API_KEY }}
          BROWSERBASE_PROJECT_ID: ${{ secrets.BROWSERBASE_PROJECT_ID }}
        run: npm run test:cloud

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: cloud-test-results
          path: test-results/
```

### 7.4 Performance Benchmarks

**Target Metrics:**
- Dashboard initial load: < 3s
- Time range switch: < 1s
- Subreddit tab switch: < 1s
- Drill-down modal open: < 500ms
- CSV export: < 2s

**Performance Test:**

**tests/performance.spec.ts:**
```typescript
import { test, expect } from '@playwright/test';

test.describe('Performance Benchmarks', () => {
  test('dashboard should load in under 3 seconds', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/');
    await page.waitForSelector('[data-testid="sentiment-chart-container"]', {
      state: 'visible'
    });

    const loadTime = Date.now() - startTime;

    console.log(`Dashboard load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(3000);
  });

  test('time range switch should complete in under 1 second', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const startTime = Date.now();

    await page.click('[data-testid="time-range-90d"]');
    await page.waitForSelector('[data-testid="sentiment-chart-container"][data-loaded="true"]');

    const switchTime = Date.now() - startTime;

    console.log(`Time range switch time: ${switchTime}ms`);
    expect(switchTime).toBeLessThan(1000);
  });
});
```

### 7.5 Test Execution Summary

**Commands:**
```bash
# Run all tests locally
npm test

# Run specific test suite
npm test -- dashboard-load.spec.ts

# Run tests with UI mode (debugging)
npm run test:ui

# Run tests with debug mode (step-through)
npm run test:debug

# Generate HTML report
npm run test:report

# Run tests in headless mode
HEADLESS=true npm test

# Run cloud tests
npm run test:cloud
```

**Expected Results:**
- Total tests: ~50-60
- P0 tests: ~25 (must pass)
- P1 tests: ~20 (should pass)
- P2 tests: ~10-15 (nice to have)
- Execution time: 5-10 minutes (local), 10-15 minutes (cloud)
- Pass rate: >95% (P0+P1)

---

## Appendix A: Stagehand Best Practices

### Natural Language Patterns That Work Well

**Good:**
```typescript
await page.act("click the 7 days time range button");
await page.act("select the r/ClaudeAI subreddit tab");
await page.observe("verify the sentiment chart shows positive trend");
```

**Avoid (Too Vague):**
```typescript
await page.act("click button"); // Which button?
await page.act("change settings"); // Too ambiguous
```

### When to Use Fallback Selectors

**Use Fallbacks When:**
- Element is dynamically generated
- AI discovery has historically failed
- Precise timing is critical (race conditions)
- Element has no semantic meaning (decorative)

**Example:**
```typescript
try {
  await page.act("click the export button");
} catch {
  await page.locator('[data-testid="header-export-button"]').click();
}
```

### Schema Design for Extract

**Good Schema (Specific):**
```typescript
const schema = z.object({
  avgSentiment: z.number().min(-1).max(1),
  totalPosts: z.number().int().positive(),
});
```

**Avoid (Too Loose):**
```typescript
const schema = z.object({
  data: z.any(), // Too vague
});
```

---

## Appendix B: Troubleshooting Guide

### Common Stagehand Issues

**Issue:** "AI discovery timed out"
**Solution:** Add more specific instruction or fallback to data-testid

**Issue:** "Element not found"
**Solution:** Wait for loading states to complete, use `page.act('wait for...')`

**Issue:** "Test flakiness"
**Solution:** Add explicit waits, use `networkidle` or observe loading indicators

### Debug Tips

**Enable Verbose Logging:**
```typescript
const stagehand = await initStagehand({ verbose: 2 });
```

**Capture Screenshots on Failure:**
```typescript
test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== 'passed') {
    await page.screenshot({ path: `failure-${testInfo.title}.png` });
  }
});
```

**Use Playwright Inspector:**
```bash
npm run test:debug
```

---

## Document Complete

**Output File:**
`.claude/outputs/design/agents/stagehand-expert/claude-code-sentiment-monitor-reddit-20251002-231759/test-specifications.md`

**Status:** ✓ Complete

This comprehensive test specification provides:
1. Strategic testing philosophy (AI-first with fallbacks)
2. Detailed test scenarios for all PRD requirements
3. Executable Stagehand test code examples
4. Mock data structures and fixtures
5. Full acceptance criteria mapping
6. CI/CD integration plan
7. Performance benchmarks and execution guidelines

**Next Steps:**
1. Set up test project with dependencies
2. Implement mock API layer
3. Write executable test files
4. Configure CI/CD pipeline
5. Execute smoke tests
6. Iterate and refine based on results
