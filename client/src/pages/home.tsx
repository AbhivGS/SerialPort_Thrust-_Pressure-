import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useLocation } from "wouter";
import SerialConnection from "@/components/SerialConnection";
import DataDisplay from "@/components/DataDisplay";
import DataChart from "@/components/DataChart";
import DataControls from "@/components/DataControls";
import type { DataPoint } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { clearUser, loadUser, saveUser, type StoredUser } from "@/lib/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type PercentRange = [number, number];

type DataSummary = {
  startTimestamp: string;
  endTimestamp: string;
  count: number;
  thrustMin: number;
  thrustMax: number;
  thrustAvg: number;
  pressureMin: number;
  pressureMax: number;
  pressureAvg: number;
};

const clampPercent = (value: number): number => Math.min(100, Math.max(0, value));

const sanitizeRange = (range: PercentRange): PercentRange => {
  const start = clampPercent(range[0]);
  const end = clampPercent(range[1]);
  return start <= end ? [start, end] : [end, start];
};

const sliceDataByPercent = (points: DataPoint[], range: PercentRange): DataPoint[] => {
  if (!points.length) return [];

  const [startPercent, endPercent] = sanitizeRange(range);
  const maxIndex = points.length - 1;

  if (maxIndex <= 0) {
    return points;
  }

  if (Math.abs(endPercent - startPercent) < 0.0001) {
    const index = Math.min(maxIndex, Math.round((startPercent / 100) * maxIndex));
    return [points[index]];
  }

  const startIndex = Math.max(0, Math.floor((startPercent / 100) * maxIndex));
  const endIndex = Math.max(startIndex, Math.min(maxIndex, Math.ceil((endPercent / 100) * maxIndex)));

  return points.slice(startIndex, endIndex + 1);
};

const summarizeData = (points: DataPoint[]): DataSummary | null => {
  if (!points.length) return null;

  let thrustMin = points[0].thrust;
  let thrustMax = points[0].thrust;
  let thrustSum = 0;
  let pressureMin = points[0].pressure;
  let pressureMax = points[0].pressure;
  let pressureSum = 0;

  for (const point of points) {
    thrustMin = Math.min(thrustMin, point.thrust);
    thrustMax = Math.max(thrustMax, point.thrust);
    pressureMin = Math.min(pressureMin, point.pressure);
    pressureMax = Math.max(pressureMax, point.pressure);
    thrustSum += point.thrust;
    pressureSum += point.pressure;
  }

  const count = points.length;

  return {
    startTimestamp: points[0].timestamp,
    endTimestamp: points[count - 1].timestamp,
    count,
    thrustMin,
    thrustMax,
    thrustAvg: thrustSum / count,
    pressureMin,
    pressureMax,
    pressureAvg: pressureSum / count,
  };
};

const zoomRange = (range: PercentRange, direction: "in" | "out"): PercentRange => {
  const [start, end] = sanitizeRange(range);
  const span = Math.max(end - start, 2);
  const targetSpan = direction === "in" ? Math.max(span * 0.6, 2) : Math.min(span * 1.4, 100);
  const center = (start + end) / 2;

  let nextStart = center - targetSpan / 2;
  let nextEnd = center + targetSpan / 2;

  if (nextStart < 0) {
    nextEnd = Math.min(100, nextEnd - nextStart);
    nextStart = 0;
  }

  if (nextEnd > 100) {
    const overflow = nextEnd - 100;
    nextStart = Math.max(0, nextStart - overflow);
    nextEnd = 100;
  }

  if (nextEnd - nextStart < 2) {
    nextEnd = Math.min(100, nextStart + 2);
  }

  return sanitizeRange([nextStart, nextEnd]);
};

