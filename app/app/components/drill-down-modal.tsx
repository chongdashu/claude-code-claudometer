'use client';

// Drill-Down Modal Component
// Based on ui-designer and shadcn-expert specifications

import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { Subreddit, SentimentLabel } from '@/types';

interface DrillDownModalProps {
  isOpen: boolean;
  onClose: () => void;
  subreddit: Subreddit;
  date: string;
}

export function DrillDownModal({ isOpen, onClose, subreddit, date }: DrillDownModalProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['sentiment-samples', subreddit, date],
    queryFn: async () => {
      const sub = subreddit.toLowerCase();
      const response = await fetch(`/api/sentiment/samples?subreddit=${sub}&date=${date}`);
      return response.json();
    },
    enabled: isOpen,
  });

  const samples = data?.data?.samples || [];

  const getSentimentBadge = (sentiment: SentimentLabel) => {
    const colors = {
      positive: 'bg-[hsl(var(--sentiment-positive)/0.2)] text-[hsl(var(--sentiment-positive))] border-[hsl(var(--sentiment-positive))]',
      neutral: 'bg-[hsl(var(--sentiment-neutral)/0.2)] text-[hsl(var(--sentiment-neutral))] border-[hsl(var(--sentiment-neutral))]',
      negative: 'bg-[hsl(var(--sentiment-negative)/0.2)] text-[hsl(var(--sentiment-negative))] border-[hsl(var(--sentiment-negative))]',
    };
    return colors[sentiment];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Samples for {new Date(date).toLocaleDateString()} - r/{subreddit}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {isLoading && <p className="text-sm text-muted-foreground">Loading samples...</p>}

          {!isLoading && samples.length === 0 && (
            <p className="text-sm text-muted-foreground">No samples available for this date</p>
          )}

          {samples.map((sample: {
            id: string;
            author: string;
            content: string;
            sentiment: SentimentLabel;
            confidence: number;
            score: number;
            permalink: string;
            timestamp: number;
          }) => (
            <div key={sample.id} className="border border-border rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={getSentimentBadge(sample.sentiment)}>
                    {sample.sentiment}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Confidence: {(sample.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <a href={sample.permalink} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Reddit
                  </a>
                </Button>
              </div>

              <p className="text-sm">{sample.content}</p>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>u/{sample.author}</span>
                <span>Score: {sample.score}</span>
                <span>{new Date(sample.timestamp * 1000).toLocaleTimeString()}</span>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
