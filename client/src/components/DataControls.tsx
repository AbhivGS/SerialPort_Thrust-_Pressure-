import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Play, Pause, Trash2, StopCircle, PlayCircle, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { DataPoint } from "@shared/schema";

interface DataControlsProps {
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onClearData: () => void;
  onExportCSV: () => void;
  recordedPoints: DataPoint[];
  fileName: string;
  onFileNameChange: (name: string) => void;
  isStreaming: boolean;
  onStopStreaming: () => Promise<void> | void;
  onResumeStreaming: () => Promise<void> | void;
  isUploading: boolean;
  onUploadRecording?: () => Promise<void> | void;
}

export default function DataControls({
  isRecording,
  onStartRecording,
  onStopRecording,
  onClearData,
  onExportCSV,
  recordedPoints,
  fileName,
  onFileNameChange,
  isStreaming,
  onStopStreaming,
  onResumeStreaming,
  isUploading,
  onUploadRecording,
}: DataControlsProps) {
  const hasRecordedData = recordedPoints.length > 0;

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
            disabled={isUploading}
          />
        </div>

        <Button
          onClick={isStreaming ? onStopStreaming : onResumeStreaming}
          variant={isStreaming ? "outline" : "default"}
          className="w-full"
          data-testid="button-toggle-stream"
        >
          {isStreaming ? (
            <>
              <StopCircle className="mr-2 h-4 w-4" />
              Stop Data
            </>
          ) : (
            <>
              <PlayCircle className="mr-2 h-4 w-4" />
              Resume Data
            </>
          )}
        </Button>

        <div className="flex gap-2">
          {!isRecording ? (
            <Button
              onClick={onStartRecording}
              className="flex-1"
              data-testid="button-start-recording"
              disabled={!isStreaming || isUploading}
            >
              <Play className="mr-2 h-4 w-4" />
              Start Recording
            </Button>
          ) : (
            <Button
              onClick={onStopRecording}
              variant="secondary"
              className="flex-1"
              data-testid="button-stop-recording"
            >
              <Pause className="mr-2 h-4 w-4" />
              Stop Recording
            </Button>
          )}
        </div>

        <Button
          onClick={onClearData}
          variant="outline"
          className="w-full"
          disabled={!hasRecordedData || isRecording || isUploading}
          data-testid="button-clear-data"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Clear Recorded Data
        </Button>

        {onUploadRecording && (
          <Button
            onClick={onUploadRecording}
            variant="outline"
            className="w-full"
            disabled={!hasRecordedData || isUploading}
            data-testid="button-upload-recording"
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload Recording for Admin
          </Button>
        )}

        <Button
          onClick={onExportCSV}
          variant="outline"
          className="w-full"
          disabled={!hasRecordedData || isUploading}
          data-testid="button-export-csv"
        >
          <Download className="mr-2 h-4 w-4" />
          Export Recording to CSV
        </Button>

        {isUploading && (
          <p className="text-xs text-muted-foreground text-center">Uploading recording for admin&hellip;</p>
        )}
      </CardContent>
    </Card>
  );
}
