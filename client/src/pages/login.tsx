import { useState, useEffect, FormEvent } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { loadUser, saveUser } from '@/lib/auth';

interface LoginSuccessResponse {
  user: {
    id: string;
    username: string;
    fullName: string;
  };
}

const starPositions = Array.from({ length: 28 }, (_, index) => {
  const top = (index * 13) % 100;
  const left = (index * 37) % 100;
  const size = 1.4 + (index % 4) * 0.7;
  const duration = 4 + (index % 5);
  const delay = (index % 6) * 0.45;
  const opacity = 0.35 + (index % 5) * 0.12;

  return {
    top: `${top}%`,
    left: `${left}%`,
    size: `${size.toFixed(1)}px`,
    duration: `${duration}s`,
    delay: `${delay}s`,
    opacity,
  };
});

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (loadUser()) {
      setLocation('/');
    }
  }, [setLocation]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message = typeof payload?.message === 'string'
          ? payload.message
          : 'Unable to log in with the provided credentials.';
        throw new Error(message);
      }

      const data = payload as LoginSuccessResponse;
      saveUser(data.user);

      toast({
        title: 'Login successful',
        description: `Welcome back, ${data.user.fullName}!`,
      });

      setLocation('/');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed. Please try again.';
      setErrorMessage(message);
      toast({
        title: 'Login failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#050816]">
      <div className="login-scene" aria-hidden="true">
        {starPositions.map((star, index) => (
          <span
            key={`star-${index}`}
            className="login-star"
            style={{
              top: star.top,
              left: star.left,
              width: star.size,
              height: star.size,
              animationDuration: star.duration,
              animationDelay: star.delay,
              opacity: star.opacity,
            }}
          />
        ))}
        <div className="login-planet" aria-hidden="true" />
        <div className="login-rocket" aria-hidden="true">
          <div className="login-rocket__trail" />
          <svg
            className="login-rocket__svg"
            viewBox="0 0 64 96"
            role="img"
            aria-label="Rocket launch animation"
          >
            <defs>
              <linearGradient id="rocket-body-gradient" x1="0%" x2="0%" y1="0%" y2="100%">
                <stop offset="0%" stopColor="#e9f2ff" />
                <stop offset="65%" stopColor="#b6cdfd" />
                <stop offset="100%" stopColor="#8ba8f9" />
              </linearGradient>
              <linearGradient id="rocket-fin-gradient" x1="0%" x2="100%" y1="0%" y2="0%">
                <stop offset="0%" stopColor="#7c90ff" />
                <stop offset="100%" stopColor="#4f63e0" />
              </linearGradient>
              <radialGradient id="rocket-window-gradient" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
                <stop offset="65%" stopColor="#8ad9ff" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#1f6dff" stopOpacity="0.9" />
              </radialGradient>
            </defs>
            <path
              d="M32 6C24 14 21 30 21 48V66L32 90L43 66V48C43 30 40 14 32 6Z"
              fill="url(#rocket-body-gradient)"
              stroke="#f8fbff"
              strokeWidth="1.2"
            />
            <path
              d="M21 58L10 74H21V58Z"
              fill="url(#rocket-fin-gradient)"
              stroke="#6174f0"
              strokeWidth="1"
            />
            <path
              d="M43 58L54 74H43V58Z"
              fill="url(#rocket-fin-gradient)"
              stroke="#6174f0"
              strokeWidth="1"
            />
            <circle cx="32" cy="40" r="9" fill="url(#rocket-window-gradient)" stroke="#dce8ff" strokeWidth="1" />
            <path d="M27 68H37" stroke="#6c7bff" strokeWidth="2" strokeLinecap="round" />
            <path
              d="M32 6C28 12 26 22 26 32H38C38 22 36 12 32 6Z"
              fill="#f7fbff"
              opacity="0.85"
            />
          </svg>
          <div className="login-rocket__flame" />
        </div>
      </div>

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
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
