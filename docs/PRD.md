---
# Product Requirements Document (PRD)  
**Project:** Claude Code Sentiment Monitor (Reddit)
**Goal:** Simple web app that tracks and visualizes Reddit sentiment about Claude Code in r/ClaudeAI, r/ClaudeCode, and r/Anthropic, inspired by claudometer.app's methodology.

---

## 1. Overview
Track, filter, and visualize the mood (sentiment) and discussion volume about Claude Code from three key subreddits. Make it easy to spot spikes, trends, and context with daily aggregations over the last 90 days.

## 2. Objectives & KPIs
- Deliver easy-to-read daily sentiment and volume trends.
- Quickly surface spikes, outliers, and main topics/keywords.
- >80% sentiment scoring accuracy on a validation set.
- Minimize bot & spam influence (<30% of items filtered out as low-quality).
- App must be simple, fast, and require no manual data wrangling.

## 3. In Scope
- Ingest new posts and top-level comments from r/ClaudeAI, r/ClaudeCode, and r/Anthropic using Reddit API.
- Clean/normalize data, deduplicate, filter spam and bots.
- Sentiment analysis (positive/neutral/negative with confidence).
- Daily aggregation for last 90 days.
- Dashboard showing:
  - Line chart for sentiment, bar chart for volume.
  - Tabs: breakdown by subreddit.
  - Keyword cloud/panel.
  - Drill-down to examples for any day.
  - Export as CSV.

_Out of Scope (MVP):_ Twitter, Discord, in-thread sentiment, influencer scoring, real-time alerts.

## 4. Target Users & Use Cases
- Product/dev leads: spot sentiment shifts after releases.
- Marketers: identify hot topics and adjust messaging.
- Community managers: find & understand spikes or gripes.

## 5. Data
### Sources:
- Reddit API with OAuth, polling r/ClaudeAI, r/ClaudeCode, and r/Anthropic.
### Collected:
- Posts & top-level comments: id, subreddit, timestamp, author, title/body, score, num_comments, flair, parent link, removed/deleted status.

## 6. Data Pipeline
- Ingest all new posts/comments every 30 minutes (or as allowed).
- Backfill up to the last 90 days at startup.
- Clean: Remove non-English, deleted, obvious spam, and near-duplicates.
- Bot scoring: Downweight or exclude low karma, template-spammy, or link-farming patterns.
- Sentiment: Transformer model (distilbert/roberta or similar); assign pos/neu/neg score and confidence.
- Daily aggregates for each subreddit: sentiment score (weighted), count, keyword frequency.

## 7. UI/UX
- Dashboard with time selector (last 7/30/90 days).
- Tabs for each subreddit or “all combined.”
- Line/bar chart for sentiment & volume.
- List of top keywords for the date range.
- Drill-down: click a day to see sample posts/comments, sentiment, confidence, and jump-to-Reddit.
- Download summary as CSV.

## 8. Validation & Transparency
- Human-in-the-loop: weekly review of ~200 samples for ongoing accuracy.
- Publish methodology, quality filter, sentiment model version, known limitations.

## 9. Non-Functional/Compliance
- Store only public Reddit data (no PII).
- Respect Reddit’s API rate/policy.
- Dashboard should remain usable even if API quota is hit (show last loaded data).

---

# Milestones / Build Steps

0. **Setup & Planning**
- Define subreddits, Reddit API credentials, and app structure.

1. **Data Ingestion**
- Wire up Reddit OAuth API for posts and comments from the three subreddits.
- Implement polling and historical backfill (last 90 days).
- Save raw and normalized data (e.g., in Postgres, SQLite, or file-based storage).

2. **Cleaning & Filtering**
- Normalize text (remove markdown, links, emojis, etc.).
- Language filter for English.
- De-duplicate by near-identical text.
- Basic bot/spam detection (karma, posting frequency, link ratio).

3. **Sentiment Analysis**
- Integrate/open-source pre-trained sentiment model (e.g., DistilBERT).
- Process all cleaned items: assign pos/neu/neg, score, and confidence.

4. **Aggregation**
- Aggregate daily stats per subreddit:
  - Mean sentiment, pos/neu/neg percentages, message count, keyword frequencies.

5. **Dashboard/Data Visualization**
- Build a simple interactive dashboard (React/Next.js or similar):
  - Time/period selector, subreddit tabs, sentiment/volume charts, and keyword cloud.
  - Drill-down detail view and Reddit link-outs.
  - CSV export of daily summary.

6. **Quality Check & Validation**
- Manually review a sample; compare predicted and actual sentiment.
- Tune bot filters and confidence thresholds.

7. **Documentation & Transparency**
- Provide a clear methodology page explaining:
  - What’s ingested, filtered, scored, and the model version.
  - Data limitations and known quirks.
- Usage terms (public Reddit data only).

---

## End Result (Summary)
A no-fuss website that gives you a daily "mood chart" for Claude Code-related Reddit chatter—cleaned, scored, and visualized, letting you track trends in seconds and explore individual days or posts when you want detail.

Let me know if you want it trimmed even further or need an example UI spec or code bootstrapping!