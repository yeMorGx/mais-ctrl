import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { DevelopmentBanner } from "@/components/DevelopmentBanner";
import { FeedbackWidget } from "@/components/FeedbackWidget";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Pricing from "./pages/Pricing";
import Support from "./pages/Support";
import AdminPanel from "./pages/AdminPanel";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import ShareInvite from "./pages/ShareInvite";
import Invite from "./pages/Invite";
import Changelog from "./pages/Changelog";
import Affiliates from "./pages/Affiliates";
import Affiliate from "./pages/Affiliate";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <BrowserRouter>
          <DevelopmentBanner />
          <Toaster />
          <Sonner />
          <FeedbackWidget />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/support" element={<Support />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/share/invite/:subscriptionId" element={<ShareInvite />} />
            <Route path="/invite" element={<Invite />} />
            <Route path="/changelog" element={<Changelog />} />
            <Route path="/affiliates" element={<Affiliates />} />
            <Route path="/affiliate" element={<Affiliate />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
