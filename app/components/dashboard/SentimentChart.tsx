'use client';

import useSWR from 'swr';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface SentimentChartProps {
  timeRange: '7d' | '30d' | '90d';
  subreddit: string;
  onDateClick?: (date: string) => void;
}

interface ChartData {
  date: string;
  avgSentiment: number;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function SentimentChart({ timeRange, subreddit, onDateClick }: SentimentChartProps) {
  const { data, error, isLoading } = useSWR(
    `/api/dashboard/data?range=${timeRange}&subreddit=${subreddit}`,
    fetcher,
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: false,
    }
  );

  if (isLoading) {
    return <Skeleton className="h-[300px] w-full" />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Failed to load sentiment data</AlertDescription>
      </Alert>
    );
  }

  const chartData: ChartData[] = data?.data || [];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart
        data={chartData}
        onClick={(e: { activeLabel?: string }) => {
          if (e.activeLabel && onDateClick) {
            onDateClick(e.activeLabel);
          }
        }}
        className="cursor-pointer"
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis
          dataKey="date"
          tickFormatter={(value) => format(parseISO(value), 'MMM d')}
          stroke="#64748b"
          style={{ fontSize: '12px' }}
        />
        <YAxis
          domain={[-1, 1]}
          ticks={[-1, -0.5, 0, 0.5, 1]}
          stroke="#64748b"
          style={{ fontSize: '12px' }}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const data = payload[0].payload;
              return (
                <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
                  <p className="font-medium text-sm text-slate-900 dark:text-slate-50">
                    {format(parseISO(data.date), 'MMM d, yyyy')}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Sentiment:{' '}
                    <span
                      className={`font-semibold ${
                        data.avgSentiment > 0.2
                          ? 'text-emerald-600'
                          : data.avgSentiment < -0.2
                          ? 'text-rose-600'
                          : 'text-slate-600'
                      }`}
                    >
                      {data.avgSentiment.toFixed(2)}
                    </span>
                  </p>
                </div>
              );
            }
            return null;
          }}
        />
        <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />
        <Line
          type="monotone"
          dataKey="avgSentiment"
          stroke="#0891b2"
          strokeWidth={2}
          dot={{ fill: '#0891b2', r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
