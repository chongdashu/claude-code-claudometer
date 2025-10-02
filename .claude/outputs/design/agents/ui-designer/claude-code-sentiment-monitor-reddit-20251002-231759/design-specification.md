# UI/UX Design Specification
**Project:** Claude Code Sentiment Monitor (Reddit)
**Version:** 1.0
**Date:** 2025-10-02
**Platform:** Next.js 15 Web Application

---

## Table of Contents
1. [Design Philosophy & Visual Direction](#1-design-philosophy--visual-direction)
2. [Wireframes](#2-wireframes)
3. [Component Hierarchy](#3-component-hierarchy)
4. [User Flows](#4-user-flows)
5. [Interaction Patterns](#5-interaction-patterns)
6. [Accessibility Considerations](#6-accessibility-considerations)

---

## 1. Design Philosophy & Visual Direction

### 1.1 Overall Aesthetic Approach

**Core Principle: Clarity Over Decoration**

This is a data analytics dashboard designed for quick interpretation and decision-making. The visual design should:

- **Prioritize data legibility** over visual flourish
- **Minimize cognitive load** through clear hierarchy and whitespace
- **Support rapid scanning** with visual patterns that guide the eye
- **Feel professional and trustworthy** to suit product/dev leads, marketers, and community managers
- **Embrace modern data dashboard conventions** (inspired by Datadog, Grafana, Amplitude)

**Design Personality:**
- Clean and technical, but approachable
- Data-first, not decoration-first
- Responsive and fast-feeling
- Transparent about data sources and methodology

### 1.2 Color Palette Philosophy

**Primary Palette (Data Visualization):**

```
Sentiment Colors (Semantic):
- Positive:   #10B981 (Emerald 500) - Clear, not overly bright
- Neutral:    #6B7280 (Gray 500) - Balanced, not harsh
- Negative:   #EF4444 (Red 500) - Warning without alarm
- Mixed/All:  #3B82F6 (Blue 500) - Versatile aggregate color

Chart Backgrounds:
- Light mode: #F9FAFB (Gray 50) - Subtle, non-competing
- Dark mode:  #111827 (Gray 900) - Deep but readable

Interactive Elements:
- Primary CTA:   #3B82F6 (Blue 500)
- Hover:         #2563EB (Blue 600)
- Selected/Active: #1D4ED8 (Blue 700)
```

**Neutral Palette (UI Framework):**

```
Text Hierarchy:
- Primary text:   #111827 (Gray 900) - High contrast
- Secondary text: #6B7280 (Gray 500) - Readable, de-emphasized
- Disabled text:  #9CA3AF (Gray 400) - Clear disabled state

Backgrounds:
- Page:      #FFFFFF (White)
- Card/Panel: #FFFFFF with subtle shadow
- Dividers:  #E5E7EB (Gray 200)

Borders:
- Default:   #E5E7EB (Gray 200)
- Hover:     #D1D5DB (Gray 300)
- Focus:     #3B82F6 (Blue 500)
```

**Accessibility Requirements:**
- All text must meet WCAG AA contrast ratio (4.5:1 for normal text, 3:1 for large)
- Sentiment colors tested for colorblind users (deuteranopia, protanopia)
- Never rely on color alone (use labels, patterns, or icons)

### 1.3 Typography Strategy

**Font Selection:**

```
Primary: Inter (system-ui fallback)
- Clean, readable at small sizes
- Excellent for data-heavy interfaces
- Wide range of weights for hierarchy

Monospace: 'JetBrains Mono' or 'SF Mono' (for data points, counts)
- Use sparingly for numerical precision
```

**Type Scale (Tailwind-inspired):**

```
Heading 1 (Page Title):
  - Font: Inter SemiBold
  - Size: 30px / 1.875rem
  - Line height: 36px / 2.25rem
  - Use case: "Claude Code Sentiment Monitor"

Heading 2 (Section Title):
  - Font: Inter SemiBold
  - Size: 24px / 1.5rem
  - Line height: 32px / 2rem
  - Use case: Chart titles, modal headers

Heading 3 (Subsection):
  - Font: Inter Medium
  - Size: 18px / 1.125rem
  - Line height: 28px / 1.75rem
  - Use case: Card titles, tab labels

Body (Default):
  - Font: Inter Regular
  - Size: 14px / 0.875rem
  - Line height: 20px / 1.25rem
  - Use case: Main UI text, labels

Body Small (Metadata):
  - Font: Inter Regular
  - Size: 12px / 0.75rem
  - Line height: 16px / 1rem
  - Use case: Timestamps, auxiliary info, chart axis labels

Data Point (Monospace):
  - Font: JetBrains Mono Medium
  - Size: 14px / 0.875rem
  - Use case: Sentiment scores, counts, percentages
```

**Typography Principles:**
- Use consistent scale (avoid one-off sizes)
- Limit font weights to Regular, Medium, SemiBold (avoid extremes)
- Generous line-height for readability (1.4-1.6 for body text)
- Left-align text for quick scanning (center only for empty states)

### 1.4 Spacing & Layout Principles

**Spatial System (8px Grid):**

```
Base unit: 8px (0.5rem)

Spacing scale:
- XXS: 4px   (0.25rem) - Inline elements, tight groups
- XS:  8px   (0.5rem)  - Related items
- SM:  12px  (0.75rem) - Form fields, small gaps
- MD:  16px  (1rem)    - Default spacing (cards, sections)
- LG:  24px  (1.5rem)  - Between major sections
- XL:  32px  (2rem)    - Page padding, major dividers
- 2XL: 48px  (3rem)    - Hero spacing, large gaps
```

**Layout Grid:**

```
Desktop (1280px+):
- Container max-width: 1440px
- Side padding: 32px (2rem)
- Column gap: 24px (1.5rem)
- Main content: 12-column grid

Tablet (768px - 1279px):
- Container: Full width with padding
- Side padding: 24px (1.5rem)
- Column gap: 16px (1rem)

Mobile (< 768px):
- Container: Full width
- Side padding: 16px (1rem)
- Single column layout
```

**Chart & Data Visualization Principles:**

- **Whitespace is critical:** Charts need breathing room (min 24px margin)
- **Axis labels:** Clear, uncluttered (rotate if needed, or abbreviate)
- **Legend placement:** Top-right for line charts, bottom for bar charts
- **Grid lines:** Subtle (opacity 0.1-0.2), horizontal only for line charts
- **Hover tooltips:** Positioned above data point, with 8px offset
- **Responsive charts:** Maintain aspect ratio 16:9 (desktop), 4:3 (mobile)

---

## 2. Wireframes

### 2.1 Dashboard Landing Page (Desktop)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Header                                                                      │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  Claude Code Sentiment Monitor                          [CSV Export]  │   │
│  │  Track Reddit sentiment from r/ClaudeAI, r/ClaudeCode, r/Anthropic   │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────────────┤
│  Controls Bar                                                                │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  [All] [r/ClaudeAI] [r/ClaudeCode] [r/Anthropic]     [7d] [30d] [90d]│   │
│  │   ^Tab Navigation                                      ^Time Selector│   │
│  └──────────────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────────────┤
│  Main Content Area                                                           │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  Summary Metrics (4-col grid)                                        │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐              │   │
│  │  │ Avg      │ │ Positive │ │ Negative │ │ Total    │              │   │
│  │  │ Sentiment│ │ %        │ │ %        │ │ Posts    │              │   │
│  │  │  +0.42   │ │  62%     │ │  12%     │ │  1,247   │              │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘              │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  Sentiment Trend (Line Chart)                                        │   │
│  │  ┌────────────────────────────────────────────────────────────────┐ │   │
│  │  │ 1.0 ┤                                                           │ │   │
│  │  │     │          ╱╲                                               │ │   │
│  │  │ 0.5 ┤     ╱╲  ╱  ╲    ╱╲                                       │ │   │
│  │  │     │    ╱  ╲╱    ╲  ╱  ╲                                      │ │   │
│  │  │ 0.0 ┼───────────────────────────────────────────────────────   │ │   │
│  │  │     │                    ╲╱                                     │ │   │
│  │  │-0.5 ┤                                                           │ │   │
│  │  │     └─────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────  │ │   │
│  │  │         Oct 1  5   10  15  20  25  30  Nov 5  10  15  20      │ │   │
│  │  │  (Hover: "Oct 15: +0.62, 42 posts" with clickable indicator)   │ │   │
│  │  └────────────────────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  Volume Trend (Bar Chart)                                            │   │
│  │  ┌────────────────────────────────────────────────────────────────┐ │   │
│  │  │ 100┤                                                            │ │   │
│  │  │    │     ██         ██                                          │ │   │
│  │  │  50┤     ██  ██     ██     ██                                   │ │   │
│  │  │    │  ██ ██  ██  ██ ██  ██ ██  ██                              │ │   │
│  │  │   0┼──────────────────────────────────────────────────────────  │ │   │
│  │  │    └─────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────   │ │   │
│  │  │        Oct 1  5   10  15  20  25  30  Nov 5  10  15  20       │ │   │
│  │  └────────────────────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  Top Keywords (Tag Cloud)                                            │   │
│  │  ┌────────────────────────────────────────────────────────────────┐ │   │
│  │  │  CLAUDE CODE   release   cursor   bug   Sonnet   API           │ │   │
│  │  │  update   feature   VS Code   performance   AWESOME   slow     │ │   │
│  │  │  better   projects   cline   helpful   issues   fast           │ │   │
│  │  │  (Size indicates frequency; clickable for filtering)            │ │   │
│  │  └────────────────────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Daily Drill-Down Modal (Desktop)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  BACKDROP (semi-transparent overlay)                                         │
│    ┌────────────────────────────────────────────────────────────────────┐   │
│    │  Modal Header                                          [X Close]   │   │
│    │  October 15, 2025 - r/ClaudeAI                                     │   │
│    │  ┌──────────────────────────────────────────────────────────────┐ │   │
│    │  │  42 posts/comments  •  Avg sentiment: +0.62 (Positive)       │ │   │
│    │  └──────────────────────────────────────────────────────────────┘ │   │
│    ├────────────────────────────────────────────────────────────────────┤   │
│    │  Modal Body (scrollable)                                           │   │
│    │  ┌────────────────────────────────────────────────────────────────┐│  │
│    │  │ Sample Posts/Comments (Top 10 by engagement)                   ││  │
│    │  │                                                                 ││  │
│    │  │ ┌────────────────────────────────────────────────────────────┐ ││  │
│    │  │ │ 1. u/developer123 • 14:32 UTC • r/ClaudeAI               │ ││  │
│    │  │ │    "Claude Code just shipped Projects feature - game..."   │ ││  │
│    │  │ │    Sentiment: +0.89 (Positive) • Confidence: 94%          │ ││  │
│    │  │ │    Score: 127 • 23 comments                                │ ││  │
│    │  │ │    [View on Reddit →]                                      │ ││  │
│    │  │ └────────────────────────────────────────────────────────────┘ ││  │
│    │  │                                                                 ││  │
│    │  │ ┌────────────────────────────────────────────────────────────┐ ││  │
│    │  │ │ 2. u/aitester • 09:15 UTC • r/ClaudeAI                    │ ││  │
│    │  │ │    "Anyone else getting rate limit errors with Claude..."  │ ││  │
│    │  │ │    Sentiment: -0.42 (Negative) • Confidence: 87%          │ ││  │
│    │  │ │    Score: 89 • 34 comments                                 │ ││  │
│    │  │ │    [View on Reddit →]                                      │ ││  │
│    │  │ └────────────────────────────────────────────────────────────┘ ││  │
│    │  │                                                                 ││  │
│    │  │ ... (8 more items) ...                                          ││  │
│    │  │                                                                 ││  │
│    │  └────────────────────────────────────────────────────────────────┘│  │
│    │  [Show More] [Export This Day as CSV]                              │   │
│    └────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.3 Mobile Layout (< 768px)

```
┌──────────────────────────────┐
│ ☰  Claude Code Sentiment     │
│     Monitor             [⬇️]  │
├──────────────────────────────┤
│ [All]                        │
│ [r/ClaudeAI]                 │
│ [r/ClaudeCode]               │
│ [r/Anthropic]                │
│                              │
│ [7d] [30d] [90d]             │
├──────────────────────────────┤
│ ┌──────────┐ ┌──────────┐   │
│ │ Avg Sent │ │ Total    │   │
│ │  +0.42   │ │ 1,247    │   │
│ └──────────┘ └──────────┘   │
│ ┌──────────┐ ┌──────────┐   │
│ │ Positive │ │ Negative │   │
│ │   62%    │ │   12%    │   │
│ └──────────┘ └──────────┘   │
├──────────────────────────────┤
│ Sentiment Trend              │
│ ┌──────────────────────────┐ │
│ │ (Simplified chart,       │ │
│ │  touch-optimized)        │ │
│ │                          │ │
│ │   ╱╲    ╱╲               │ │
│ │  ╱  ╲  ╱  ╲              │ │
│ │ ╱    ╲╱                  │ │
│ └──────────────────────────┘ │
├──────────────────────────────┤
│ Volume Trend                 │
│ ┌──────────────────────────┐ │
│ │  ██ ██ ██ ██ ██ ██ ██   │ │
│ └──────────────────────────┘ │
├──────────────────────────────┤
│ Top Keywords                 │
│ ┌──────────────────────────┐ │
│ │ CLAUDE CODE  release     │ │
│ │ cursor  bug  Sonnet      │ │
│ │ update  feature  API     │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

### 2.4 Loading State

```
┌─────────────────────────────────────────────────────────────────┐
│  Claude Code Sentiment Monitor                    [CSV Export]  │
├─────────────────────────────────────────────────────────────────┤
│  [All] [r/ClaudeAI] [r/ClaudeCode] [r/Anthropic]   [7d][30d][90d]
├─────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  │
│  │  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  │
│  │                                                            │  │
│  │         Loading sentiment data...                         │  │
│  │         [Spinner Animation]                               │  │
│  │                                                            │  │
│  │  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  │
│  │  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  │
│  └───────────────────────────────────────────────────────────┘  │
│  (Skeleton screens with shimmer effect for charts/cards)        │
└─────────────────────────────────────────────────────────────────┘
```

### 2.5 Error State (API Quota Exceeded)

```
┌─────────────────────────────────────────────────────────────────┐
│  Claude Code Sentiment Monitor                    [CSV Export]  │
├─────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  ⚠️  API quota exceeded                                   │  │
│  │                                                            │  │
│  │  Showing last loaded data from 2 hours ago.               │  │
│  │  Next refresh available at 16:00 UTC.                     │  │
│  │                                                            │  │
│  │  [Dismiss]                                                 │  │
│  └───────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│  (Dashboard displays normally with last cached data)            │
│  [All] [r/ClaudeAI] [r/ClaudeCode] [r/Anthropic]   [7d][30d][90d]
│  ...charts and data shown normally...                           │
└─────────────────────────────────────────────────────────────────┘
```

### 2.6 Empty State (No Data Available)

```
┌─────────────────────────────────────────────────────────────────┐
│  Claude Code Sentiment Monitor                    [CSV Export]  │
├─────────────────────────────────────────────────────────────────┤
│  [All] [r/ClaudeAI] [r/ClaudeCode] [r/Anthropic]   [7d][30d][90d]
├─────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                                                            │  │
│  │                        📊                                 │  │
│  │                                                            │  │
│  │              No data available yet                        │  │
│  │                                                            │  │
│  │     Data collection is in progress. Please check back     │  │
│  │     in a few hours as we backfill the last 90 days.       │  │
│  │                                                            │  │
│  │                    [Refresh]                              │  │
│  │                                                            │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Component Hierarchy

### 3.1 Page Structure

```
App Root (Next.js 15)
│
├── Layout (RootLayout)
│   ├── Global Styles
│   ├── Font Loading (Inter)
│   └── Metadata
│
└── Dashboard Page (/dashboard or /)
    ├── DashboardShell
    │   ├── Header
    │   ├── ControlsBar
    │   └── MainContent
    └── DrillDownModal (conditional)
```

### 3.2 Component Breakdown

#### **DashboardShell**
Top-level container for the entire dashboard view.

**Props:**
- None (fetches data internally or from context)

**Responsibilities:**
- Orchestrate data fetching and state management
- Provide layout structure (header, controls, main content)
- Handle responsive breakpoints

**Children:**
- Header
- ControlsBar
- MainContent
- DrillDownModal (conditional render)

---

#### **Header**
Top navigation and branding area.

**Props:**
- `onExportCSV: () => void`

**Structure:**
```
<header>
  <div className="header-content">
    <div className="branding">
      <h1>Claude Code Sentiment Monitor</h1>
      <p className="tagline">
        Track Reddit sentiment from r/ClaudeAI, r/ClaudeCode, r/Anthropic
      </p>
    </div>
    <Button variant="outline" onClick={onExportCSV}>
      CSV Export
    </Button>
  </div>
</header>
```

**Styling Notes:**
- Fixed height: 80px (desktop), 64px (mobile)
- Bottom border: 1px solid gray-200
- Padding: 16px horizontal

---

#### **ControlsBar**
Horizontal bar containing subreddit tabs and time range selector.

**Props:**
- `activeSubreddit: 'all' | 'ClaudeAI' | 'ClaudeCode' | 'Anthropic'`
- `onSubredditChange: (subreddit) => void`
- `activeTimeRange: 7 | 30 | 90`
- `onTimeRangeChange: (days) => void`

**Structure:**
```
<div className="controls-bar">
  <SubredditTabs
    active={activeSubreddit}
    onChange={onSubredditChange}
  />
  <TimeRangeSelector
    active={activeTimeRange}
    onChange={onTimeRangeChange}
  />
</div>
```

**Layout:**
- Flexbox: `justify-between` (tabs left, time selector right)
- Height: 56px
- Background: white
- Bottom border: 1px solid gray-200
- Sticky on scroll (position: sticky, top: 0)

---

#### **SubredditTabs**
Tab navigation for filtering by subreddit.

**Props:**
- `active: string`
- `onChange: (subreddit: string) => void`

**Structure:**
```
<div className="subreddit-tabs" role="tablist">
  <button role="tab" aria-selected={active === 'all'}>All</button>
  <button role="tab" aria-selected={active === 'ClaudeAI'}>r/ClaudeAI</button>
  <button role="tab" aria-selected={active === 'ClaudeCode'}>r/ClaudeCode</button>
  <button role="tab" aria-selected={active === 'Anthropic'}>r/Anthropic</button>
</div>
```

**Visual States:**
- Default: Gray text, no underline
- Hover: Blue text, subtle background
- Active: Blue text, 2px blue underline, bold

**Mobile Behavior:**
- Stack vertically or use horizontal scroll with snap points

---

#### **TimeRangeSelector**
Button group for selecting time range (7/30/90 days).

**Props:**
- `active: 7 | 30 | 90`
- `onChange: (days: number) => void`

**Structure:**
```
<div className="time-range-selector" role="group">
  <button className={active === 7 ? 'active' : ''}>7d</button>
  <button className={active === 30 ? 'active' : ''}>30d</button>
  <button className={active === 90 ? 'active' : ''}>90d</button>
</div>
```

**Visual States:**
- Default: Gray background, dark text
- Hover: Slightly darker gray
- Active: Blue background, white text

**Layout:**
- Segmented control style (buttons connected)
- Equal width buttons (40px each)

---

#### **MainContent**
Primary content area containing metrics, charts, and keywords.

**Props:**
- `data: DashboardData`
- `loading: boolean`
- `onDayClick: (date: string) => void`

**Structure:**
```
<main className="main-content">
  {loading ? (
    <LoadingState />
  ) : (
    <>
      <SummaryMetrics data={data.summary} />
      <SentimentChart data={data.sentimentTimeseries} onDayClick={onDayClick} />
      <VolumeChart data={data.volumeTimeseries} onDayClick={onDayClick} />
      <KeywordPanel data={data.keywords} />
    </>
  )}
</main>
```

**Layout:**
- Vertical stack with 24px gaps
- Max-width: 1440px
- Padding: 32px (desktop), 16px (mobile)

---

#### **SummaryMetrics**
Four-column grid of key metrics at the top of the dashboard.

**Props:**
- `data: { avgSentiment, positivePercent, negativePercent, totalPosts }`

**Structure:**
```
<div className="summary-metrics">
  <MetricCard
    label="Avg Sentiment"
    value={avgSentiment}
    format="sentiment"
    icon={TrendIcon}
  />
  <MetricCard
    label="Positive"
    value={positivePercent}
    format="percentage"
    color="green"
  />
  <MetricCard
    label="Negative"
    value={negativePercent}
    format="percentage"
    color="red"
  />
  <MetricCard
    label="Total Posts"
    value={totalPosts}
    format="number"
  />
</div>
```

**Layout:**
- Grid: 4 columns (desktop), 2 columns (tablet), 1 column (mobile)
- Gap: 16px
- Equal height cards

---

#### **MetricCard**
Individual metric display card.

**Props:**
- `label: string`
- `value: number`
- `format: 'sentiment' | 'percentage' | 'number'`
- `color?: 'green' | 'red' | 'blue' | 'gray'`
- `icon?: React.Component`

**Structure:**
```
<div className="metric-card">
  <div className="metric-label">{label}</div>
  <div className="metric-value" style={{ color: colorMap[color] }}>
    {formatValue(value, format)}
  </div>
  {icon && <Icon className="metric-icon" />}
</div>
```

**Visual Design:**
- Background: white
- Border: 1px solid gray-200
- Border-radius: 8px
- Padding: 16px
- Shadow: subtle (0 1px 3px rgba(0,0,0,0.1))
- Hover: slight shadow increase

**Value Formatting:**
- Sentiment: +0.42, -0.15 (2 decimal places, with sign)
- Percentage: 62% (no decimal)
- Number: 1,247 (with comma separators)

---

#### **SentimentChart**
Line chart showing sentiment over time.

**Props:**
- `data: Array<{ date: string, sentiment: number }>`
- `onDayClick: (date: string) => void`

**Library:** Recharts or Chart.js (recommendation: Recharts for React integration)

**Configuration:**
- Chart type: Line
- X-axis: Dates (formatted as "Oct 15" or "10/15")
- Y-axis: Sentiment score (-1 to +1)
- Line color: Blue (#3B82F6)
- Grid: Horizontal lines only, subtle (opacity 0.1)
- Tooltip: On hover, show date + sentiment + post count
- Click handler: onClick data point triggers drill-down

**Visual Design:**
- Container: White card with border
- Padding: 16px
- Title: "Sentiment Trend" (H2 style)
- Height: 300px (desktop), 240px (mobile)
- Responsive: Adjust x-axis label density on smaller screens

**Interaction:**
- Hover: Highlight data point, show tooltip
- Click: Trigger `onDayClick(date)` to open modal

---

#### **VolumeChart**
Bar chart showing post/comment volume over time.

**Props:**
- `data: Array<{ date: string, count: number }>`
- `onDayClick: (date: string) => void`

**Configuration:**
- Chart type: Bar
- X-axis: Dates
- Y-axis: Post count (auto-scale)
- Bar color: Blue (#3B82F6)
- Grid: Horizontal lines only
- Tooltip: Date + count
- Click handler: onClick bar triggers drill-down

**Visual Design:**
- Same card styling as SentimentChart
- Title: "Volume Trend"
- Height: 240px (desktop), 200px (mobile)

**Interaction:**
- Hover: Darken bar, show tooltip
- Click: Trigger `onDayClick(date)`

---

#### **KeywordPanel**
Display of top keywords/phrases from the selected time range.

**Props:**
- `data: Array<{ keyword: string, frequency: number }>`

**Structure:**
```
<div className="keyword-panel">
  <h2>Top Keywords</h2>
  <div className="keyword-cloud">
    {data.map(({ keyword, frequency }) => (
      <span
        className="keyword-tag"
        style={{ fontSize: calculateSize(frequency) }}
      >
        {keyword}
      </span>
    ))}
  </div>
</div>
```

**Visual Design:**
- Card styling (white background, border, shadow)
- Padding: 16px
- Title: "Top Keywords"
- Tag cloud layout: Flexbox wrap, center-aligned
- Font size: 12px (min) to 24px (max), scaled by frequency
- Tag styling: Rounded background (gray-100), padding 4px 8px, margin 4px
- Interactive: Hover changes to blue background (optional feature: click to filter)

---

#### **DrillDownModal**
Modal overlay showing detailed posts/comments for a selected day.

**Props:**
- `isOpen: boolean`
- `onClose: () => void`
- `date: string`
- `subreddit: string`
- `data: DrillDownData`

**Structure:**
```
<Modal isOpen={isOpen} onClose={onClose}>
  <ModalHeader>
    <h2>{formatDate(date)} - {subreddit}</h2>
    <button onClick={onClose}>✕</button>
  </ModalHeader>
  <ModalSummary>
    {data.totalCount} posts/comments • Avg sentiment: {data.avgSentiment}
  </ModalSummary>
  <ModalBody>
    <PostList posts={data.samples} />
  </ModalBody>
  <ModalFooter>
    <Button onClick={handleExportDay}>Export This Day as CSV</Button>
  </ModalFooter>
</Modal>
```

**Visual Design:**
- Backdrop: Semi-transparent black (rgba(0,0,0,0.5))
- Modal: White, centered, max-width 800px
- Border-radius: 12px
- Padding: 24px
- Shadow: Large (0 20px 25px rgba(0,0,0,0.15))
- Max-height: 80vh, body scrollable

**Animation:**
- Entrance: Fade in + scale from 0.95 to 1
- Exit: Fade out + scale to 0.95
- Duration: 200ms

---

#### **PostList**
List of individual Reddit posts/comments with sentiment.

**Props:**
- `posts: Array<PostData>`

**Structure:**
```
<div className="post-list">
  {posts.map((post) => (
    <PostCard key={post.id} post={post} />
  ))}
</div>
```

**Layout:**
- Vertical stack, 16px gap
- Scrollable container

---

#### **PostCard**
Individual Reddit post/comment card in drill-down view.

**Props:**
- `post: PostData` (author, timestamp, text, sentiment, confidence, score, commentCount, redditUrl)

**Structure:**
```
<div className="post-card">
  <div className="post-header">
    <span className="author">u/{post.author}</span>
    <span className="timestamp">{formatTime(post.timestamp)}</span>
    <span className="subreddit">{post.subreddit}</span>
  </div>
  <div className="post-text">
    {truncate(post.text, 200)}
  </div>
  <div className="post-meta">
    <SentimentBadge sentiment={post.sentiment} confidence={post.confidence} />
    <span className="engagement">
      Score: {post.score} • {post.commentCount} comments
    </span>
  </div>
  <a href={post.redditUrl} target="_blank" className="reddit-link">
    View on Reddit →
  </a>
</div>
```

**Visual Design:**
- Background: Gray-50
- Border: 1px solid gray-200
- Border-radius: 8px
- Padding: 12px
- Hover: Slight shadow

---

#### **SentimentBadge**
Pill-shaped badge showing sentiment and confidence.

**Props:**
- `sentiment: number` (-1 to +1)
- `confidence: number` (0 to 1)

**Structure:**
```
<div className={`sentiment-badge sentiment-${getCategory(sentiment)}`}>
  Sentiment: {formatSentiment(sentiment)} ({getLabel(sentiment)})
  • Confidence: {Math.round(confidence * 100)}%
</div>
```

**Visual Design:**
- Positive: Green background, dark green text
- Neutral: Gray background, dark gray text
- Negative: Red background, dark red text
- Padding: 4px 8px
- Border-radius: 12px (pill shape)
- Font size: 12px

---

#### **LoadingState**
Skeleton screen for loading state.

**Structure:**
```
<div className="loading-state">
  <SkeletonMetrics />
  <SkeletonChart height={300} />
  <SkeletonChart height={240} />
  <SkeletonKeywords />
</div>
```

**Visual Design:**
- Gray rectangles with shimmer animation
- Maintains layout to prevent content shift
- Shimmer: Linear gradient animation (left to right)

---

#### **ErrorBanner**
Alert banner for API errors or quota issues.

**Props:**
- `type: 'warning' | 'error' | 'info'`
- `message: string`
- `onDismiss?: () => void`

**Structure:**
```
<div className={`error-banner ${type}`}>
  <Icon type={type} />
  <span className="message">{message}</span>
  {onDismiss && <button onClick={onDismiss}>Dismiss</button>}
</div>
```

**Visual Design:**
- Warning: Yellow background, orange border
- Error: Red background, dark red border
- Info: Blue background, dark blue border
- Padding: 12px 16px
- Border-radius: 8px
- Positioned at top of MainContent

---

### 3.3 Data Flow

```
DashboardShell (State Management)
  ↓ (fetch data via API)
  ├→ activeSubreddit state
  ├→ activeTimeRange state
  ├→ dashboardData state
  ├→ drillDownDate state (for modal)
  │
  ├→ ControlsBar
  │   ├→ SubredditTabs (receives active, onChange)
  │   └→ TimeRangeSelector (receives active, onChange)
  │
  ├→ MainContent
  │   ├→ SummaryMetrics (receives data.summary)
  │   ├→ SentimentChart (receives data.timeseries, onDayClick)
  │   ├→ VolumeChart (receives data.timeseries, onDayClick)
  │   └→ KeywordPanel (receives data.keywords)
  │
  └→ DrillDownModal (conditional)
      ├→ receives drillDownDate, drillDownData
      └→ PostList → PostCard
```

**State Management Strategy:**
- Use React Context or Zustand for global state (subreddit, timeRange, data cache)
- Local state for UI interactions (modal open/close, loading states)
- React Query or SWR for data fetching (automatic caching, revalidation)

---

## 4. User Flows

### 4.1 Initial Dashboard Load

**User Action:**
User navigates to the dashboard URL.

**System Flow:**
1. Page renders with loading state (skeleton screens)
2. API request: Fetch aggregated data for "All" subreddits, last 30 days (default)
3. Data received:
   - Summary metrics populate
   - Charts render with animation (fade in + draw)
   - Keyword cloud displays
4. Loading state removed, full dashboard visible
5. Controls are interactive (tabs, time selector)

**Edge Cases:**
- **No data available:** Show empty state with message "Data collection in progress"
- **API error:** Show error banner, allow retry
- **Slow network:** Show loading state for up to 10s, then timeout message

**Timeline:**
- Skeleton visible: 0-2s
- Data loads: 1-3s
- Charts animate: 0.5s after data received

---

### 4.2 Switching Time Ranges

**User Action:**
User clicks "90d" in TimeRangeSelector.

**System Flow:**
1. Active state changes to "90d" (visual feedback immediate)
2. API request: Fetch data for current subreddit, last 90 days
3. Charts update:
   - Fade out old data (200ms)
   - New data fades in with animation (300ms)
   - X-axis labels adjust to show more dates
4. Summary metrics update with new averages
5. Keyword cloud updates with 90-day keywords

**Visual Feedback:**
- Clicked button shows active state (blue background)
- Charts show subtle loading indicator during fetch (optional: shimmer overlay)
- Smooth transition animation prevents jarring change

**Performance Consideration:**
- Cache previous time range data (don't refetch if user toggles back)
- Preload adjacent time ranges on idle

---

### 4.3 Switching Subreddit Tabs

**User Action:**
User clicks "r/ClaudeAI" tab.

**System Flow:**
1. Tab shows active state (blue underline, bold text)
2. API request: Fetch data for r/ClaudeAI, current time range
3. Dashboard updates:
   - Summary metrics recalculate for r/ClaudeAI only
   - Charts redraw with r/ClaudeAI data
   - Keywords update to r/ClaudeAI-specific terms
4. URL updates (optional): `/dashboard?subreddit=ClaudeAI&range=30`

**Visual Feedback:**
- Immediate tab highlighting
- Smooth chart transition (fade/slide)
- No full page reload

**Edge Case:**
- If r/ClaudeAI has no data for selected range, show empty state in charts with message "No data for r/ClaudeAI in this period"

---

### 4.4 Clicking a Day in Chart (Drill-Down)

**User Action:**
User clicks a data point on the Sentiment Chart (e.g., Oct 15).

**System Flow:**
1. Click detected on chart data point
2. Extract date from clicked point
3. API request: Fetch detailed posts/comments for Oct 15, current subreddit
4. DrillDownModal opens with animation (fade in + scale)
5. Modal header shows: "October 15, 2025 - r/ClaudeAI"
6. Summary shows: "42 posts/comments • Avg sentiment: +0.62"
7. Post list populates with top 10 posts (sorted by engagement)
8. Each PostCard shows:
   - Author, timestamp, subreddit
   - Post text (truncated to 200 chars)
   - Sentiment badge with score and confidence
   - Engagement metrics (score, comments)
   - "View on Reddit →" link
9. Modal body is scrollable if content exceeds viewport
10. User can scroll to view all posts
11. User clicks [X] or backdrop to close modal (fade out animation)

**Interaction Details:**
- Click outside modal (backdrop) to close
- ESC key closes modal
- Focus traps inside modal for accessibility
- Links to Reddit open in new tab

**Edge Case:**
- If day has no posts, show empty state: "No posts found for this day"
- If API fails, show error message in modal: "Failed to load details. Try again."

---

### 4.5 Viewing Sample Posts with Sentiment

**User Action:**
Within the drill-down modal, user reads individual post cards.

**System Flow:**
1. User scrolls through PostList
2. Each PostCard displays:
   - **Header:** u/username • 14:32 UTC • r/ClaudeAI
   - **Text:** Truncated post content (max 200 chars, with "..." if longer)
   - **Sentiment:** Badge with color coding (green/gray/red) + score + confidence
   - **Engagement:** "Score: 127 • 23 comments"
   - **Link:** "View on Reddit →"
3. User hovers over "View on Reddit →" link (underline appears)
4. User clicks link:
   - Opens Reddit post in new tab
   - Original tab remains on dashboard with modal still open
5. User returns to dashboard, closes modal

**Visual Feedback:**
- Sentiment badge uses color + text (not just color) for accessibility
- Confidence shown as percentage: "Confidence: 94%"
- External link icon next to "View on Reddit →" (optional)

---

### 4.6 Exporting CSV

**User Action:**
User clicks "CSV Export" button in header.

**System Flow:**
1. Click detected on CSV Export button
2. Generate CSV from current dashboard data:
   - Columns: Date, Subreddit, Sentiment, PostCount, PositivePercent, NegativePercent, TopKeywords
   - Rows: One per day in current time range and subreddit filter
3. Browser triggers file download: `claude-code-sentiment-{subreddit}-{range}d-{date}.csv`
4. Success toast notification: "CSV exported successfully"

**Alternate Flow (Export from Modal):**
1. User clicks "Export This Day as CSV" in DrillDownModal
2. Generate CSV with detailed post data for that day:
   - Columns: PostID, Author, Timestamp, Subreddit, Text, Sentiment, Confidence, Score, Comments, RedditURL
3. Download: `claude-code-sentiment-{date}-details.csv`

**Visual Feedback:**
- Button shows loading spinner during CSV generation (if slow)
- Toast notification on success/failure

---

### 4.7 Handling Loading States

**Scenario:** User switches from 30d to 90d, API is slow.

**System Flow:**
1. User clicks "90d"
2. Button shows active state immediately
3. Charts display semi-transparent overlay with spinner
4. API request in progress (2-5s)
5. Data arrives, overlay fades out, new charts render
6. If > 10s: Show timeout message, offer retry button

**Visual Design:**
- Overlay: White background, 70% opacity, centered spinner
- Spinner: Blue, 32px, smooth rotation
- Timeout message: "Taking longer than expected. [Retry]"

---

### 4.8 Handling API Quota Errors

**Scenario:** Reddit API rate limit hit, no fresh data available.

**System Flow:**
1. Dashboard attempts to fetch fresh data
2. API returns 429 (Too Many Requests)
3. System checks cache for last successful data
4. If cache exists (< 24 hours old):
   - Display cached data
   - Show warning banner at top: "API quota exceeded. Showing data from 2 hours ago. Next refresh at 16:00 UTC."
5. If no cache:
   - Show error state: "Unable to load data. API quota exceeded. Please try again later."
6. User can dismiss banner, dashboard remains functional with cached data
7. Export CSV still works with cached data

**Visual Feedback:**
- Warning banner: Yellow background, orange border, warning icon
- Timestamp on banner shows cache age
- Dashboard otherwise functions normally

---

## 5. Interaction Patterns

### 5.1 Hover States

**Chart Data Points:**
- **Default:** Data point is visible but subtle (small circle or bar)
- **Hover:**
  - Enlarge data point slightly (scale 1.2x)
  - Show tooltip with:
    - Date: "October 15, 2025"
    - Sentiment: "+0.62"
    - Volume: "42 posts"
  - Tooltip positioned above point, with 8px offset
  - Tooltip has white background, shadow, rounded corners
- **Cursor:** Pointer (to indicate clickable)

**Buttons:**
- **Default:** Defined color (see palette)
- **Hover:** Darken by 10% or show subtle shadow increase
- **Active (pressed):** Darken by 15%, scale 0.98x
- **Disabled:** 50% opacity, cursor: not-allowed

**Links:**
- **Default:** Blue text (#3B82F6), no underline
- **Hover:** Underline appears, slightly darker blue
- **Visited:** Same as default (no purple) for consistency

**PostCards in Modal:**
- **Default:** Gray-50 background
- **Hover:** Gray-100 background, subtle shadow increase

**Keyword Tags:**
- **Default:** Gray-100 background, dark gray text
- **Hover:** Blue-100 background, blue text (if clickable)

### 5.2 Click Interactions

**Chart Data Points:**
- **Action:** Click data point (or bar in volume chart)
- **Result:** Open DrillDownModal for that day
- **Feedback:** Brief scale animation (0.9x → 1x) on click
- **Debounce:** Prevent double-clicks (300ms)

**Tabs (SubredditTabs):**
- **Action:** Click tab
- **Result:** Switch active subreddit filter, fetch new data
- **Feedback:** Immediate visual active state, charts transition
- **Animation:** Underline slides to new tab (150ms ease-out)

**Time Range Buttons:**
- **Action:** Click time range (7d, 30d, 90d)
- **Result:** Update time range, fetch new data
- **Feedback:** Active state changes, charts update
- **Animation:** Button background color transitions (200ms)

**CSV Export:**
- **Action:** Click "CSV Export"
- **Result:** Trigger download
- **Feedback:** Button shows loading spinner for 0.5-2s, then success toast

**Modal Close:**
- **Action:** Click [X] button, backdrop, or press ESC
- **Result:** Close modal
- **Animation:** Fade out + scale to 0.95 (200ms)

**External Links (Reddit):**
- **Action:** Click "View on Reddit →"
- **Result:** Open Reddit post in new tab
- **Feedback:** Link momentarily highlights, new tab opens

### 5.3 Keyboard Navigation

**Tab Order:**
1. CSV Export button
2. Subreddit tabs (left to right)
3. Time range buttons (left to right)
4. Chart interactive areas (if focusable)
5. Keyword tags (if clickable)
6. Modal content (when open)

**Keyboard Shortcuts:**
- **Tab:** Move focus forward
- **Shift+Tab:** Move focus backward
- **Enter/Space:** Activate focused button/link
- **ESC:** Close modal (if open)
- **Arrow keys:** Navigate between tabs (when tab group focused)

**Focus Indicators:**
- **Style:** 2px blue outline (offset by 2px)
- **Visibility:** Always visible on keyboard focus (never suppress)

### 5.4 Touch Interactions (Mobile)

**Chart Interactions:**
- **Tap:** Select data point (same as click)
- **Long press:** Show tooltip (500ms hold)
- **Pan:** Scroll horizontally through chart (if zoomed)

**Modal:**
- **Swipe down:** Close modal (iOS-style gesture)
- **Tap backdrop:** Close modal

**Tabs:**
- **Swipe left/right:** Navigate between tabs (optional enhancement)
- **Tap:** Select tab (standard)

**Touch Target Sizes:**
- Minimum: 44x44px (Apple HIG, WCAG guideline)
- Preferred: 48x48px for critical actions

### 5.5 Loading & Skeleton States

**Strategy:**
- Show skeleton screens instead of spinners for initial load
- Use overlay spinners for inline updates (tab/time range changes)
- Maintain layout during loading (prevent content shift)

**Skeleton Design:**
- Gray rectangles with rounded corners (matching real components)
- Shimmer animation: Linear gradient sweeping left to right (2s loop)
- Opacity: 0.6 for skeleton elements

**Transition:**
- Fade out skeleton (200ms)
- Fade in real content (300ms, with slight delay)

### 5.6 Error States

**Inline Errors (Banner):**
- Positioned at top of MainContent
- Dismissible (X button)
- Auto-dismiss after 10s (for non-critical warnings)
- Persistent (no auto-dismiss) for critical errors

**Modal Errors:**
- Show error message in modal body
- Provide [Retry] button
- Do not auto-dismiss (user must close modal)

**Toast Notifications:**
- For transient feedback (CSV export success)
- Position: Bottom-right corner
- Auto-dismiss: 3s
- Style: Small card with message + icon

---

## 6. Accessibility Considerations

### 6.1 Color Contrast

**Text Contrast (WCAG AA):**
- Primary text (#111827) on white: 16.3:1 ✓
- Secondary text (#6B7280) on white: 4.7:1 ✓
- Disabled text (#9CA3AF) on white: 3.1:1 (large text only)

**Data Visualization Contrast:**
- Sentiment positive (#10B981) on white background: 3.4:1 (pass for large text/UI elements)
- Sentiment negative (#EF4444) on white background: 4.0:1 ✓
- Chart lines (#3B82F6) on gray-50 background: 4.5:1 ✓

**Adjustments for Colorblindness:**
- Do not rely on color alone to convey sentiment
- Use labels: "Positive", "Negative", "Neutral" alongside color
- Consider patterns/textures for chart lines (optional: dashed for negative, solid for positive)
- Test with colorblind simulators (Deuteranopia, Protanopia)

### 6.2 Keyboard Navigation

**Focus Management:**
- All interactive elements must be focusable (buttons, links, tabs)
- Logical tab order (top to bottom, left to right)
- Focus visible at all times (never :focus { outline: none } without alternative)
- Skip to main content link (optional, for assistive tech users)

**Modal Focus Trapping:**
- When modal opens, focus moves to modal close button or first interactive element
- Tab key cycles within modal only (does not escape to background)
- ESC key closes modal, returns focus to trigger element

**Keyboard Shortcuts:**
- Arrow keys for tab navigation (when tab group focused)
- Enter/Space to activate buttons
- ESC to close modals/dropdowns

### 6.3 Screen Reader Considerations

**Semantic HTML:**
- Use `<header>`, `<main>`, `<nav>`, `<section>` for structure
- Use `<button>` for clickable actions (not `<div onClick>`)
- Use `<a>` for links (not `<button>`)

**ARIA Labels:**
```html
<button aria-label="Export data as CSV">CSV Export</button>

<div role="tablist" aria-label="Subreddit filter">
  <button role="tab" aria-selected="true">All</button>
  <button role="tab" aria-selected="false">r/ClaudeAI</button>
</div>

<div role="group" aria-label="Time range selector">
  <button aria-pressed="true">7d</button>
  <button aria-pressed="false">30d</button>
  <button aria-pressed="false">90d</button>
</div>

<div role="dialog" aria-labelledby="modal-title" aria-modal="true">
  <h2 id="modal-title">October 15, 2025 - r/ClaudeAI</h2>
  ...
</div>
```

**Chart Accessibility:**
- Provide text alternative for charts (summary below chart or hidden description)
- Example: `<div aria-label="Sentiment trend chart showing positive sentiment spike on Oct 15">`
- Consider data table fallback (hidden, for screen readers) with same data
- Use `role="img"` for decorative charts, or `role="region"` for interactive charts

**Live Regions (for Dynamic Updates):**
```html
<div aria-live="polite" aria-atomic="true">
  <!-- Announce when data loads: "Data updated for last 90 days" -->
</div>
```

### 6.4 Motion & Animation

**Reduced Motion Preference:**
- Respect `prefers-reduced-motion: reduce` media query
- Disable chart animations, modal transitions for users who prefer reduced motion
- Keep functional animations (loading spinners) but simplify

**Implementation:**
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 6.5 Responsive Text & Zoom

**Text Scaling:**
- Support browser zoom up to 200% without breaking layout
- Use relative units (rem, em) instead of px for text
- Avoid fixed widths that truncate text when zoomed

**Responsive Font Sizes:**
- Allow text to reflow on smaller screens
- Avoid horizontal scrolling

### 6.6 Form & Input Accessibility

**Buttons:**
- Clear labels (not just icons)
- Disabled state clearly indicated (visual + aria-disabled)

**Links:**
- Descriptive text ("View on Reddit" vs "Click here")
- External link indication (icon or text: "(opens in new tab)")

**Error Messages:**
- Associate errors with inputs via `aria-describedby`
- Clear, actionable error text ("API quota exceeded. Try again at 16:00 UTC.")

---

## Appendix: Design Decisions & Rationale

### Why Tabs Over Dropdown for Subreddit Filter?
- **Visibility:** All options visible at once (no hidden menu)
- **Speed:** One click to switch (vs two clicks for dropdown)
- **Scannability:** Easier to compare active vs inactive states

### Why Segmented Control for Time Range?
- **Mutual exclusivity:** Only one time range active at a time
- **Visual clarity:** Clearly shows selected state
- **Standard pattern:** Familiar to users from iOS and modern web apps

### Why Line Chart for Sentiment?
- **Trend visualization:** Line charts excel at showing change over time
- **Continuity:** Sentiment is a continuous metric (-1 to +1)
- **Comparison:** Easy to spot spikes, dips, patterns

### Why Bar Chart for Volume?
- **Discrete counts:** Volume is discrete (integer post counts)
- **Emphasis:** Bars emphasize magnitude differences
- **Readability:** Easier to compare exact values than line chart

### Why Tag Cloud for Keywords?
- **At-a-glance:** Quickly see dominant topics
- **Visual hierarchy:** Size conveys frequency without reading numbers
- **Familiar pattern:** Users understand tag clouds intuitively

### Why Modal for Drill-Down (vs Inline Expansion)?
- **Focus:** Modal removes distractions, focuses on selected day
- **Detail space:** More room for detailed post cards
- **Scroll preservation:** Main dashboard scroll position preserved when returning

### Why Show Last Data on API Quota Error?
- **User respect:** Don't punish users for our rate limit
- **Utility:** Stale data is better than no data (for trend analysis)
- **Transparency:** Clearly label data age, don't deceive users

---

## Design Deliverable Complete

This design specification provides:
1. **Visual direction** with color palette, typography, spacing system
2. **Detailed wireframes** for all key states (desktop, mobile, loading, error, empty)
3. **Component hierarchy** with props, structure, and styling notes
4. **User flows** for all major interactions
5. **Interaction patterns** for hover, click, keyboard, touch
6. **Accessibility guidelines** for WCAG AA compliance

**Output File:**
`.claude/outputs/design/agents/ui-designer/claude-code-sentiment-monitor-reddit-20251002-231759/design-specification.md`

**Next Steps for Development:**
1. Set up Next.js 15 project with Tailwind CSS
2. Implement component library (buttons, cards, modals)
3. Integrate charting library (Recharts recommended)
4. Build dashboard shell and layout
5. Wire up API data fetching (React Query/SWR)
6. Implement responsive breakpoints
7. Add accessibility testing (axe-core, manual keyboard testing)

**Design Assets to Create (Future):**
- High-fidelity mockups (Figma/Sketch)
- Interactive prototype
- Icon set (CSV export, external link, sentiment indicators)
- Logo/branding for header (if needed)

This specification is ready for developer handoff and implementation.
