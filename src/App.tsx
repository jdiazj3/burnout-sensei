import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Demo from "./pages/Demo";
import Dashboard from "./pages/Dashboard";
import Survey from "./pages/Survey";
import HealthSurvey from "./pages/HealthSurvey";
import HealthRecommendations from "./pages/HealthRecommendations";
import ExerciseBot from "./pages/ExerciseBot";
import Admin from "./pages/Admin";
import CompanyManagement from "./pages/CompanyManagement";
import UserManagement from "./pages/UserManagement";
import CompanyDashboard from "./pages/CompanyDashboard";
import PaymentManagement from "./pages/PaymentManagement";
import PaymentDashboard from "./pages/PaymentDashboard";
import Recommendations from "./pages/Recommendations";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/demo" element={<Demo />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/survey"
            element={
              <ProtectedRoute>
                <Survey />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recommendations"
            element={
              <ProtectedRoute>
                <Recommendations />
              </ProtectedRoute>
            }
          />
          <Route
            path="/health-survey"
            element={
              <ProtectedRoute>
                <HealthSurvey />
              </ProtectedRoute>
            }
          />
          <Route
            path="/health-recommendations"
            element={
              <ProtectedRoute>
                <HealthRecommendations />
              </ProtectedRoute>
            }
          />
          <Route
            path="/exercise-bot"
            element={
              <ProtectedRoute>
                <ExerciseBot />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin>
                <Admin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/companies"
            element={
              <ProtectedRoute requireAdmin>
                <CompanyManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute requireAdmin>
                <UserManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payments"
            element={
              <ProtectedRoute requireAdmin>
                <PaymentManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/company-dashboard"
            element={
              <ProtectedRoute requireCompanyAdmin>
                <CompanyDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payment-dashboard"
            element={
              <ProtectedRoute requireCompanyAdmin>
                <PaymentDashboard />
              </ProtectedRoute>
            }
          />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
