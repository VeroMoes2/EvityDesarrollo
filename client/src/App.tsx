import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/Landing";
import Home from "@/pages/Home";
import Profile from "@/pages/Profile";
import MisArchivos from "@/pages/MisArchivos";
import Admin from "@/pages/Admin";
import Debug from "@/pages/Debug";
import BlogPost from "@/pages/BlogPost";
import Resource from "@/pages/Resource";
import AllBlog from "@/pages/AllBlog";
import AllResources from "@/pages/AllResources";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import VerifyEmail from "@/pages/VerifyEmail";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  // If loading, show a loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        // When not authenticated, show public pages and auth pages
        <>
          <Route path="/" component={Landing} />
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
          <Route path="/forgot-password" component={ForgotPassword} />
          <Route path="/reset-password" component={ResetPassword} />
          <Route path="/verify-email" component={VerifyEmail} />
          <Route path="/perfil" component={Landing} />
          <Route path="/admin" component={Landing} />
          <Route path="/debug" component={Landing} />
          <Route path="/blog/:slug" component={BlogPost} />
          <Route path="/recurso/:slug" component={Resource} />
          <Route path="/blog" component={AllBlog} />
          <Route path="/recursos" component={AllResources} />
        </>
      ) : (
        // When authenticated, show protected routes and redirect auth pages to profile
        <>
          <Route path="/" component={Home} />
          <Route path="/profile" component={Profile} />
          <Route path="/perfil" component={Profile} />
          <Route path="/mis-archivos" component={MisArchivos} />
          <Route path="/archivos" component={MisArchivos} />
          <Route path="/admin" component={Admin} />
          <Route path="/debug" component={Debug} />
          <Route path="/login" component={Profile} />
          <Route path="/register" component={Profile} />
          <Route path="/forgot-password" component={Profile} />
          <Route path="/reset-password" component={Profile} />
          <Route path="/verify-email" component={VerifyEmail} />
          <Route path="/blog/:slug" component={BlogPost} />
          <Route path="/recurso/:slug" component={Resource} />
          <Route path="/blog" component={AllBlog} />
          <Route path="/recursos" component={AllResources} />
        </>
      )}
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