export default function Home() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<StoredUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [streamPoints, setStreamPoints] = useState<DataPoint[]>([]);
  const [recordedPoints, setRecordedPoints] = useState<DataPoint[]>([]);
  const [currentData, setCurrentData] = useState<DataPoint | null>(null);
  const [fileName, setFileName] = useState<string>("serial-data");
  const [activeChartTab, setActiveChartTab] = useState<"live" | "review">("live");
  const [reviewRange, setReviewRange] = useState<PercentRange>([0, 100]);

  const portRef = useRef<SerialPort | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader | null>(null);
  const decoderRef = useRef(new TextDecoder());
  const bufferRef = useRef("");
  const isRecordingRef = useRef(false);
  const isStreamingRef = useRef(false);

  const hasStreamData = streamPoints.length > 0;
  const hasRecordedData = recordedPoints.length > 0;

  const updateReviewRange = useCallback((range: PercentRange) => {
    setReviewRange(sanitizeRange(range));
  }, []);

  useEffect(() => {
    const user = loadUser();
    if (!user) {
      setLocation("/login");
      setAuthChecked(true);
      return;
    }

    setCurrentUser(user);
    setAuthChecked(true);
  }, [setLocation]);

  useEffect(() => {
    if (!hasRecordedData) {
      updateReviewRange([0, 100]);
    }
  }, [hasRecordedData, updateReviewRange]);

  const sortedReviewRange = useMemo(() => sanitizeRange(reviewRange), [reviewRange]);

  const handleStopStreaming = useCallback(async () => {
    if (!isStreamingRef.current) {
      return;
    }

    isStreamingRef.current = false;
    setIsStreaming(false);

    if (readerRef.current) {
      try {
        await readerRef.current.cancel();
      } catch (error) {
        console.warn("Failed to cancel reader", error);
      }
    }
  }, []);

  const handleDisconnect = useCallback(async () => {
    await handleStopStreaming();

    if (readerRef.current) {
      try {
        readerRef.current.releaseLock();
      } catch (error) {
        console.warn("Failed to release reader lock", error);
      }
      readerRef.current = null;
    }

    if (portRef.current) {
      try {
        await portRef.current.close();
      } catch (error) {
        console.warn("Failed to close port", error);
      }
      portRef.current = null;
    }

    setIsConnected(false);
    setIsRecording(false);
    isRecordingRef.current = false;
    setCurrentData(null);
    bufferRef.current = "";
  }, [handleStopStreaming]);

  useEffect(() => {
    return () => {
      if (portRef.current) {
        void handleDisconnect();
      }
    };
  }, [handleDisconnect]);

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

  async function readSerialData() {
    if (!portRef.current?.readable || !isStreamingRef.current) {
      return;
    }

    try {
      readerRef.current = portRef.current.readable.getReader();

      while (isStreamingRef.current && readerRef.current) {
        let result: ReadableStreamReadResult<Uint8Array>;
        try {
          result = await readerRef.current.read();
        } catch (error) {
          if (!isStreamingRef.current) {
            break;
          }
          console.error("Error reading serial data:", error);
          break;
        }

        const { value, done } = result;

        if (!isStreamingRef.current) {
          break;
        }

        if (done) {
          break;
        }

        if (!value) {
          continue;
        }

        const text = decoderRef.current.decode(value, { stream: true });
        bufferRef.current += text;

        const lines = bufferRef.current.split("\n");
        bufferRef.current = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) {
            continue;
          }

          const dataPoint = parseSerialData(line);
          if (!dataPoint) {
            continue;
          }

          setCurrentData(dataPoint);
          setStreamPoints((prev) => {
            const next = [...prev, dataPoint];
            return next.length > 2000 ? next.slice(next.length - 2000) : next;
          });

          if (isRecordingRef.current) {
            setRecordedPoints((prev) => {
              const next = [...prev, dataPoint];
              return next.length > 5000 ? next.slice(next.length - 5000) : next;
            });
          }
        }
      }
    } finally {
      if (readerRef.current) {
        try {
          readerRef.current.releaseLock();
        } catch (error) {
          console.warn("Failed to release reader lock", error);
        }
        readerRef.current = null;
      }
    }
  }

  const handleConnect = async (port: SerialPort, _baudRate: number) => {
    portRef.current = port;
    setIsConnected(true);
    isStreamingRef.current = true;
    setIsStreaming(true);
    void readSerialData();
  };

  const handleResumeStreaming = useCallback(() => {
    if (isStreamingRef.current) {
      return;
    }

    if (!portRef.current?.readable) {
      return;
    }

    bufferRef.current = "";
    isStreamingRef.current = true;
    setIsStreaming(true);
    void readSerialData();
  }, []);

  const handleStartRecording = () => {
    setRecordedPoints([]);
    updateReviewRange([0, 100]);
    setIsRecording(true);
    isRecordingRef.current = true;
  };

  const handleUploadRecording = useCallback(async () => {
    if (!recordedPoints.length || isUploading) {
      return;
    }

    if (!currentUser) {
      toast({
        title: "Sign in required",
        description: "Log in again to upload recordings for admin review.",
        variant: "destructive",
      });
      setLocation("/login");
      return;
    }

    setIsUploading(true);
    try {
      const response = await fetch("/api/recordings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          fileName: fileName || "serial-data",
          points: recordedPoints.map(({ timestamp, thrust, pressure, deviceTimestamp }) => ({
            timestamp,
            thrust,
            pressure,
            deviceTimestamp,
          })),
        }),
      });

      if (response.status === 401 || response.status === 403) {
        clearUser();
        setCurrentUser(null);
        toast({
          title: "Session expired",
          description: "Please sign in again to upload recordings.",
          variant: "destructive",
        });
        setLocation("/login");
        return;
      }

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        const message = typeof payload?.message === "string" ? payload.message : "Failed to upload recording.";
        throw new Error(message);
      }

      toast({
        title: "Recording uploaded",
        description: "Admin can now review this session.",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to upload recording.";
      toast({
        title: "Upload failed",
        description: message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsUploading(false);
    }
  }, [recordedPoints, fileName, toast, isUploading, currentUser, setLocation]);

  const handleStopRecording = () => {
    setIsRecording(false);
    isRecordingRef.current = false;
  };

  const handleClearData = () => {
    setRecordedPoints([]);
    updateReviewRange([0, 100]);
  };

  const handleExportCSV = () => {
    if (!recordedPoints.length) {
      return;
    }

    const csvHeader = "Timestamp,Thrust (g),Pressure (bar)\n";
    const csvRows = recordedPoints
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

    fetch("/api/logout", { method: "POST", credentials: "include" }).finally(() => {

      clearUser();

      toast({

        title: "Signed out",

        description: "You have been logged out successfully.",

      });

      setLocation("/login");

    });

  };

  const liveData = useMemo(() => streamPoints.slice(-100), [streamPoints]);
  const reviewData = useMemo(() => sliceDataByPercent(recordedPoints, sortedReviewRange), [recordedPoints, sortedReviewRange]);
  const reviewSummary = useMemo(() => summarizeData(reviewData), [reviewData]);

  const handleReviewZoom = (direction: "in" | "out") => {
    setReviewRange((prev) => zoomRange(prev, direction));
  };

  const handleReviewLatest = () => {
    const span = Math.max(sortedReviewRange[1] - sortedReviewRange[0], 10);
    updateReviewRange([Math.max(0, 100 - span), 100]);
  };

  const handleReviewBeginning = () => {
    const span = Math.max(sortedReviewRange[1] - sortedReviewRange[0], 10);
    updateReviewRange([0, Math.min(100, span)]);
  };

  if (!authChecked) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-semibold">Serial Port Data Monitor</h1>
            <p className="text-muted-foreground">Real-time monitoring of thrust and pressure data from serial port</p>
          </div>
          {currentUser && (
            <div className="flex items-center gap-3">
              <div className="text-sm text-muted-foreground">
                Signed in as <span className="font-medium text-foreground">{currentUser.fullName}</span>
              </div>
              {currentUser.role === 'admin' && (
                <Button variant="outline" size="sm" onClick={() => setLocation('/admin')}>
                  Admin
                </Button>
              )}
              <Button variant="outline" onClick={handleLogout}>
                Log out
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          <div className="space-y-6 lg:col-span-1">
            <SerialConnection onConnect={handleConnect} onDisconnect={handleDisconnect} isConnected={isConnected} />

            <DataDisplay currentData={currentData} dataPointCount={streamPoints.length} isRecording={isRecording} />

            <DataControls
              isRecording={isRecording}
              onStartRecording={handleStartRecording}
              onStopRecording={handleStopRecording}
              onClearData={handleClearData}
              onExportCSV={handleExportCSV}
              onUploadRecording={handleUploadRecording}
              recordedPoints={recordedPoints}
              fileName={fileName}
              onFileNameChange={setFileName}
              isStreaming={isStreaming}
              onStopStreaming={handleStopStreaming}
              onResumeStreaming={handleResumeStreaming}
              isUploading={isUploading}
            />
          </div>

          <div className="space-y-4 lg:col-span-3">
            <Tabs
              value={activeChartTab}
              onValueChange={(value) => setActiveChartTab(value as "live" | "review")}
              className="space-y-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <TabsList>
                  <TabsTrigger value="live">Live Stream</TabsTrigger>
                  <TabsTrigger value="review" disabled={!hasRecordedData}>
                    Recorded Review
                  </TabsTrigger>
                </TabsList>
                {activeChartTab === "review" && hasRecordedData && reviewSummary && (
                  <div className="text-xs font-medium text-muted-foreground sm:text-sm">
                    Showing {reviewSummary.count} points from {reviewSummary.startTimestamp} &rarr; {reviewSummary.endTimestamp}
                  </div>
                )}
              </div>

              <TabsContent value="live" className="space-y-4">
                {hasStreamData ? (
                  <DataChart
                    data={liveData}
                    maxDataPoints={100}
                    title="Real-Time Data Chart"
                    emptyMessage="Waiting for incoming serial data."
                  />
                ) : (
                  <Card>
                    <CardContent className="flex h-[400px] items-center justify-center text-center text-sm text-muted-foreground">
                      Connect to a serial device to begin streaming and visualise live data here.
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="review" className="space-y-4">
                {hasRecordedData ? (
                  <>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Recorded Timeline</CardTitle>
                        <CardDescription>
                          Drag the handles or use the quick actions to focus on your captured session.
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
                              updateReviewRange([start, end]);
                            }}
                          />
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleReviewZoom("in")}>Zoom In</Button>
                          <Button variant="outline" size="sm" onClick={() => handleReviewZoom("out")}>Zoom Out</Button>
                          <Button variant="outline" size="sm" onClick={handleReviewLatest}>Jump to Latest</Button>
                          <Button variant="outline" size="sm" onClick={handleReviewBeginning}>Jump to Start</Button>
                          <Button variant="ghost" size="sm" onClick={() => updateReviewRange([0, 100])}>Reset</Button>
                        </div>
                        <div className="grid grid-cols-1 gap-4 text-xs sm:grid-cols-2 xl:grid-cols-3 sm:text-sm">
                          <div>
                            <p className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">Window %</p>
                            <p className="font-mono text-sm">{sortedReviewRange[0].toFixed(0)} - {sortedReviewRange[1].toFixed(0)}</p>
                          </div>
                          <div>
                            <p className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">Window start</p>
                            <p className="font-mono text-sm">{reviewSummary?.startTimestamp ?? "--:--:--"}</p>
                          </div>
                          <div>
                            <p className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">Window end</p>
                            <p className="font-mono text-sm">{reviewSummary?.endTimestamp ?? "--:--:--"}</p>
                          </div>
                          <div>
                            <p className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">Points selected</p>
                            <p className="font-mono text-sm">{reviewSummary?.count ?? 0}</p>
                          </div>
                          <div>
                            <p className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">Thrust range (g)</p>
                            <p className="font-mono text-sm">
                              {reviewSummary
                                ? `${reviewSummary.thrustMin.toFixed(2)} - ${reviewSummary.thrustMax.toFixed(2)}`
                                : "0.00 - 0.00"}
                            </p>
                          </div>
                          <div>
                            <p className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">Pressure range (bar)</p>
                            <p className="font-mono text-sm">
                              {reviewSummary
                                ? `${reviewSummary.pressureMin.toFixed(2)} - ${reviewSummary.pressureMax.toFixed(2)}`
                                : "0.00 - 0.00"}
                            </p>
                          </div>
                          <div>
                            <p className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">Average readings</p>
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
                      maxDataPoints={null}
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










