import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import Index from "./pages/Index";
import Tables from "./pages/Tables";
import TableSettings from "./pages/TableSettings";
import Statistics from "./pages/Statistics";
import HallMap from "./pages/HallMap";
import Documents from "./pages/Documents";
import Integrations from "./pages/Integrations";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoutes = () => {
  const { isAuthed } = useAuth();
  if (!isAuthed) return <Navigate to="/login" replace />;
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/tables" element={<Tables />} />
      <Route path="/table-settings" element={<TableSettings />} />
      <Route path="/statistics" element={<Statistics />} />
      <Route path="/hall-map" element={<HallMap />} />
      <Route path="/documents" element={<Documents />} />
      <Route path="/integrations" element={<Integrations />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginGuard />} />
            <Route path="*" element={<ProtectedRoutes />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

const LoginGuard = () => {
  const { isAuthed } = useAuth();
  return isAuthed ? <Navigate to="/" replace /> : <Login />;
};

export default App;