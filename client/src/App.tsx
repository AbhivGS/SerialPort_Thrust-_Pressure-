import { Switch, Route } from 'wouter';
import { queryClient } from './lib/queryClient';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import Home from '@/pages/home';
import NotFound from '@/pages/not-found';
import Admin from '@/pages/admin';
import { useState } from 'react';
import Splash from '@/components/Splash';
import Login from '@/pages/login';

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/" component={Home} />
      <Route path="/admin" component={Admin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [booted, setBooted] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        {!booted && <Splash onDone={() => setBooted(true)} />}
        <div className={booted ? 'opacity-100' : 'opacity-0 transition-opacity duration-300'}>
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
