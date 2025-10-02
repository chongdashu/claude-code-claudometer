'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KeywordPanelProps {
  timeRange: '7d' | '30d' | '90d';
  subreddit: string;
}

export function KeywordPanel({ timeRange: _timeRange, subreddit: _subreddit }: KeywordPanelProps) {
  // Placeholder data - in production, this would come from keyword extraction
  const topKeywords = [
    { word: 'helpful', sentiment: 0.7, count: 142 },
    { word: 'fast', sentiment: 0.6, count: 98 },
    { word: 'accurate', sentiment: 0.5, count: 87 },
    { word: 'bug', sentiment: -0.3, count: 65 },
    { word: 'error', sentiment: -0.4, count: 54 },
    { word: 'slow', sentiment: -0.5, count: 43 },
  ];

  const getSentimentIcon = (sentiment: number) => {
    if (sentiment > 0.2) {
      return <TrendingUp className="h-3 w-3 text-emerald-600" />;
    } else if (sentiment < -0.2) {
      return <TrendingDown className="h-3 w-3 text-rose-600" />;
    }
    return <Minus className="h-3 w-3 text-slate-500" />;
  };

  const getSentimentColor = (sentiment: number) => {
    if (sentiment > 0.2) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    } else if (sentiment < -0.2) {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    return 'bg-slate-50 text-slate-700 border-slate-200';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Keywords</CardTitle>
        <CardDescription>
          Most frequently mentioned terms and their sentiment
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {topKeywords.map((keyword) => (
            <Badge
              key={keyword.word}
              variant="outline"
              className={`${getSentimentColor(keyword.sentiment)} flex items-center gap-1.5 px-3 py-1.5`}
            >
              {getSentimentIcon(keyword.sentiment)}
              <span className="font-medium">{keyword.word}</span>
              <span className="text-xs opacity-70">({keyword.count})</span>
            </Badge>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-4">
          Note: Keyword extraction is a placeholder feature. Full implementation would include
          TF-IDF or similar algorithms to extract meaningful keywords from posts and comments.
        </p>
      </CardContent>
    </Card>
  );
}
