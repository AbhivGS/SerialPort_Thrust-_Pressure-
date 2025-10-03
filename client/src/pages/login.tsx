import { useState, useEffect, FormEvent } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { loadUser, saveUser, type StoredUser } from "@/lib/auth";
import SpaceBackdrop from "@/components/SpaceBackdrop";

interface LoginSuccessResponse {
  user: StoredUser;
}

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (loadUser()) {
      setLocation("/");
    }
  }, [setLocation]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message = typeof payload?.message === "string"
          ? payload.message
          : "Unable to log in with the provided credentials.";
        throw new Error(message);
      }

      const data = payload as LoginSuccessResponse;
      saveUser(data.user);

      toast({
        title: "Login successful",
        description: `Welcome back, ${data.user.fullName}!`,
      });

      setLocation("/");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed. Please try again.";
      setErrorMessage(message);
      toast({
        title: "Login failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#050816]">
      <SpaceBackdrop className="opacity-95" />

      <Card className="relative z-10 w-full max-w-md border border-white/10 bg-card/95 backdrop-blur-sm shadow-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">Welcome back</CardTitle>
          <CardDescription className="text-muted-foreground">
            Sign in with your project credentials to access the Serial Grapher dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                autoComplete="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>
            {errorMessage && (
              <p className="text-sm text-destructive">{errorMessage}</p>
            )}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
