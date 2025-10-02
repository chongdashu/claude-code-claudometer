'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { SentimentChart } from './SentimentChart';
import { VolumeChart } from './VolumeChart';
import { KeywordPanel } from './KeywordPanel';
import { DrillDownDialog } from './DrillDownDialog';

type TimeRange = '7d' | '30d' | '90d';
type Subreddit = 'all' | 'ClaudeAI' | 'ClaudeCode' | 'Anthropic';

export function DashboardShell() {
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [subreddit, setSubreddit] = useState<Subreddit>('all');
  const [drillDownDate, setDrillDownDate] = useState<string | null>(null);

  const handleExport = async () => {
    try {
      const response = await fetch(`/api/export/csv?range=${timeRange}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sentiment-data-${timeRange}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-50 mb-2">
            Claude Sentiment Monitor
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Track community sentiment across Reddit discussions
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-4 mb-6">
          {/* Time Range Selector */}
          <div className="flex gap-2">
            <Button
              variant={timeRange === '7d' ? 'default' : 'outline'}
              onClick={() => setTimeRange('7d')}
              className="font-medium"
            >
              7 Days
            </Button>
            <Button
              variant={timeRange === '30d' ? 'default' : 'outline'}
              onClick={() => setTimeRange('30d')}
              className="font-medium"
            >
              30 Days
            </Button>
            <Button
              variant={timeRange === '90d' ? 'default' : 'outline'}
              onClick={() => setTimeRange('90d')}
              className="font-medium"
            >
              90 Days
            </Button>
          </div>

          <div className="ml-auto">
            <Button
              variant="outline"
              onClick={handleExport}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Subreddit Tabs */}
        <Tabs value={subreddit} onValueChange={(v) => setSubreddit(v as Subreddit)}>
          <TabsList className="mb-6">
            <TabsTrigger value="all">All Subreddits</TabsTrigger>
            <TabsTrigger value="ClaudeAI">r/ClaudeAI</TabsTrigger>
            <TabsTrigger value="ClaudeCode">r/ClaudeCode</TabsTrigger>
            <TabsTrigger value="Anthropic">r/Anthropic</TabsTrigger>
          </TabsList>

          <TabsContent value={subreddit} className="space-y-6">
            {/* Charts */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Sentiment Trend</CardTitle>
                  <CardDescription>
                    Average sentiment over time (-1 to +1)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SentimentChart
                    timeRange={timeRange}
                    subreddit={subreddit}
                    onDateClick={(date) => setDrillDownDate(date)}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Discussion Volume</CardTitle>
                  <CardDescription>
                    Total posts and comments per day
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <VolumeChart
                    timeRange={timeRange}
                    subreddit={subreddit}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Keyword Panel */}
            <KeywordPanel
              timeRange={timeRange}
              subreddit={subreddit}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Drill-Down Dialog */}
      {drillDownDate && (
        <DrillDownDialog
          date={drillDownDate}
          subreddit={subreddit === 'all' ? 'ClaudeAI' : subreddit}
          open={!!drillDownDate}
          onClose={() => setDrillDownDate(null)}
        />
      )}
    </div>
  );
}
