import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Portfolio from "@/pages/portfolio";
import Trading from "@/pages/trading";
import Strategies from "@/pages/strategies";
import Analytics from "@/pages/analytics";
import History from "@/pages/history";
import PaperTrading from "@/pages/paper-trading";
import Account from "@/pages/account";
import Login from "@/pages/login";
import SignUp from "@/pages/signup";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <Switch>
      {isAuthenticated ? (
        // Authenticated routes
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/portfolio" component={Portfolio} />
          <Route path="/trading" component={Trading} />
          <Route path="/strategies" component={Strategies} />
          <Route path="/analytics" component={Analytics} />
          <Route path="/history" component={History} />
          <Route path="/paper-trading" component={PaperTrading} />
          <Route path="/account" component={Account} />
          <Route path="/login" component={() => { window.location.href = '/'; return null; }} />
          <Route path="/signup" component={() => { window.location.href = '/'; return null; }} />
          <Route component={NotFound} />
        </>
      ) : (
        // Unauthenticated routes
        <>
          <Route path="/" component={Login} />
          <Route path="/login" component={Login} />
          <Route path="/signup" component={SignUp} />
          <Route component={Login} />
        </>
      )}
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="dark">
          <Toaster />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
