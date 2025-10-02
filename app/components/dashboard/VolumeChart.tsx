'use client';

import useSWR from 'swr';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface VolumeChartProps {
  timeRange: '7d' | '30d' | '90d';
  subreddit: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function VolumeChart({ timeRange, subreddit }: VolumeChartProps) {
  const { data, error, isLoading } = useSWR(
    `/api/dashboard/data?range=${timeRange}&subreddit=${subreddit}`,
    fetcher,
    {
      refreshInterval: 30000,
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
        <AlertDescription>Failed to load volume data</AlertDescription>
      </Alert>
    );
  }

  const chartData = data?.data || [];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis
          dataKey="date"
          tickFormatter={(value) => format(parseISO(value), 'MMM d')}
          stroke="#64748b"
          style={{ fontSize: '12px' }}
        />
        <YAxis
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
                    Total: <span className="font-semibold">{data.volume}</span>
                  </p>
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-emerald-600">
                      Positive: {data.positiveCount}
                    </p>
                    <p className="text-xs text-rose-600">
                      Negative: {data.negativeCount}
                    </p>
                    <p className="text-xs text-slate-500">
                      Neutral: {data.neutralCount}
                    </p>
                  </div>
                </div>
              );
            }
            return null;
          }}
        />
        <Bar dataKey="volume" fill="#0891b2" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
