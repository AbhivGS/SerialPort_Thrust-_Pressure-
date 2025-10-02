import { useState, useEffect, useRef } from 'react';
import SerialConnection from '@/components/SerialConnection';
import DataDisplay from '@/components/DataDisplay';
import DataChart from '@/components/DataChart';
import DataControls from '@/components/DataControls';
import type { DataPoint } from '@shared/schema';

export default function Home() {
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);
  const [currentData, setCurrentData] = useState<DataPoint | null>(null);
  
  const portRef = useRef<SerialPort | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader | null>(null);
  const decoderRef = useRef(new TextDecoder());
  const bufferRef = useRef('');

  const parseSerialData = (line: string) => {
    const parts = line.trim().split(',');
    if (parts.length === 3) {
      const timestamp = parts[0].trim();
      const thrust = parseFloat(parts[1].trim());
      const pressure = parseFloat(parts[2].trim());

      if (!isNaN(thrust) && !isNaN(pressure)) {
        return { timestamp, thrust, pressure };
      }
    }
    return null;
  };

  const readSerialData = async () => {
    if (!portRef.current?.readable) return;

    try {
      readerRef.current = portRef.current.readable.getReader();
      
      while (readerRef.current) {
        const { value, done } = await readerRef.current.read();
        
        if (done) {
          readerRef.current.releaseLock();
          break;
        }

        const text = decoderRef.current.decode(value, { stream: true });
        bufferRef.current += text;

        const lines = bufferRef.current.split('\n');
        bufferRef.current = lines.pop() || '';

        for (const line of lines) {
          if (line.trim()) {
            const dataPoint = parseSerialData(line);
            if (dataPoint) {
              setCurrentData(dataPoint);
              if (isRecording) {
                setDataPoints(prev => [...prev, dataPoint]);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error reading serial data:', error);
    }
  };

  const handleConnect = async (port: SerialPort, baudRate: number) => {
    portRef.current = port;
    setIsConnected(true);
    readSerialData();
  };

  const handleDisconnect = async () => {
    if (readerRef.current) {
      await readerRef.current.cancel();
      readerRef.current = null;
    }

    if (portRef.current) {
      await portRef.current.close();
      portRef.current = null;
    }

    setIsConnected(false);
    setIsRecording(false);
    bufferRef.current = '';
  };

  const handleStartRecording = () => {
    setIsRecording(true);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
  };

  const handleClearData = () => {
    setDataPoints([]);
    setCurrentData(null);
  };

  const handleExportCSV = () => {
    const csvHeader = 'Timestamp,Thrust (g),Pressure (bar)\n';
    const csvRows = dataPoints.map(d => `${d.timestamp},${d.thrust},${d.pressure}`).join('\n');
    const csv = csvHeader + csvRows;

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `serial-data-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    return () => {
      if (portRef.current) {
        handleDisconnect();
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold mb-2">Serial Port Data Monitor</h1>
          <p className="text-muted-foreground">
            Real-time monitoring of thrust and pressure data from serial port
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <SerialConnection
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
              isConnected={isConnected}
            />

            <DataDisplay
              currentData={currentData}
              dataPointCount={dataPoints.length}
              isRecording={isRecording}
            />

            <DataControls
              isRecording={isRecording}
              onStartRecording={handleStartRecording}
              onStopRecording={handleStopRecording}
              onClearData={handleClearData}
              onExportCSV={handleExportCSV}
              dataPoints={dataPoints}
            />
          </div>

          <div className="lg:col-span-3">
            <DataChart data={dataPoints} maxDataPoints={100} />
          </div>
        </div>
      </div>
    </div>
  );
}
