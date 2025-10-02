# Claude Code Sentiment Monitor - UI/UX Design Specification

**Project:** Claude Code Sentiment Monitor (Reddit)
**Version:** 1.0
**Date:** 2025-10-02
**Designer:** UI Designer Agent

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Design Philosophy](#design-philosophy)
3. [Wireframes](#wireframes)
4. [Component Hierarchy](#component-hierarchy)
5. [User Flows](#user-flows)
6. [Color Scheme & Visual Style](#color-scheme--visual-style)
7. [Typography & Visual Hierarchy](#typography--visual-hierarchy)
8. [Responsive Behavior](#responsive-behavior)
9. [Accessibility Considerations](#accessibility-considerations)
10. [Interaction Design Patterns](#interaction-design-patterns)

---

## Executive Summary

The Claude Code Sentiment Monitor is a professional data analytics dashboard designed for product leads, marketers, and community managers to track Reddit sentiment trends. The design prioritizes clarity, data density, and trust through a clean, analytics-focused visual language inspired by professional data tools like Grafana, Datadog, and modern BI platforms.

**Key Design Decisions:**
- **Analytics-first color palette**: Slate grays with data-visualization accent colors (teal, amber, coral)
- **High information density**: Maximize chart visibility and data comprehension
- **Professional aesthetic**: Clean, minimal, trustworthy design language
- **Sentiment-coded visualization**: Consistent color mapping for positive/neutral/negative data

---

## Design Philosophy

### Core Principles

1. **Data Clarity First**: Every design choice serves data comprehension
2. **Professional Trust**: Visual language communicates reliability and accuracy
3. **Minimal Distraction**: UI elements support but never compete with data
4. **Accessible by Default**: WCAG AA compliance with excellent readability
5. **Responsive Data**: Charts and tables adapt gracefully to viewport sizes

### Design Tone

- **Professional, not playful**: Serious tool for business intelligence
- **Clean, not sparse**: Efficient use of space with appropriate density
- **Modern, not trendy**: Timeless data visualization patterns
- **Trustworthy, not flashy**: Subdued colors, clear typography, honest presentation

---

## Wireframes

### 1. Main Dashboard Layout (Desktop)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │  HEADER                                                                  │ │
│ │  Claude Code Sentiment Monitor                    [Export CSV] [Refresh]│ │
│ │  Reddit Activity Tracker                          Last updated: 2m ago  │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │  CONTROLS BAR                                                            │ │
│ │  ┌─────────────────────────────────────┐  ┌─────────────────────────┐  │ │
│ │  │ [ r/ClaudeAI ] [ r/ClaudeCode ]     │  │ [ 7d ] [ 30d ] [ 90d ]  │  │ │
│ │  │ [ r/Anthropic ] [ All Combined ]    │  │                         │  │ │
│ │  └─────────────────────────────────────┘  └─────────────────────────┘  │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │  SUMMARY METRICS (4-column grid)                                         │ │
│ │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐        │ │
│ │  │ Avg Sent.  │  │ Total Vol. │  │ Positive   │  │ Negative   │        │ │
│ │  │   +0.42    │  │   1,247    │  │   62.3%    │  │   14.5%    │        │ │
│ │  │  ↑ +8.2%   │  │  ↓ -3.1%   │  │  ↑ +4.2%   │  │  ↓ -2.1%   │        │ │
│ │  └────────────┘  └────────────┘  └────────────┘  └────────────┘        │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │  SENTIMENT TREND CHART                                                   │ │
│ │  ┌─────────────────────────────────────────────────────────────────┐    │ │
│ │  │ Sentiment Score Over Time                                        │    │ │
│ │  │                                                                   │    │ │
│ │  │ +1.0 ┤                                   ╭──╮                     │    │ │
│ │  │      │                          ╭────╮   │  ╰─╮                   │    │ │
│ │  │ +0.5 ┤              ╭───────╮   │    ╰───╯    ╰─╮                │    │ │
│ │  │  0.0 ┼──────────────────────────────────────────────────────────│    │ │
│ │  │ -0.5 ┤                                                           │    │ │
│ │  │ -1.0 ┤                                                           │    │ │
│ │  │      └───────────────────────────────────────────────────────── │    │ │
│ │  │       Sep 1    Sep 15    Sep 30    Oct 15    Oct 30             │    │ │
│ │  └─────────────────────────────────────────────────────────────────┘    │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │  VOLUME CHART                                                            │ │
│ │  ┌─────────────────────────────────────────────────────────────────┐    │ │
│ │  │ Discussion Volume (Posts + Comments)                             │    │ │
│ │  │                                                                   │    │ │
│ │  │ 200 ┤     ┌─┐     ┌─┐                       ┌──┐                │    │ │
│ │  │ 150 ┤  ┌─┐│ │  ┌─┐│ │   ┌─┐              ┌─┐│  │                │    │ │
│ │  │ 100 ┤  │ ││ │  │ ││ │┌─┐│ │  ┌─┐      ┌─┐│ ││  │┌─┐             │    │ │
│ │  │  50 ┤┌─┘ └┘ └──┘ └┘ ││ └┘ └──┘ └──────┘ └┘ └──┘│ │             │    │ │
│ │  │   0 ┴────────────────────────────────────────────────────────── │    │ │
│ │  │      Sep 1    Sep 15    Sep 30    Oct 15    Oct 30              │    │ │
│ │  └─────────────────────────────────────────────────────────────────┘    │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │  KEYWORD INSIGHTS (2-column layout)                                      │ │
│ │  ┌─────────────────────────────┐  ┌───────────────────────────────────┐ │ │
│ │  │ Top Keywords (90 days)      │  │ Trending This Week                │ │ │
│ │  │                             │  │                                   │ │ │
│ │  │  cursor   ████████████ 842  │  │  bug fix   ███████████ +127%     │ │ │
│ │  │  MCP      ██████████   634  │  │  API       █████████   +89%      │ │ │
│ │  │  agent    ████████     512  │  │  cursor    ███████     +56%      │ │ │
│ │  │  bug      ██████       387  │  │  speed     ████        +34%      │ │ │
│ │  │  API      █████        298  │  │  context   ███         +21%      │ │ │
│ │  │  update   ████         245  │  │                                   │ │ │
│ │  └─────────────────────────────┘  └───────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2. Subreddit Tab System

```
┌─────────────────────────────────────────────────────────────────────┐
│  SUBREDDIT TABS (Pill-style navigation)                             │
│  ┌───────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────────┐  │
│  │r/ClaudeAI │ │ r/ClaudeCode│ │ r/Anthropic │ │ All Combined  │  │
│  │  (Active) │ │             │ │             │ │               │  │
│  │   1,247   │ │     824     │ │     591     │ │    2,662      │  │
│  └───────────┘ └─────────────┘ └─────────────┘ └───────────────┘  │
│                                                                     │
│  Active tab: Solid background with border accent                   │
│  Inactive tabs: Transparent with hover state                       │
│  Badge count: Total items in time range                            │
└─────────────────────────────────────────────────────────────────────┘
```

### 3. Time Range Selector

```
┌─────────────────────────────────────────────┐
│  TIME RANGE SELECTOR (Segmented control)    │
│  ┌─────────┬─────────┬─────────┐            │
│  │   7d    │   30d   │   90d   │            │
│  │         │ (Active)│         │            │
│  └─────────┴─────────┴─────────┘            │
│                                             │
│  Active: Filled background                 │
│  Inactive: Transparent with border         │
│  Smooth transition animation on change     │
└─────────────────────────────────────────────┘
```

### 4. Drill-Down Detail View (Modal/Panel)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Daily Detail View - September 24, 2025                            [✕ Close] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │  DAY SUMMARY                                                             │ │
│ │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐        │ │
│ │  │ Sentiment  │  │ Volume     │  │ Positive   │  │ Negative   │        │ │
│ │  │   +0.64    │  │    147     │  │   71.4%    │  │    9.5%    │        │ │
│ │  └────────────┘  └────────────┘  └────────────┘  └────────────┘        │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │  SAMPLE POSTS & COMMENTS (Paginated list)                [Sort: Score ▼]│ │
│ │  ┌─────────────────────────────────────────────────────────────────────┐│ │
│ │  │ ● r/ClaudeAI • u/developer_jane • 12:34 PM            Score: 84     ││ │
│ │  │                                                                      ││ │
│ │  │ "Just tried the new Claude Code cursor integration - absolutely... "││ │
│ │  │                                                                      ││ │
│ │  │ Sentiment: Positive (+0.87) • Confidence: 94%    [View on Reddit →]││ │
│ │  └─────────────────────────────────────────────────────────────────────┘│ │
│ │                                                                          │ │
│ │  ┌─────────────────────────────────────────────────────────────────────┐│ │
│ │  │ ● r/ClaudeCode • u/product_dev • 2:15 PM            Score: 42       ││ │
│ │  │                                                                      ││ │
│ │  │ "Has anyone else noticed the MCP agent feature is..."              ││ │
│ │  │                                                                      ││ │
│ │  │ Sentiment: Neutral (0.12) • Confidence: 78%      [View on Reddit →]││ │
│ │  └─────────────────────────────────────────────────────────────────────┘│ │
│ │                                                                          │ │
│ │  ┌─────────────────────────────────────────────────────────────────────┐│ │
│ │  │ ● r/Anthropic • u/frustrated_user • 4:42 PM        Score: 12        ││ │
│ │  │                                                                      ││ │
│ │  │ "Claude Code keeps timing out when I try to..."                     ││ │
│ │  │                                                                      ││ │
│ │  │ Sentiment: Negative (-0.63) • Confidence: 91%    [View on Reddit →]││ │
│ │  └─────────────────────────────────────────────────────────────────────┘│ │
│ │                                                                          │ │
│ │  [Load More]                                          Showing 1-10 of 147│ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5. CSV Export Button

```
┌─────────────────────────────────────────────┐
│  EXPORT CONTROLS (Header right)             │
│  ┌──────────────┐  ┌──────────┐             │
│  │ Export CSV ↓ │  │ Refresh ⟳│             │
│  └──────────────┘  └──────────┘             │
│                                             │
│  On click: Download prompt                 │
│  Format: sentiment-monitor-[date].csv      │
└─────────────────────────────────────────────┘
```

### 6. Mobile Layout (< 768px)

```
┌───────────────────────────┐
│ ┌───────────────────────┐ │
│ │  HEADER               │ │
│ │  Claude Code Monitor  │ │
│ │  [☰ Menu]             │ │
│ └───────────────────────┘ │
│                           │
│ ┌───────────────────────┐ │
│ │  SUBREDDIT DROPDOWN   │ │
│ │  [ All Combined  ▼ ]  │ │
│ └───────────────────────┘ │
│                           │
│ ┌───────────────────────┐ │
│ │  TIME RANGE (Stack)   │ │
│ │  ┌─────┐ ┌─────┐      │ │
│ │  │ 7d  │ │ 30d │      │ │
│ │  └─────┘ └─────┘      │ │
│ │      ┌─────┐          │ │
│ │      │ 90d │          │ │
│ │      └─────┘          │ │
│ └───────────────────────┘ │
│                           │
│ ┌───────────────────────┐ │
│ │  METRICS (2x2)        │ │
│ │  ┌─────┐ ┌─────┐      │ │
│ │  │Sent.│ │ Vol.│      │ │
│ │  └─────┘ └─────┘      │ │
│ │  ┌─────┐ ┌─────┐      │ │
│ │  │ Pos │ │ Neg │      │ │
│ │  └─────┘ └─────┘      │ │
│ └───────────────────────┘ │
│                           │
│ ┌───────────────────────┐ │
│ │  SENTIMENT CHART      │ │
│ │  (Full width)         │ │
│ │  [Touch-enabled]      │ │
│ └───────────────────────┘ │
│                           │
│ ┌───────────────────────┐ │
│ │  VOLUME CHART         │ │
│ │  (Full width)         │ │
│ └───────────────────────┘ │
│                           │
│ ┌───────────────────────┐ │
│ │  KEYWORDS (Stacked)   │ │
│ │  Top Keywords         │ │
│ │  Trending This Week   │ │
│ └───────────────────────┘ │
│                           │
└───────────────────────────┘
```

---

## Component Hierarchy

### React Component Structure

```
App
├── DashboardLayout
│   ├── Header
│   │   ├── AppTitle
│   │   ├── LastUpdatedIndicator
│   │   └── ActionButtons
│   │       ├── ExportButton
│   │       └── RefreshButton
│   │
│   ├── ControlsBar
│   │   ├── SubredditTabs
│   │   │   └── SubredditTab (x4)
│   │   └── TimeRangeSelector
│   │       └── TimeRangeButton (x3)
│   │
│   ├── SummaryMetrics
│   │   └── MetricCard (x4)
│   │       ├── MetricValue
│   │       ├── MetricLabel
│   │       └── TrendIndicator
│   │
│   ├── ChartsSection
│   │   ├── SentimentChart
│   │   │   ├── ChartHeader
│   │   │   ├── LineChart (recharts/chart.js)
│   │   │   └── ChartTooltip
│   │   │
│   │   └── VolumeChart
│   │       ├── ChartHeader
│   │       ├── BarChart (recharts/chart.js)
│   │       └── ChartTooltip
│   │
│   └── KeywordInsights
│       ├── TopKeywordsPanel
│       │   ├── PanelHeader
│       │   └── KeywordBar (x6-10)
│       │
│       └── TrendingKeywordsPanel
│           ├── PanelHeader
│           └── TrendingKeywordItem (x5-8)
│
└── DrillDownModal
    ├── ModalHeader
    │   ├── DayTitle
    │   └── CloseButton
    │
    ├── DaySummary
    │   └── MetricCard (x4)
    │
    └── SampleList
        ├── ListControls
        │   └── SortDropdown
        │
        ├── SampleCard (repeated)
        │   ├── SampleMeta
        │   │   ├── SubredditBadge
        │   │   ├── Username
        │   │   ├── Timestamp
        │   │   └── Score
        │   │
        │   ├── SampleContent
        │   │   └── ContentPreview
        │   │
        │   └── SampleFooter
        │       ├── SentimentIndicator
        │       ├── ConfidenceScore
        │       └── RedditLink
        │
        └── Pagination
            └── LoadMoreButton
```

### Component Responsibilities

**DashboardLayout**
- Container for entire dashboard
- Manages grid layout and spacing
- Responsive breakpoint handling

**Header**
- App branding and title
- Global actions (export, refresh)
- Last updated timestamp

**ControlsBar**
- Subreddit filter state management
- Time range selection
- Triggers data refetch on change

**SummaryMetrics**
- Displays 4 key metrics
- Calculates trend percentages
- Color-coded positive/negative trends

**ChartsSection**
- Renders sentiment line chart
- Renders volume bar chart
- Interactive tooltips on hover
- Click handler for drill-down

**KeywordInsights**
- Top keywords by frequency
- Trending keywords by growth rate
- Visual bar representations

**DrillDownModal**
- Modal overlay for day details
- Fetches and displays sample posts
- Pagination for large datasets
- Links to Reddit source

---

## User Flows

### Flow 1: Initial Page Load → View Default Dashboard

```
User visits URL
    ↓
App loads with default state:
  - Subreddit: "All Combined"
  - Time range: "30 days"
    ↓
API fetches aggregated data
    ↓
Dashboard renders:
  - Summary metrics animate in
  - Charts draw with smooth animation
  - Keywords populate
    ↓
User sees complete dashboard (< 2s load time)
```

**Interaction Details:**
- Loading state: Skeleton loaders for charts and metrics
- Error state: Friendly error message with retry button
- Empty state: "No data available for this period"

---

### Flow 2: Switch Subreddit Tab → Update Charts

```
User clicks different subreddit tab
    ↓
Tab visual state changes immediately
    ↓
Charts show loading overlay
    ↓
API fetches filtered data for selected subreddit
    ↓
Charts animate transition to new data
    ↓
Summary metrics update with new calculations
    ↓
Keywords refresh for subreddit context
```

**Interaction Details:**
- Active tab: Highlighted background, border accent
- Transition: 300ms ease-in-out animation
- Data persistence: Previous view cached for quick back-navigation
- URL update: Query parameter reflects selection (shareable links)

---

### Flow 3: Change Time Range → Refresh Data

```
User clicks time range button (7d/30d/90d)
    ↓
Button state updates immediately
    ↓
Loading indicators appear on charts
    ↓
API fetches data for new time window
    ↓
Charts re-render with adjusted time axis
    ↓
Summary metrics recalculate
    ↓
Keywords update for new timeframe
```

**Interaction Details:**
- Segmented control: One active at a time
- Loading: Subtle spinner on metric cards
- Animation: Chart data transitions smoothly
- Context preservation: Subreddit selection maintained

---

### Flow 4: Click Day in Chart → Drill-Down to Samples

```
User hovers over chart point
    ↓
Tooltip shows: Date, sentiment score, volume
    ↓
User clicks chart point
    ↓
Modal opens with fade-in animation
    ↓
Day summary loads (sentiment, volume, breakdown)
    ↓
Sample posts/comments load (first 10)
    ↓
User can scroll, load more, or sort
```

**Interaction Details:**
- Click target: Chart point or bar (large touch target on mobile)
- Modal: Center-screen overlay, dark backdrop
- Keyboard: ESC to close, TAB navigation through samples
- Deep linking: Modal state reflected in URL hash

---

### Flow 5: View Sample Details → Jump to Reddit

```
User sees sample in drill-down modal
    ↓
Reads preview text (truncated to 200 chars)
    ↓
Reviews sentiment score and confidence
    ↓
Clicks "View on Reddit →" link
    ↓
New tab opens to Reddit post/comment
    ↓
User returns to dashboard (state preserved)
```

**Interaction Details:**
- Link icon: External link indicator
- Target: Opens in new tab (target="_blank")
- URL format: Direct link to comment/post on Reddit
- Tracking: Optional analytics event for outbound clicks

---

### Flow 6: Export to CSV Workflow

```
User clicks "Export CSV" button
    ↓
Dropdown menu appears with options:
  - Current view (filtered)
  - All subreddits
  - Full 90-day dataset
    ↓
User selects export scope
    ↓
Browser downloads CSV file
    ↓
Filename: sentiment-monitor-[subreddit]-[range]-[date].csv
    ↓
Success toast notification appears
```

**Interaction Details:**
- Button: Secondary action style in header
- CSV format: Headers, UTF-8 encoding, comma-separated
- Columns: Date, Subreddit, Sentiment, Volume, Pos%, Neu%, Neg%, Top Keywords
- Feedback: "Download started" toast message

---

## Color Scheme & Visual Style

### Design Rationale

**Application Context:**
- Professional analytics dashboard for business intelligence
- Data visualization with charts, trends, and metrics
- Target audience: Product leads, marketers, community managers
- Must convey: Trust, accuracy, clarity, professionalism

**Color Philosophy:**
- **NOT purple/blue AI gradients** (overused, not appropriate for data tools)
- **Analytics-appropriate palette**: Slate grays for neutrality and focus
- **Data-visualization accents**: Teal (positive), amber (neutral), coral (negative)
- **High contrast**: Ensures readability and WCAG AA compliance
- **Minimal distraction**: UI recedes, data shines

---

### Color Palette Specifications

#### Background Colors

**Dark Mode (Primary)**
```
Main Background: #0f1419 (slate-950 variant)
Rationale: Deep charcoal provides excellent contrast for charts without eye strain.
Softer than pure black, professional tone for extended dashboard viewing.

Panel Background: #1a1f26 (elevated surfaces)
Rationale: Subtle elevation for cards, modals, and grouped content.
Maintains visual hierarchy without harsh borders.

Subtle Borders: #2d3748 (slate-700)
Rationale: Gentle separation between sections without visual noise.
```

**Light Mode (Secondary)**
```
Main Background: #f8fafc (slate-50)
Rationale: Soft white with slight blue tint for reduced glare.
Professional appearance for presentations and reports.

Panel Background: #ffffff (pure white)
Rationale: Clean elevated surfaces for metric cards and modals.

Subtle Borders: #e2e8f0 (slate-200)
Rationale: Light gray borders for gentle content separation.
```

---

#### Text Colors

**Dark Mode**
```
Primary Text: #f1f5f9 (slate-100)
Contrast Ratio: 13.5:1 on #0f1419 background
WCAG Compliance: AAA
Usage: Headings, key metrics, important labels

Secondary Text: #94a3b8 (slate-400)
Contrast Ratio: 7.2:1 on #0f1419 background
WCAG Compliance: AAA
Usage: Descriptions, timestamps, metadata

Tertiary Text: #64748b (slate-500)
Contrast Ratio: 4.8:1 on #0f1419 background
WCAG Compliance: AA
Usage: Placeholder text, disabled states
```

**Light Mode**
```
Primary Text: #1e293b (slate-800)
Contrast Ratio: 12.6:1 on #ffffff background
WCAG Compliance: AAA

Secondary Text: #475569 (slate-600)
Contrast Ratio: 7.9:1 on #ffffff background
WCAG Compliance: AAA

Tertiary Text: #64748b (slate-500)
Contrast Ratio: 5.1:1 on #ffffff background
WCAG Compliance: AA
```

---

#### Sentiment Color Coding

**Positive Sentiment**
```
Color: #14b8a6 (teal-500)
Rationale: Teal conveys positivity without aggressive green.
Professional tone suitable for business dashboards.
Associated with growth, clarity, and forward momentum.

Dark Mode Variant: #2dd4bf (teal-400)
Light Mode Variant: #0d9488 (teal-600)

Usage:
- Positive sentiment indicators
- Upward trend arrows
- Positive metric cards
- Chart lines/areas for positive data
```

**Neutral Sentiment**
```
Color: #f59e0b (amber-500)
Rationale: Amber indicates caution and neutrality.
Distinct from both positive (teal) and negative (coral).
Easily distinguishable in charts and visualizations.

Dark Mode Variant: #fbbf24 (amber-400)
Light Mode Variant: #d97706 (amber-600)

Usage:
- Neutral sentiment indicators
- Stable trend indicators (no significant change)
- Warning states (non-critical)
```

**Negative Sentiment**
```
Color: #f87171 (red-400/coral)
Rationale: Soft coral-red signals negative without alarm.
Less aggressive than pure red, maintains professional tone.
Clear signal for attention-needed areas.

Dark Mode Variant: #fca5a5 (red-300)
Light Mode Variant: #dc2626 (red-600)

Usage:
- Negative sentiment indicators
- Downward trend arrows
- Negative metric cards
- Chart lines/areas for negative data
```

---

#### Accent & Interactive Colors

**Primary Accent (Interactive Elements)**
```
Color: #0ea5e9 (sky-500)
Rationale: Sky blue for buttons and links.
Professional, trustworthy, distinct from sentiment colors.
Excellent visibility on both dark and light backgrounds.

Dark Mode: #38bdf8 (sky-400)
Light Mode: #0284c7 (sky-600)

Hover State Dark: #7dd3fc (sky-300)
Hover State Light: #0369a1 (sky-700)

Usage:
- Primary buttons
- Active tab indicators
- Interactive chart elements
- Links and navigation
```

**Secondary Accent (Borders, Focus States)**
```
Color: #6366f1 (indigo-500)
Rationale: Indigo for focus rings and selection states.
Distinct from primary accent, high visibility.

Focus Ring: #6366f1 with 3px width and 40% opacity
Usage: Keyboard navigation, form inputs, accessible focus indicators
```

---

#### Chart-Specific Colors

**Multi-Line Chart Palette** (when comparing multiple subreddits)
```
Line 1 (r/ClaudeAI):   #3b82f6 (blue-500)
Line 2 (r/ClaudeCode): #8b5cf6 (violet-500)
Line 3 (r/Anthropic):  #ec4899 (pink-500)
Line 4 (All Combined): #14b8a6 (teal-500)

Rationale: Distinct hues with equal visual weight.
Colorblind-friendly palette with shape markers as backup.
Professional data visualization standard.
```

**Bar Chart Colors**
```
Volume Bars: #0ea5e9 (sky-500) with 80% opacity
Hover State: #0ea5e9 at 100% opacity with subtle glow

Rationale: Single-color bars maintain focus on volume magnitude.
Opacity variation provides depth without distraction.
```

---

### Visual Style Guidelines

#### Shadows & Elevation

```
Card Shadow (Dark Mode):
box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3),
            0 2px 4px -1px rgba(0, 0, 0, 0.2);

Card Shadow (Light Mode):
box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
            0 2px 4px -1px rgba(0, 0, 0, 0.06);

Modal Shadow:
box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.4),
            0 10px 10px -5px rgba(0, 0, 0, 0.3);
```

#### Border Radius

```
Small (buttons, badges): 6px
Medium (cards, panels): 8px
Large (modals): 12px
Charts: 4px (subtle rounding)
```

#### Spacing Scale

```
xs: 4px   (tight spacing, inline elements)
sm: 8px   (compact sections)
md: 16px  (standard card padding)
lg: 24px  (section separation)
xl: 32px  (major layout gaps)
2xl: 48px (page-level margins)
```

---

## Typography & Visual Hierarchy

### Font System

**Font Family**
```
Primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
Monospace (data): 'JetBrains Mono', 'Courier New', monospace

Rationale:
- Inter: Professional, highly legible, excellent for dashboards
- System fonts as fallbacks for performance
- Monospace for numeric data ensures alignment
```

### Type Scale

**Headings**
```
H1 (Page Title):
  Size: 28px (1.75rem)
  Weight: 700 (bold)
  Line Height: 1.2
  Color: Primary text
  Usage: "Claude Code Sentiment Monitor"

H2 (Section Headings):
  Size: 20px (1.25rem)
  Weight: 600 (semibold)
  Line Height: 1.3
  Color: Primary text
  Usage: Chart titles, panel headers

H3 (Subsection):
  Size: 16px (1rem)
  Weight: 600 (semibold)
  Line Height: 1.4
  Color: Primary text
  Usage: Metric labels, modal headers
```

**Body Text**
```
Body Large:
  Size: 16px (1rem)
  Weight: 400 (regular)
  Line Height: 1.5
  Usage: Sample content previews, descriptions

Body Regular:
  Size: 14px (0.875rem)
  Weight: 400 (regular)
  Line Height: 1.5
  Usage: General UI text, labels

Body Small:
  Size: 12px (0.75rem)
  Weight: 400 (regular)
  Line Height: 1.4
  Usage: Metadata, timestamps, footnotes
```

**Data Display**
```
Metric Value (Large):
  Size: 36px (2.25rem)
  Weight: 700 (bold)
  Font: Monospace
  Usage: Summary metric cards

Metric Value (Small):
  Size: 24px (1.5rem)
  Weight: 600 (semibold)
  Font: Monospace
  Usage: Chart tooltips, inline metrics

Chart Axis Labels:
  Size: 11px (0.6875rem)
  Weight: 500 (medium)
  Font: Primary
  Color: Secondary text
```

---

### Visual Hierarchy Patterns

**Metric Cards**
```
┌────────────────────┐
│ Label (Secondary)  │ ← 12px, weight 500, uppercase
│ Value (Primary)    │ ← 36px, weight 700, monospace
│ Trend (Accent)     │ ← 14px, weight 600, colored
└────────────────────┘
```

**Chart Headers**
```
Chart Title (Primary) ← 20px, weight 600
Time Range (Secondary) ← 14px, weight 400, right-aligned
```

**Sample Cards**
```
Metadata Row (Secondary) ← 12px, weight 500
Content Preview (Primary) ← 16px, weight 400, line-clamp
Sentiment Footer (Mixed) ← 14px, colored by sentiment
```

---

## Responsive Behavior

### Breakpoint Strategy

```
Mobile:  < 768px  (Single column, stacked layout)
Tablet:  768px - 1024px (2-column hybrid)
Desktop: > 1024px (Full multi-column layout)
Wide:    > 1440px (Optimized for large monitors)
```

---

### Desktop Layout (> 1024px)

**Grid Structure**
```
Container: max-width 1400px, centered
Columns: 12-column grid system
Gaps: 24px horizontal, 32px vertical

Summary Metrics: 4 columns (3 col each)
Charts: Full-width (12 col)
Keywords: 2 panels (6 col each)
```

**Chart Dimensions**
```
Sentiment Chart Height: 320px
Volume Chart Height: 280px
Chart Width: 100% of container
```

---

### Tablet Layout (768px - 1024px)

**Grid Structure**
```
Container: max-width 960px
Columns: 8-column grid

Summary Metrics: 2x2 grid (4 col each)
Charts: Full-width (8 col)
Keywords: Stacked (8 col each)
```

**Adjustments**
```
- Subreddit tabs: Scrollable horizontal if needed
- Chart heights: Maintained (320px, 280px)
- Keyword bars: Slightly compressed
```

---

### Mobile Layout (< 768px)

**Grid Structure**
```
Container: 100% width with 16px side padding
Layout: Single column stack

Subreddit Tabs → Dropdown select
Time Range → 3-button stack or segmented control
Summary Metrics → 2x2 grid
Charts → Full-width, touch-enabled
Keywords → Stacked, top 5 only
```

**Adjustments**
```
Chart Heights:
  Sentiment: 240px
  Volume: 200px

Touch Targets:
  Minimum: 44x44px (iOS/Android standard)
  Spacing: 8px between interactive elements

Typography:
  H1: 24px (reduced from 28px)
  Metric Values: 28px (reduced from 36px)
  Body: 14px (maintained)
```

**Mobile Interactions**
```
- Swipe between subreddit tabs (if using tab UI)
- Pinch-to-zoom disabled on charts (native tooltips instead)
- Long-press on chart point for drill-down
- Bottom sheet modal for day details (instead of center modal)
- Sticky header with controls on scroll
```

---

### Responsive Chart Behavior

**Desktop**
- Hover tooltips with crosshair
- Click to drill down
- Smooth animations (300ms)

**Tablet**
- Touch tooltips (tap and hold)
- Larger touch targets on data points
- Simplified animations

**Mobile**
- Tap for tooltip, tap again to drill down
- Simplified chart legends (icons only)
- Reduced animation complexity
- Horizontal scroll for wide date ranges (with scroll indicator)

---

## Accessibility Considerations

### WCAG AA Compliance Plan

#### Color Contrast

**Minimum Ratios**
```
Normal Text: 4.5:1
Large Text (18px+): 3:1
Interactive Elements: 3:1 against adjacent colors
Charts: 3:1 minimum between data series
```

**Validation Process**
- All color combinations tested with WebAIM Contrast Checker
- Chart colors verified with colorblind simulation tools
- Focus states visible with 3:1 contrast ratio

---

#### Keyboard Navigation Flows

**Tab Order**
```
1. Skip to main content link (hidden until focused)
2. Header actions (Export, Refresh)
3. Subreddit tabs (left to right)
4. Time range buttons (left to right)
5. Summary metric cards (left to right, top to bottom)
6. Chart interactions (Enter to drill down on focused point)
7. Keyword panels (Tab through clickable keywords)
8. Footer links
```

**Keyboard Shortcuts**
```
Tab: Move forward through interactive elements
Shift + Tab: Move backward
Enter/Space: Activate buttons, select tabs
Arrow Keys: Navigate within tab groups and segmented controls
Escape: Close modals, clear selections
Home/End: Jump to first/last item in lists
```

**Focus Indicators**
```
Focus Ring:
  Color: #6366f1 (indigo-500)
  Width: 3px
  Offset: 2px
  Style: Solid outline

Visibility: Always visible, never suppressed
Animation: Subtle fade-in (150ms)
```

---

#### Screen Reader Considerations

**Semantic HTML**
```
<header> - Dashboard header
<nav> - Subreddit tabs, time range controls
<main> - Primary content area
<section> - Chart sections, keyword panels
<article> - Individual sample cards
<aside> - Supplementary keyword insights
<dialog> - Drill-down modal
```

**ARIA Labels**
```
Charts:
  role="img"
  aria-label="Sentiment trend chart showing data from [start] to [end]"
  aria-describedby="chart-description"

Tabs:
  role="tablist" on container
  role="tab" on each tab
  aria-selected="true/false"
  aria-controls="[panel-id]"

Metrics:
  aria-label="Average sentiment: +0.42, increased by 8.2%"

Buttons:
  aria-label="Export data as CSV"
  aria-label="Refresh dashboard data"

Modal:
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
```

**Live Regions**
```
Data Updates:
  <div aria-live="polite" aria-atomic="true">
    Dashboard updated with latest data
  </div>

Loading States:
  <div role="status" aria-live="polite">
    Loading chart data...
  </div>

Error Messages:
  <div role="alert" aria-live="assertive">
    Failed to load data. Please try again.
  </div>
```

**Screen Reader Announcements**
```
On Tab Change:
  "Viewing r/ClaudeAI data. 1,247 items in last 30 days."

On Time Range Change:
  "Updated to 90-day view. Loading data..."

On Chart Drill-Down:
  "Opened details for September 24, 2025. 147 items with +0.64 sentiment."

On Export:
  "CSV export started. File will download shortly."
```

---

#### Alternative Text & Descriptions

**Chart Descriptions**
```
Sentiment Chart:
  "Line chart showing sentiment score over time from [start date] to [end date].
   Current average sentiment is +0.42, trending upward.
   Notable spike on [date] with score of +0.87."

Volume Chart:
  "Bar chart showing discussion volume over time.
   Peak volume of 247 items on [date].
   Average daily volume is 147 items."

Keyword Cloud:
  "Top keywords: cursor (842 mentions), MCP (634), agent (512), bug (387), API (298)."
```

**Icon Labels**
```
Trend Up Icon: "Increased by [percentage]"
Trend Down Icon: "Decreased by [percentage]"
Refresh Icon: "Refresh data"
Export Icon: "Export to CSV"
External Link Icon: "Opens in new tab"
```

---

#### Reduced Motion Support

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Fallback Behaviors**
- Chart animations: Instant render instead of draw animation
- Tab transitions: Immediate switch instead of slide
- Modal open/close: Instant display instead of fade
- Hover effects: Maintain visual feedback without transitions

---

## Interaction Design Patterns

### Click/Tap Zones

**Chart Interactions**
```
Desktop:
  - Hover: Tooltip appears with 200ms delay
  - Click: Drill-down modal opens
  - Target size: Entire data point (8px radius)

Mobile:
  - Tap: Tooltip appears
  - Long-press (500ms): Drill-down opens
  - Target size: 44x44px minimum touch area
```

**Tab Switching**
```
Desktop:
  - Hover: Subtle background color change
  - Click: Instant tab switch with content fade transition

Mobile:
  - Tap: Immediate switch
  - Swipe: Horizontal swipe to next/previous tab (optional enhancement)
```

---

### Drag & Drop (Future Enhancement)

*Not in MVP, but designed for future keyword organization:*
```
- Drag keywords to reorder priority
- Drop keywords to custom lists
- Visual feedback: Lifted shadow, cursor change
- Drop zones: Highlighted border
```

---

### Expandable Elements

**Keyword Panels**
```
Initial State: Show top 6 keywords
Expanded: Show full list (scrollable)

Interaction:
  - Click "Show More" button
  - Panel expands with smooth height animation (400ms)
  - Button changes to "Show Less"
```

**Sample Cards (in Drill-Down)**
```
Initial State: Content preview truncated to 2 lines
Expanded: Full text visible

Interaction:
  - Click "Read more" link
  - Text expands with fade-in
  - "Read less" option appears
```

---

### Multi-Action Components

**Metric Cards**
```
Click Zones:
  1. Entire card: View filtered chart for that metric
  2. Trend indicator: Show trend details tooltip

Visual Feedback:
  - Hover: Subtle elevation increase (shadow)
  - Active: Border accent color
  - Cursor: Pointer on hover
```

**Chart Points**
```
Interaction Zones:
  1. Data point: Tooltip + drill-down
  2. Chart area: Pan/zoom (future enhancement)
  3. Legend: Toggle series visibility

Feedback:
  - Hover: Point size increases, crosshair appears
  - Click: Point highlights, modal opens
  - Focus: Focus ring on nearest point
```

---

### Loading States

**Skeleton Loaders**
```
Metric Cards:
  ┌────────────────────┐
  │ ▓▓▓▓▓▓▓           │ ← Pulsing gray bars
  │ ▓▓▓▓▓▓▓▓▓▓▓       │
  │ ▓▓▓▓▓             │
  └────────────────────┘

Charts:
  ┌─────────────────────┐
  │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │ ← Pulsing chart outline
  │ ▓ ▓   ▓  ▓    ▓    │
  │▓ ▓ ▓ ▓  ▓  ▓ ▓  ▓  │
  └─────────────────────┘
```

**Spinner (for quick updates)**
```
Small Spinner:
  - Size: 16px
  - Placement: Next to "Last updated" text
  - Color: Secondary accent
  - Animation: Smooth rotation (1s linear)
```

---

### Error States

**Inline Errors**
```
┌─────────────────────────────────────────┐
│ ⚠ Failed to load chart data             │
│ [Retry] [View Cached Data]              │
└─────────────────────────────────────────┘

Colors:
  Icon: Amber (#f59e0b)
  Background: Amber/10 transparency
  Border: Amber/30
```

**Toast Notifications**
```
Position: Top-right corner
Duration: 4 seconds (auto-dismiss)
Actions: Dismissible with X button

Success: Teal background, white text
Error: Coral background, white text
Info: Sky blue background, white text
```

---

### Confirmation Dialogs

**Export CSV Confirmation**
```
┌─────────────────────────────────────────┐
│ Export Sentiment Data                   │
├─────────────────────────────────────────┤
│                                         │
│ You're about to export:                 │
│ • Subreddit: r/ClaudeAI                 │
│ • Time range: Last 30 days              │
│ • Rows: ~1,247 items                    │
│                                         │
│         [Cancel]  [Export CSV]          │
└─────────────────────────────────────────┘
```

---

## Implementation Notes

### Technical Recommendations

**Chart Library**
- Recommended: Recharts (React-first, responsive)
- Alternative: Chart.js with react-chartjs-2
- Rationale: Recharts offers better React integration and accessibility

**State Management**
- Recommended: React Query (for server state)
- Local state: React Context or Zustand (lightweight)
- Rationale: Caching, automatic refetching, loading states built-in

**Styling Approach**
- Recommended: Tailwind CSS with custom theme
- Component library: Radix UI (headless, accessible)
- Rationale: Utility-first CSS matches design system, Radix ensures accessibility

**Animation Library**
- Recommended: Framer Motion (for complex animations)
- Simple transitions: CSS transitions
- Rationale: Declarative animations, reduced motion support built-in

---

### Performance Considerations

**Chart Rendering**
- Virtualize long data series (> 90 points)
- Debounce hover interactions (200ms)
- Lazy load drill-down modal content
- Canvas rendering for large datasets (> 1000 points)

**Data Fetching**
- Cache aggregated data for 5 minutes
- Prefetch adjacent time ranges
- Stale-while-revalidate strategy
- Pagination for sample lists (20 items per page)

**Bundle Optimization**
- Code-split charts (lazy load)
- Tree-shake unused Recharts components
- Optimize font loading (variable fonts preferred)
- Compress images and icons (SVG preferred)

---

## Design Deliverables Summary

This specification provides:

1. **Complete Wireframes**: Desktop, tablet, and mobile layouts with ASCII diagrams
2. **Component Hierarchy**: Full React component structure with nesting and responsibilities
3. **User Flows**: 6 detailed interaction flows from page load to CSV export
4. **Color System**: Professional analytics palette with exact hex values, rationale, and contrast ratios
5. **Typography**: Comprehensive type scale with sizes, weights, and usage guidelines
6. **Responsive Specs**: Breakpoint strategy with layout adaptations for all screen sizes
7. **Accessibility Plan**: WCAG AA compliance with keyboard navigation, screen reader support, and focus management
8. **Interaction Patterns**: Click zones, loading states, error handling, and multi-action components

---

## Appendix: Color Palette Quick Reference

### Dark Mode
```
Background:     #0f1419
Panel:          #1a1f26
Border:         #2d3748
Primary Text:   #f1f5f9
Secondary Text: #94a3b8
```

### Sentiment Colors
```
Positive: #14b8a6 (teal-500)
Neutral:  #f59e0b (amber-500)
Negative: #f87171 (red-400)
```

### Interactive
```
Primary:   #0ea5e9 (sky-500)
Hover:     #7dd3fc (sky-300)
Focus:     #6366f1 (indigo-500)
```

### Chart Palette
```
r/ClaudeAI:   #3b82f6 (blue-500)
r/ClaudeCode: #8b5cf6 (violet-500)
r/Anthropic:  #ec4899 (pink-500)
All Combined: #14b8a6 (teal-500)
```

---

**End of Design Specification**

*This document is intended for implementation by frontend developers and serves as the single source of truth for visual design, interaction patterns, and accessibility requirements for the Claude Code Sentiment Monitor dashboard application.*
