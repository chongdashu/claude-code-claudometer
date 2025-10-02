// Metric Card Component
// Based on shadcn-expert specifications

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { SentimentLabel } from '@/types';

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: 'up' | 'down' | 'stable';
  sentiment?: SentimentLabel;
  icon?: LucideIcon;
}

export function MetricCard({ title, value, subtitle, trend, sentiment, icon: Icon }: MetricCardProps) {
  const getSentimentColor = (sent?: SentimentLabel) => {
    if (!sent) return '';
    return sent === 'positive'
      ? 'text-[hsl(var(--sentiment-positive))]'
      : sent === 'negative'
      ? 'text-[hsl(var(--sentiment-negative))]'
      : 'text-[hsl(var(--sentiment-neutral))]';
  };

  const getTrendColor = (t?: 'up' | 'down' | 'stable') => {
    if (!t) return '';
    return t === 'up' ? 'text-green-500' : t === 'down' ? 'text-red-500' : 'text-gray-500';
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon && <Icon className={`h-4 w-4 ${getTrendColor(trend)}`} />}
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${getSentimentColor(sentiment)}`}>{value}</div>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}
