'use client';

import useSWR from 'swr';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, ExternalLink, MessageSquare, ThumbsUp } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface DrillDownDialogProps {
  date: string;
  subreddit: string;
  open: boolean;
  onClose: () => void;
}

interface Post {
  id: string;
  title: string;
  author: string;
  score: number;
  numComments: number;
  sentiment: number | null;
  url: string;
  createdAt: string;
}

interface Comment {
  id: string;
  postId: string;
  postTitle: string;
  author: string;
  body: string;
  score: number;
  sentiment: number | null;
  createdAt: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function DrillDownDialog({ date, subreddit, open, onClose }: DrillDownDialogProps) {
  const { data, error, isLoading } = useSWR(
    open ? `/api/drill-down?date=${date}&subreddit=${subreddit}` : null,
    fetcher
  );

  const getSentimentBadge = (sentiment: number | null) => {
    if (sentiment === null) return null;

    if (sentiment > 0.2) {
      return (
        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
          +{sentiment.toFixed(2)}
        </Badge>
      );
    } else if (sentiment < -0.2) {
      return (
        <Badge className="bg-rose-50 text-rose-700 border-rose-200">
          {sentiment.toFixed(2)}
        </Badge>
      );
    }
    return (
      <Badge className="bg-slate-50 text-slate-700 border-slate-200">
        {sentiment.toFixed(2)}
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {date ? format(parseISO(date), 'MMMM d, yyyy') : ''} - r/{subreddit}
          </DialogTitle>
          <DialogDescription>
            Top posts and comments from this day
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Failed to load drill-down data</AlertDescription>
          </Alert>
        )}

        {data && (
          <div className="space-y-6">
            {/* Posts Section */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-slate-900 dark:text-slate-50">
                Top Posts ({data.posts?.length || 0})
              </h3>
              <div className="space-y-3">
                {data.posts?.slice(0, 10).map((post: Post) => (
                  <div
                    key={post.id}
                    className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <a
                          href={post.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-slate-900 dark:text-slate-50 hover:text-cyan-600 dark:hover:text-cyan-400 flex items-center gap-2 mb-1"
                        >
                          {post.title}
                          <ExternalLink className="h-3 w-3 flex-shrink-0" />
                        </a>
                        <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
                          <span>u/{post.author}</span>
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="h-3 w-3" />
                            {post.score}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {post.numComments}
                          </span>
                        </div>
                      </div>
                      {getSentimentBadge(post.sentiment)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Comments Section */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-slate-900 dark:text-slate-50">
                Top Comments ({data.comments?.length || 0})
              </h3>
              <div className="space-y-3">
                {data.comments?.slice(0, 10).map((comment: Comment) => (
                  <div
                    key={comment.id}
                    className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                          On: <span className="font-medium">{comment.postTitle}</span>
                        </p>
                        <p className="text-sm text-slate-900 dark:text-slate-50 mb-2 line-clamp-3">
                          {comment.body}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
                          <span>u/{comment.author}</span>
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="h-3 w-3" />
                            {comment.score}
                          </span>
                        </div>
                      </div>
                      {getSentimentBadge(comment.sentiment)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
