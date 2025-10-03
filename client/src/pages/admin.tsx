import { useEffect, useState, useCallback } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { loadUser } from "@/lib/auth";

interface RecordingListItem {
  id: number;
  username: string;
  fullName: string;
  fileName: string;
  createdAt: string;
}

interface ListResponse {
  recordings: RecordingListItem[];
}

export default function Admin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [recordings, setRecordings] = useState<RecordingListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const user = loadUser();
    if (!user || user.role !== "admin") {
      setLocation("/");
      return;
    }
  }, [setLocation]);

  const fetchRecordings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/recordings", { credentials: "include" });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = typeof payload?.message === "string" ? payload.message : "Failed to load recordings.";
        throw new Error(message);
      }

      const data = payload as ListResponse;
      setRecordings(data.recordings);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load recordings.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecordings();
    const interval = window.setInterval(fetchRecordings, 10000);
    return () => window.clearInterval(interval);
  }, [fetchRecordings]);

  const handleCopyLink = (id: number) => {
    const url = `${window.location.origin}/api/recordings/${id}/download`;
    navigator.clipboard
      .writeText(url)
      .then(() => {
        toast({ title: "Link copied", description: "Download link copied to clipboard." });
      })
      .catch(() => {
        toast({
          title: "Copy failed",
          description: "Unable to copy link to clipboard.",
          variant: "destructive",
        });
      });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Uploaded Recordings</h1>
            <p className="text-muted-foreground">Review CSV sessions shared by the test team.</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Data Sessions</CardTitle>
            <CardDescription>
              {error ? error : "Latest uploads appear at the top."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading recordings...</p>
            ) : recordings.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recordings uploaded yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">ID</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>File name</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recordings.map((recording) => (
                    <TableRow key={recording.id}>
                      <TableCell className="font-mono text-xs">{recording.id}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{recording.fullName}</span>
                          <span className="text-xs text-muted-foreground">@{recording.username}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{recording.fileName}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(recording.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopyLink(recording.id)}
                        >
                          Copy link
                        </Button>
                        <Button
                          size="sm"
                          asChild
                          variant="default"
                        >
                          <a href={`/api/recordings/${recording.id}/download`} target="_blank" rel="noreferrer">
                            Download
                          </a>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
