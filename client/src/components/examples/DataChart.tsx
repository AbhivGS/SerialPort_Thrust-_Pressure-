import DataChart from '../DataChart';

export default function DataChartExample() {
  const mockData = Array.from({ length: 50 }, (_, i) => ({
    timestamp: `00:00:${i.toString().padStart(2, '0')}`,
    thrust: 200 + Math.sin(i * 0.3) * 50 + Math.random() * 20,
    pressure: 2.5 + Math.cos(i * 0.2) * 0.8 + Math.random() * 0.3,
  }));

  return (
    <div className="p-4">
      <DataChart data={mockData} />
    </div>
  );
}
