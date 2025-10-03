import { useState, useEffect, useRef, useMemo } from "react";
import { useLocation } from "wouter";
import SerialConnection from "@/components/SerialConnection";
import DataDisplay from "@/components/DataDisplay";
import DataChart from "@/components/DataChart";
import DataControls from "@/components/DataControls";
import type { DataPoint } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { clearUser, loadUser, type StoredUser } from "@/lib/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<StoredUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);
  const [currentData, setCurrentData] = useState<DataPoint | null>(null);
  const [fileName, setFileName] = useState<string>("serial-data");
  const [activeChartTab, setActiveChartTab] = useState<"live" | "review">("live");
  const [reviewRange, setReviewRange] = useState<[number, number]>([75, 100]);

  const portRef = useRef<SerialPort | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader | null>(null);
  const decoderRef = useRef(new TextDecoder());
  const bufferRef = useRef("");
  const isRecordingRef = useRef(false);

  const hasData = dataPoints.length > 0;

  useEffect(() => {
    const user = loadUser();
    if (!user) {
      setLocation("/login");
      return;
    }

    setCurrentUser(user);
    setAuthChecked(true);
  }, [setLocation]);

  useEffect(() => {
    if (!hasData) {
      setReviewRange([0, 100]);
    }
  }, [hasData]);

  const parseSerialData = (line: string) => {
    const parts = line.trim().split(",").map((p) => p.trim());
    const timestamp = new Date().toISOString().slice(11, 19);
    if (parts.length === 2 || parts.length === 3) {
      const lastTwo = parts.slice(-2);
      const thrust = parseFloat(lastTwo[0]);
      const pressure = parseFloat(lastTwo[1]);
      if (!Number.isNaN(thrust) && !Number.isNaN(pressure)) {
        const deviceTimestamp = parts.length === 3 ? parts[0] : undefined;
        return { timestamp, thrust, pressure, deviceTimestamp };
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

        const lines = bufferRef.current.split("\n");
        bufferRef.current = lines.pop() || "";

        for (const line of lines) {
          if (line.trim()) {
            const dataPoint = parseSerialData(line);
            if (dataPoint) {
              setCurrentData(dataPoint);
              setDataPoints((prev) => {
                const next = [...prev, dataPoint];
                return next.length > 2000 ? next.slice(next.length - 2000) : next;
              });
            }
          }
        }
      }
    } catch (error) {
      console.error("Error reading serial data:", error);
    }
  };

  const handleConnect = async (port: SerialPort, _baudRate: number) => {
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
    isRecordingRef.current = false;
    bufferRef.current = "";
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    isRecordingRef.current = true;
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    isRecordingRef.current = false;
  };

  const handleClearData = () => {
    setDataPoints([]);
    setCurrentData(null);
  };

  const handleExportCSV = () => {
    const csvHeader = "Timestamp,Thrust (g),Pressure (bar)\n";
    const csvRows = dataPoints
      .map((d) => `${(d as any).deviceTimestamp || d.timestamp},${d.thrust},${d.pressure}`)
      .join("\n");
    const csv = csvHeader + csvRows;

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const safeBase = (fileName || "serial-data").replace(/[^a-zA-Z0-9-_]/g, "_");
    a.download = `${safeBase}-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleLogout = () => {
    clearUser();
    toast({
      title: "Signed out",
      description: "You have been logged out successfully.",
    });
    setLocation("/login");
  };

  useEffect(() => {
    return () => {
      if (portRef.current) {
        void handleDisconnect();
      }
    };
  }, []);

  const sortedReviewRange = useMemo<[number, number]>(() => {
    const [start, end] = reviewRange;
    return [Math.min(start, end), Math.max(start, end)];
  }, [reviewRange]);

  const reviewData = useMemo<DataPoint[]>(() => {
    if (!hasData) {
      return [];
    }

    const [startPercent, endPercent] = sortedReviewRange;
    const maxIndex = dataPoints.length - 1;

    if (maxIndex <= 0) {
      return dataPoints;
    }

    const startIndex = Math.max(0, Math.floor((startPercent / 100) * maxIndex));
    const endIndex = Math.max(startIndex, Math.min(maxIndex, Math.ceil((endPercent / 100) * maxIndex)));

    return dataPoints.slice(startIndex, endIndex + 1);
  }, [dataPoints, hasData, sortedReviewRange]);

  const reviewSummary = useMemo(() => {
    if (reviewData.length === 0) {
      return null;
    }

    let thrustMin = reviewData[0].thrust;
    let thrustMax = reviewData[0].thrust;
    let thrustSum = 0;
    let pressureMin = reviewData[0].pressure;
    let pressureMax = reviewData[0].pressure;
    let pressureSum = 0;

    for (const point of reviewData) {
      thrustMin = Math.min(thrustMin, point.thrust);
      thrustMax = Math.max(thrustMax, point.thrust);
      pressureMin = Math.min(pressureMin, point.pressure);
      pressureMax = Math.max(pressureMax, point.pressure);
      thrustSum += point.thrust;
      pressureSum += point.pressure;
    }

    const count = reviewData.length;

    return {
      startTimestamp: reviewData[0].timestamp,
      endTimestamp: reviewData[count - 1].timestamp,
      count,
      thrustMin,
      thrustMax,
      thrustAvg: thrustSum / count,
      pressureMin,
      pressureMax,
      pressureAvg: pressureSum / count,
    };
  }, [reviewData]);

  if (!authChecked) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold mb-2">Serial Port Data Monitor</h1>
            <p className="text-muted-foreground">
              Real-time monitoring of thrust and pressure data from serial port
            </p>
          </div>
          {currentUser && (
            <div className="flex items-center gap-3">
              <div className="text-sm text-muted-foreground">
                Signed in as <span className="font-medium text-foreground">{currentUser.fullName}</span>
              </div>
              <Button variant="outline" onClick={handleLogout}>
                Log out
              </Button>
            </div>
          )}
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
              fileName={fileName}
              onFileNameChange={setFileName}
            />
          </div>

          <div className="lg:col-span-3 space-y-4">
            <Tabs
              value={activeChartTab}
              onValueChange={(value) => setActiveChartTab(value as "live" | "review")}
              className="space-y-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <TabsList>
                  <TabsTrigger value="live">Live Stream</TabsTrigger>
                  <TabsTrigger value="review" disabled={!hasData}>
                    Recorded Review
                  </TabsTrigger>
                </TabsList>
                {activeChartTab === "review" && hasData && reviewSummary && (
                  <div className="text-xs sm:text-sm text-muted-foreground font-medium">
                    Showing {reviewSummary.count} points from {reviewSummary.startTimestamp} &rarr; {reviewSummary.endTimestamp}
                  </div>
                )}
              </div>

              <TabsContent value="live">
                <DataChart data={dataPoints} maxDataPoints={100} title="Real-Time Data Chart" />
              </TabsContent>

              <TabsContent value="review" className="space-y-4">
                {hasData ? (
                  <>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Recorded Timeline</CardTitle>
                        <CardDescription>
                          Drag the handles to focus on a slice of your captured session.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-5">
                        <div className="px-1">
                          <Slider
                            value={sortedReviewRange}
                            min={0}
                            max={100}
                            step={1}
                            onValueChange={(value) => {
                              const [start, end] = value.length === 1 ? [value[0], value[0]] : [value[0], value[1]];
                              setReviewRange([Math.max(0, Math.min(100, start)), Math.max(0, Math.min(100, end))]);
                            }}
                          />
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 text-xs sm:text-sm">
                          <div>
                            <p className="uppercase tracking-wide text-[0.65rem] text-muted-foreground">Window start</p>
                            <p className="font-mono text-sm">{reviewSummary?.startTimestamp ?? "--:--:--"}</p>
                          </div>
                          <div>
                            <p className="uppercase tracking-wide text-[0.65rem] text-muted-foreground">Window end</p>
                            <p className="font-mono text-sm">{reviewSummary?.endTimestamp ?? "--:--:--"}</p>
                          </div>
                          <div>
                            <p className="uppercase tracking-wide text-[0.65rem] text-muted-foreground">Points selected</p>
                            <p className="font-mono text-sm">{reviewSummary?.count ?? 0}</p>
                          </div>
                          <div>
                            <p className="uppercase tracking-wide text-[0.65rem] text-muted-foreground">Thrust range (g)</p>
                            <p className="font-mono text-sm">
                              {reviewSummary
                                ? `${reviewSummary.thrustMin.toFixed(2)} – ${reviewSummary.thrustMax.toFixed(2)}`
                                : "0.00 – 0.00"}
                            </p>
                          </div>
                          <div>
                            <p className="uppercase tracking-wide text-[0.65rem] text-muted-foreground">Pressure range (bar)</p>
                            <p className="font-mono text-sm">
                              {reviewSummary
                                ? `${reviewSummary.pressureMin.toFixed(2)} – ${reviewSummary.pressureMax.toFixed(2)}`
                                : "0.00 – 0.00"}
                            </p>
                          </div>
                          <div>
                            <p className="uppercase tracking-wide text-[0.65rem] text-muted-foreground">Average readings</p>
                            <p className="font-mono text-sm">
                              {reviewSummary
                                ? `${reviewSummary.thrustAvg.toFixed(2)} g / ${reviewSummary.pressureAvg.toFixed(2)} bar`
                                : "0.00 g / 0.00 bar"}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <DataChart
                      data={reviewData}
                      maxDataPoints={reviewData.length || null}
                      title="Recorded Data Chart"
                      emptyMessage="No recorded points in this window. Adjust the timeline above to explore your capture."
                    />
                  </>
                ) : (
                  <Card>
                    <CardContent className="flex h-[400px] items-center justify-center text-center text-sm text-muted-foreground">
                      Start recording to populate the timeline. Captured data will appear here for review.
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
