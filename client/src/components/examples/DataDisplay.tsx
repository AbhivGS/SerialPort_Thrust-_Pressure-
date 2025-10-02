import DataDisplay from '../DataDisplay';

export default function DataDisplayExample() {
  const mockData = {
    timestamp: '12:34:56',
    thrust: 245.67,
    pressure: 3.14,
  };

  return (
    <div className="p-4">
      <DataDisplay
        currentData={mockData}
        dataPointCount={156}
        isRecording={true}
      />
    </div>
  );
}
