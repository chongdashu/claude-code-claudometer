'use client';

// Dashboard Content - Client Component
// Based on ui-designer and shadcn-expert specifications

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, RefreshCw, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { MetricCard } from './metric-card';
import { SentimentChart } from './sentiment-chart';
import { VolumeChart } from './volume-chart';
import { KeywordPanel } from './keyword-panel';
import { DrillDownModal } from './drill-down-modal';
import { TimeRange, Subreddit } from '@/types';

export function DashboardContent() {
  const [selectedSubreddit, setSelectedSubreddit] = useState<Subreddit>('All');
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Fetch aggregate data
  const { data, refetch } = useQuery({
    queryKey: ['sentiment-aggregate', selectedSubreddit, timeRange],
    queryFn: async () => {
      const subreddit = selectedSubreddit.toLowerCase();
      const response = await fetch(`/api/sentiment/aggregate?subreddit=${subreddit}&timeRange=${timeRange}`);
      return response.json();
    },
  });

  const handleExport = async () => {
    const subreddit = selectedSubreddit.toLowerCase();
    window.open(`/api/export/csv?subreddit=${subreddit}&timeRange=${timeRange}`, '_blank');
  };

  const summary = data?.data?.summary || {
    averageSentiment: 0,
    totalVolume: 0,
    positivePercentage: 0,
    negativePercentage: 0,
    trendDirection: 'stable',
  };

  const aggregates = data?.data?.aggregates || [];

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="flex items-center justify-between">
        <Tabs value={selectedSubreddit} onValueChange={(v) => setSelectedSubreddit(v as Subreddit)}>
          <TabsList>
            <TabsTrigger value="All">All Combined</TabsTrigger>
            <TabsTrigger value="ClaudeAI">r/ClaudeAI</TabsTrigger>
            <TabsTrigger value="ClaudeCode">r/ClaudeCode</TabsTrigger>
            <TabsTrigger value="Anthropic">r/Anthropic</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <div className="flex gap-1 rounded-md border border-border p-1">
            {(['7d', '30d', '90d'] as TimeRange[]).map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTimeRange(range)}
              >
                {range === '7d' ? '7 days' : range === '30d' ? '30 days' : '90 days'}
              </Button>
            ))}
          </div>

          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>

          <Button onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard
          title="Avg Sentiment"
          value={summary.averageSentiment.toFixed(2)}
          trend={summary.trendDirection}
          icon={summary.trendDirection === 'up' ? TrendingUp : summary.trendDirection === 'down' ? TrendingDown : Minus}
        />
        <MetricCard
          title="Total Volume"
          value={summary.totalVolume.toString()}
          subtitle="posts + comments"
        />
        <MetricCard
          title="Positive"
          value={`${summary.positivePercentage.toFixed(1)}%`}
          sentiment="positive"
        />
        <MetricCard
          title="Negative"
          value={`${summary.negativePercentage.toFixed(1)}%`}
          sentiment="negative"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Sentiment Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <SentimentChart data={aggregates} onDateClick={setSelectedDate} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <VolumeChart data={aggregates} />
          </CardContent>
        </Card>
      </div>

      {/* Keywords */}
      {aggregates.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          <KeywordPanel title="Top Keywords" keywords={aggregates[0]?.topKeywords || []} />
          <KeywordPanel title="Trending Topics" keywords={aggregates[aggregates.length - 1]?.topKeywords || []} />
        </div>
      )}

      {/* Drill-down Modal */}
      {selectedDate && (
        <DrillDownModal
          isOpen={!!selectedDate}
          onClose={() => setSelectedDate(null)}
          subreddit={selectedSubreddit}
          date={selectedDate}
        />
      )}
    </div>
  );
}
