import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Play, Pause, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { DataPoint } from '@shared/schema';

interface DataControlsProps {
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onClearData: () => void;
  onExportCSV: () => void;
  dataPoints: DataPoint[];
  fileName: string;
  onFileNameChange: (name: string) => void;
}

export default function DataControls({
  isRecording,
  onStartRecording,
  onStopRecording,
  onClearData,
  onExportCSV,
  dataPoints,
  fileName,
  onFileNameChange,
}: DataControlsProps) {
  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-lg">Data Controls</CardTitle>
        <CardDescription>Manage data recording and export</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <label className="text-sm font-medium">File name</label>
          <Input
            value={fileName}
            onChange={(e) => onFileNameChange(e.target.value)}
            placeholder="serial-data"
            data-testid="input-file-name"
          />
        </div>
        <div className="flex gap-2">
          {!isRecording ? (
            <Button
              onClick={onStartRecording}
              className="flex-1"
              data-testid="button-start-recording"
            >
              <Play className="w-4 h-4 mr-2" />
              Start Recording
            </Button>
          ) : (
            <Button
              onClick={onStopRecording}
              variant="secondary"
              className="flex-1"
              data-testid="button-stop-recording"
            >
              <Pause className="w-4 h-4 mr-2" />
              Stop Recording
            </Button>
          )}
        </div>

        <Button
          onClick={onClearData}
          variant="outline"
          className="w-full"
          disabled={dataPoints.length === 0}
          data-testid="button-clear-data"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Clear Data
        </Button>

        <Button
          onClick={onExportCSV}
          variant="default"
          className="w-full"
          disabled={dataPoints.length === 0}
          data-testid="button-export-csv"
        >
          <Download className="w-4 h-4 mr-2" />
          Export to CSV
        </Button>
      </CardContent>
    </Card>
  );
}
