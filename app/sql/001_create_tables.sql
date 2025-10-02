-- Claude Code Sentiment Monitor Database Schema
-- Run this in Supabase SQL Editor

-- Table: raw_posts
CREATE TABLE IF NOT EXISTS raw_posts (
    id TEXT PRIMARY KEY,
    subreddit TEXT NOT NULL,
    author TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT,
    score INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL,
    fetched_at TIMESTAMP NOT NULL DEFAULT NOW(),
    url TEXT NOT NULL,
    num_comments INTEGER NOT NULL
);

-- Indexes for raw_posts
CREATE INDEX IF NOT EXISTS idx_raw_posts_subreddit_created_at ON raw_posts(subreddit, created_at);
CREATE INDEX IF NOT EXISTS idx_raw_posts_created_at ON raw_posts(created_at);

-- Table: raw_comments
CREATE TABLE IF NOT EXISTS raw_comments (
    id TEXT PRIMARY KEY,
    post_id TEXT NOT NULL,
    subreddit TEXT NOT NULL,
    author TEXT NOT NULL,
    body TEXT NOT NULL,
    score INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL,
    fetched_at TIMESTAMP NOT NULL DEFAULT NOW(),
    parent_id TEXT,
    CONSTRAINT fk_raw_comments_post FOREIGN KEY (post_id) REFERENCES raw_posts(id) ON DELETE CASCADE
);

-- Indexes for raw_comments
CREATE INDEX IF NOT EXISTS idx_raw_comments_post_id ON raw_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_raw_comments_subreddit_created_at ON raw_comments(subreddit, created_at);

-- Table: sentiment_results
CREATE TABLE IF NOT EXISTS sentiment_results (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    item_id TEXT UNIQUE NOT NULL,
    item_type TEXT NOT NULL,
    sentiment DOUBLE PRECISION NOT NULL,
    positive_score DOUBLE PRECISION NOT NULL,
    negative_score DOUBLE PRECISION NOT NULL,
    neutral_score DOUBLE PRECISION NOT NULL,
    confidence DOUBLE PRECISION NOT NULL,
    reasoning TEXT,
    analyzed_at TIMESTAMP NOT NULL DEFAULT NOW(),
    cache_key TEXT UNIQUE NOT NULL
);

-- Indexes for sentiment_results
CREATE INDEX IF NOT EXISTS idx_sentiment_results_item_type_analyzed_at ON sentiment_results(item_type, analyzed_at);
CREATE INDEX IF NOT EXISTS idx_sentiment_results_cache_key ON sentiment_results(cache_key);

-- Table: daily_aggregates
CREATE TABLE IF NOT EXISTS daily_aggregates (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    date DATE NOT NULL,
    subreddit TEXT NOT NULL,
    avg_sentiment DOUBLE PRECISION NOT NULL,
    positive_count INTEGER NOT NULL,
    negative_count INTEGER NOT NULL,
    neutral_count INTEGER NOT NULL,
    total_count INTEGER NOT NULL,
    volume_posts INTEGER NOT NULL,
    volume_comments INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_date_subreddit UNIQUE (date, subreddit)
);

-- Indexes for daily_aggregates
CREATE INDEX IF NOT EXISTS idx_daily_aggregates_subreddit_date ON daily_aggregates(subreddit, date);
CREATE INDEX IF NOT EXISTS idx_daily_aggregates_date ON daily_aggregates(date);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_daily_aggregates_updated_at
    BEFORE UPDATE ON daily_aggregates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
