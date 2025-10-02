'use client';

// Sentiment Chart Component
// Based on shadcn-expert Recharts specifications

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DailyAggregate } from '@/types';

interface SentimentChartProps {
  data: DailyAggregate[];
  onDateClick?: (date: string) => void;
}

export function SentimentChart({ data, onDateClick }: SentimentChartProps) {
  const chartData = data.map((agg) => ({
    date: agg.date,
    sentiment: agg.sentimentScore,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData} onClick={(e) => e?.activeLabel && onDateClick?.(e.activeLabel)}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="date"
          className="text-xs text-muted-foreground"
          tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        />
        <YAxis className="text-xs text-muted-foreground" domain={[-1, 1]} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '6px',
          }}
          labelFormatter={(value) => new Date(value).toLocaleDateString()}
          formatter={(value: number) => [`${value.toFixed(3)}`, 'Sentiment']}
        />
        <Line
          type="monotone"
          dataKey="sentiment"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={{ r: 4, cursor: 'pointer' }}
          activeDot={{ r: 6, cursor: 'pointer' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
