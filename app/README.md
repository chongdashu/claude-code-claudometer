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

## Setup

### Prerequisites

- Node.js 18+ and npm
- Reddit API credentials (client ID, client secret)
- OpenAI API key

### Environment Variables

Create a `.env.local` file in the root directory:

```env
# Reddit API Configuration
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret
REDDIT_USER_AGENT=ClaudeCodeSentimentMonitor/1.0

# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key
```

### Installation

```bash
# Install dependencies
npm install

# Initialize sample data (for demonstration)
# Visit http://localhost:3000/api/init after starting dev server

# Run development server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
