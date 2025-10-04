import { useState } from "react";
import type { DataPoint } from "@shared/schema";
import DataControls from "../DataControls";

export default function DataControlsExample() {
  const [isRecording, setIsRecording] = useState(false);
  const [fileName, setFileName] = useState("serial-data");

  const mockData: DataPoint[] = [
    { timestamp: "12:34:56", thrust: 245.67, pressure: 3.14 },
    { timestamp: "12:34:57", thrust: 246.12, pressure: 3.15 },
  ];

  return (
    <div className="p-4">
      <DataControls
        isRecording={isRecording}
        onStartRecording={() => {
          console.log("Start recording");
          setIsRecording(true);
        }}
        onStopRecording={() => {
          console.log("Stop recording");
          setIsRecording(false);
        }}
        onClearData={() => console.log("Clear data")}
        onExportCSV={() => console.log("Export CSV")}
        recordedPoints={mockData}
        fileName={fileName}
        onFileNameChange={setFileName}
        isStreaming
        onStopStreaming={async () => console.log("Stop streaming")}
        onResumeStreaming={async () => console.log("Resume streaming")}
        isUploading={false}
      />
    </div>
  );
}
