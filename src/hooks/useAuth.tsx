import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface User {
  id: string;
  nome: string;
  email: string;
  empresa_id: string | null;
  departamentos: string[];
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (nome: string, email: string, password: string, empresaId?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setLoading(false);
        return;
      }

      // Verify token and get user data
      const { data, error } = await supabase.functions.invoke('auth-verify', {
        body: { token }
      });

      if (error || !data.user) {
        localStorage.removeItem('auth_token');
        setUser(null);
      } else {
        setUser(data.user);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      localStorage.removeItem('auth_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('auth-login', {
        body: { email, password }
      });

      if (error) throw error;

      if (data.error) {
        toast({
          title: 'Erro',
          description: data.error,
          variant: 'destructive'
        });
        return;
      }

      localStorage.setItem('auth_token', data.token);
      setUser(data.user);
      
      toast({
        title: 'Sucesso',
        description: 'Login realizado com sucesso!'
      });

      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao fazer login',
        variant: 'destructive'
      });
    }
  };

  const register = async (nome: string, email: string, password: string, empresaId?: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('auth-register', {
        body: { nome, email, password, empresa_id: empresaId }
      });

      if (error) throw error;

      if (data.error) {
        toast({
          title: 'Erro',
          description: data.error,
          variant: 'destructive'
        });
        return;
      }

      toast({
        title: 'Sucesso',
        description: 'Cadastro realizado! Faça login para continuar.'
      });

      navigate('/login');
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao criar conta',
        variant: 'destructive'
      });
    }
  };

  const logout = async () => {
    localStorage.removeItem('auth_token');
    setUser(null);
    navigate('/login');
    
    toast({
      title: 'Logout',
      description: 'Você saiu da sua conta'
    });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
