import { useState } from 'react';
import DataControls from '../DataControls';

export default function DataControlsExample() {
  const [isRecording, setIsRecording] = useState(false);

  const mockData = [
    { timestamp: '12:34:56', thrust: 245.67, pressure: 3.14 },
    { timestamp: '12:34:57', thrust: 246.12, pressure: 3.15 },
  ];

  return (
    <div className="p-4">
      <DataControls
        isRecording={isRecording}
        onStartRecording={() => {
          console.log('Start recording');
          setIsRecording(true);
        }}
        onStopRecording={() => {
          console.log('Stop recording');
          setIsRecording(false);
        }}
        onClearData={() => console.log('Clear data')}
        onExportCSV={() => console.log('Export CSV')}
        dataPoints={mockData}
      />
    </div>
  );
}
