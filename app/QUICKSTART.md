# Quick Start Guide

## Claude Code Sentiment Monitor

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Create `.env.local`:

```env
# Optional - for real Reddit API integration
REDDIT_CLIENT_ID=your_client_id
REDDIT_CLIENT_SECRET=your_client_secret
REDDIT_USER_AGENT=ClaudeCodeSentimentMonitor/1.0

# Optional - for real OpenAI sentiment analysis
OPENAI_API_KEY=your_openai_api_key
```

**Note**: Environment variables are optional for demo. The app works with sample data without API keys.

### 3. Run Development Server

```bash
npm run dev
```

### 4. Initialize Sample Data

Open your browser and visit:

```
http://localhost:3000/api/init
```

This will generate 90 days of sample Reddit sentiment data for demonstration.

### 5. View Dashboard

Navigate to:

```
http://localhost:3000/dashboard
```

You should see:
- **Summary Metrics**: Average sentiment, total volume, positive/negative percentages
- **Charts**: Sentiment line chart and volume bar chart
- **Subreddit Tabs**: Switch between r/ClaudeAI, r/ClaudeCode, r/Anthropic, or All Combined
- **Time Range Selector**: View 7, 30, or 90 days of data
- **Keyword Panels**: Top keywords and trending topics
- **Interactive Drill-Down**: Click any day in the chart to see sample posts
- **CSV Export**: Download sentiment data for analysis

### 6. Features to Try

1. **Switch Subreddits**: Click tabs to filter by subreddit
2. **Change Time Range**: Toggle between 7, 30, and 90 days
3. **Drill Down**: Click any point on the sentiment chart to see sample posts
4. **View Details**: See sentiment labels, confidence scores, and Reddit links
5. **Export Data**: Click "Export CSV" to download aggregated sentiment data
6. **Refresh Data**: Click refresh icon to update metrics

### 7. Build for Production

```bash
npm run build
npm start
```

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 15 with App Router
- **UI**: shadcn/ui components with Tailwind CSS
- **Charts**: Recharts for data visualization
- **State**: React Query for server state
- **APIs**: Reddit OAuth & OpenAI GPT-3.5-turbo (optional)

### Key Files
- `/app/dashboard/page.tsx` - Main dashboard UI
- `/app/api/sentiment/aggregate/route.ts` - Aggregated sentiment data API
- `/app/api/sentiment/samples/route.ts` - Sample posts API
- `/app/api/export/csv/route.ts` - CSV export API
- `/lib/services/` - Reddit & OpenAI service implementations
- `/lib/db.ts` - In-memory database (MVP)

### Design Specifications

This implementation follows the design outputs from `/dev:design-app`:

- **Colors**: Slate gray backgrounds (#0f1419), teal/amber/coral sentiment colors
- **Typography**: Inter font, professional analytics aesthetic
- **Components**: 11 shadcn/ui components with custom variants
- **Responsive**: Mobile-first design with breakpoints
- **Accessible**: WCAG AA compliant with proper ARIA labels

## Next Steps

### Production Deployment

1. **Database**: Replace in-memory DB with PostgreSQL/SQLite
2. **Background Jobs**: Implement cron job for 30-min Reddit polling
3. **Caching**: Add Redis for sentiment result caching
4. **Authentication**: Add user authentication if needed
5. **Monitoring**: Set up error tracking and analytics

### Feature Enhancements

- Real-time data sync with Reddit API
- Advanced filtering and search
- User sentiment tracking over time
- Email/Slack alerts for sentiment shifts
- Multi-platform support (Twitter, Discord)

## Troubleshooting

### Build Errors

If you encounter TypeScript or ESLint errors:

```bash
# Clean build
rm -rf .next
npm run build
```

### Sample Data Not Loading

Refresh the initialization:

```bash
# Visit again to regenerate data
http://localhost:3000/api/init
```

### Charts Not Rendering

Check browser console for errors. Ensure Recharts is properly installed:

```bash
npm install recharts
```

## Support

For issues or questions:
- Check the README.md for detailed documentation
- Review design specifications in `.claude/outputs/design/`
- See PRD at `docs/PRD.md` for requirements

---

**Built with design specifications from `/dev:design-app` command**
