// Dashboard Page - Main UI
// Based on ui-designer and shadcn-expert specifications

import { Suspense } from 'react';
import { DashboardContent } from '@/app/components/dashboard-content';
import { DashboardSkeleton } from '@/app/components/dashboard-skeleton';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex">
            <h1 className="text-lg font-semibold">Claude Code Sentiment Monitor</h1>
          </div>
          <div className="flex flex-1 items-center justify-end space-x-2">
            <span className="text-sm text-muted-foreground">
              Reddit sentiment tracking for r/ClaudeAI, r/ClaudeCode, r/Anthropic
            </span>
          </div>
        </div>
      </header>

      <main className="container py-6">
        <Suspense fallback={<DashboardSkeleton />}>
          <DashboardContent />
        </Suspense>
      </main>
    </div>
  );
}
