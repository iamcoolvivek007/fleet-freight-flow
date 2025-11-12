import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Trucks from "./pages/Trucks";
import LoadProviders from "./pages/LoadProviders";
import Loads from "./pages/Loads";
import Transactions from "./pages/Transactions";
import Reports from "./pages/Reports";
import AppLayout from "./components/layout/AppLayout";
import AdminLayout from "./components/layout/AdminLayout";
import UserManagement from "./pages/UserManagement";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/layout/ProtectedRoute";

const queryClient = new QueryClient();

/**
 * @name App
 * @description The main application component.
 * @returns {JSX.Element} - The JSX for the component.
 */
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<ProtectedRoute page="dashboard"><Dashboard /></ProtectedRoute>} />
            <Route path="/trucks" element={<ProtectedRoute page="trucks"><Trucks /></ProtectedRoute>} />
            <Route path="/load-providers" element={<ProtectedRoute page="load-providers"><LoadProviders /></ProtectedRoute>} />
            <Route path="/loads" element={<ProtectedRoute page="loads"><Loads /></ProtectedRoute>} />
            <Route path="/transactions" element={<ProtectedRoute page="transactions"><Transactions /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute page="reports"><Reports /></ProtectedRoute>} />
          </Route>
          <Route element={<AdminLayout />}>
            <Route path="/user-management" element={<UserManagement />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
