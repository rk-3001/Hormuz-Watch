import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';

import Command from '@/pages/command';
import Simulator from '@/pages/simulator';
import Recommendations from '@/pages/recommendations';
import Reserves from '@/pages/reserves';
import GeospatialMap from '@/pages/map';

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Command} />
      <Route path="/simulate" component={Simulator} />
      <Route path="/recommendations" component={Recommendations} />
      <Route path="/reserves" component={Reserves} />
      <Route path="/map" component={GeospatialMap} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
