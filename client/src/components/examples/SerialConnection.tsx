import { useState } from 'react';
import SerialConnection from '../SerialConnection';

export default function SerialConnectionExample() {
  const [isConnected, setIsConnected] = useState(false);

  return (
    <div className="p-4">
      <SerialConnection
        onConnect={(port, baudRate) => {
          console.log('Connected to port with baud rate:', baudRate);
          setIsConnected(true);
        }}
        onDisconnect={() => {
          console.log('Disconnected from port');
          setIsConnected(false);
        }}
        isConnected={isConnected}
      />
    </div>
  );
}
