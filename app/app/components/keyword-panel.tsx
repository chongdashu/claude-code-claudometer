// Keyword Panel Component
// Based on ui-designer specifications

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface KeywordPanelProps {
  title: string;
  keywords: Array<{ keyword: string; count: number }>;
}

export function KeywordPanel({ title, keywords }: KeywordPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {keywords.map((kw, index) => (
            <Badge key={index} variant="secondary" className="text-sm">
              {kw.keyword} ({kw.count})
            </Badge>
          ))}
          {keywords.length === 0 && (
            <p className="text-sm text-muted-foreground">No keywords available</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
