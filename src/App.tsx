import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Empresas from "./pages/Empresas";
import Lancamentos from "./pages/Lancamentos";
import Perfil from "./pages/Perfil";
import Admin from "./pages/Admin";
import Usuarios from "./pages/Usuarios";
import ConvidarUsuario from "./pages/ConvidarUsuario";
import DefinirSenha from "./pages/DefinirSenha";
import NotFound from "./pages/NotFound";
const queryClient = new QueryClient();
const ProtectedRoute = ({
  children
}: {
  children: React.ReactNode;
}) => {
  const {
    user,
    loading
  } = useAuth();
  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">
      <p>Carregando...</p>
    </div>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};
const App = () => <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/definir-senha/:token" element={<DefinirSenha />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/empresas" element={<ProtectedRoute><Empresas /></ProtectedRoute>} />
            <Route path="/lancamentos" element={<ProtectedRoute><Lancamentos /></ProtectedRoute>} />
            <Route path="/perfil" element={<ProtectedRoute><Perfil /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
            <Route path="/usuarios" element={<ProtectedRoute><Usuarios /></ProtectedRoute>} />
            <Route path="/usuarios/novo" element={<ProtectedRoute><ConvidarUsuario /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>;
export default App;