import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/Home";
import Debug from "@/pages/Debug";
import BlogPost from "@/pages/BlogPost";
import Resource from "@/pages/Resource";
import AllBlog from "@/pages/AllBlog";
import AllResources from "@/pages/AllResources";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/debug" component={Debug} />
      <Route path="/blog/:slug" component={BlogPost} />
      <Route path="/recurso/:slug" component={Resource} />
      <Route path="/blog" component={AllBlog} />
      <Route path="/recursos" component={AllResources} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
