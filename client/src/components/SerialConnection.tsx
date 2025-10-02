import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plug, PlugZap } from 'lucide-react';

interface SerialConnectionProps {
  onConnect: (port: SerialPort, baudRate: number) => void;
  onDisconnect: () => void;
  isConnected: boolean;
}

const BAUD_RATES = [9600, 19200, 38400, 57600, 115200, 230400, 460800, 921600];

export default function SerialConnection({ onConnect, onDisconnect, isConnected }: SerialConnectionProps) {
  const [baudRate, setBaudRate] = useState<number>(115200);
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    if (!('serial' in navigator)) {
      alert('Web Serial API is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    try {
      setIsConnecting(true);
      const port = await (navigator as any).serial.requestPort();
      await port.open({ baudRate });
      onConnect(port, baudRate);
    } catch (error) {
      console.error('Error connecting to serial port:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    onDisconnect();
  };

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-lg">Serial Port Connection</CardTitle>
        <CardDescription>Configure and connect to your device</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Baud Rate</label>
          <Select
            value={baudRate.toString()}
            onValueChange={(value) => setBaudRate(Number(value))}
            disabled={isConnected}
          >
            <SelectTrigger data-testid="select-baud-rate">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BAUD_RATES.map((rate) => (
                <SelectItem key={rate} value={rate.toString()}>
                  {rate} baud
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Status:</span>
            <Badge 
              variant={isConnected ? "default" : "secondary"}
              className={isConnected ? "bg-chart-3" : ""}
              data-testid="badge-connection-status"
            >
              {isConnected ? (
                <>
                  <PlugZap className="w-3 h-3 mr-1" />
                  Connected
                </>
              ) : (
                <>
                  <Plug className="w-3 h-3 mr-1" />
                  Disconnected
                </>
              )}
            </Badge>
          </div>
        </div>

        {!isConnected ? (
          <Button
            onClick={handleConnect}
            disabled={isConnecting}
            className="w-full"
            data-testid="button-connect"
          >
            {isConnecting ? 'Connecting...' : 'Connect to Serial Port'}
          </Button>
        ) : (
          <Button
            onClick={handleDisconnect}
            variant="destructive"
            className="w-full"
            data-testid="button-disconnect"
          >
            Disconnect
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
