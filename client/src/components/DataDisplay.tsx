import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Gauge, Activity } from 'lucide-react';
import type { DataPoint } from '@shared/schema';

interface DataDisplayProps {
  currentData: DataPoint | null;
  dataPointCount: number;
  isRecording: boolean;
}

export default function DataDisplay({ currentData, dataPointCount, isRecording }: DataDisplayProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-lg">Live Data</CardTitle>
        {isRecording && (
          <Badge className="bg-chart-3" data-testid="badge-recording">
            <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse" />
            Recording
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Timestamp</span>
            </div>
            <span className="font-mono text-sm" data-testid="text-timestamp">
              {currentData?.timestamp || '--:--:--'}
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-chart-1" />
              <span className="text-sm font-medium">Thrust</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-2xl font-bold" data-testid="text-thrust">
                {currentData?.thrust.toFixed(2) || '0.00'}
              </span>
              <span className="text-sm text-muted-foreground">g</span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-chart-2" />
              <span className="text-sm font-medium">Pressure</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-2xl font-bold" data-testid="text-pressure">
                {currentData?.pressure.toFixed(2) || '0.00'}
              </span>
              <span className="text-sm text-muted-foreground">bar</span>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Data Points</span>
            <span className="font-mono text-sm font-medium" data-testid="text-data-count">
              {dataPointCount}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
