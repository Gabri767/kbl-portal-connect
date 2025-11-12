import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, UserPlus } from 'lucide-react';

const departamentosOptions = [
  'Fiscal',
  'Contábil',
  'Financeiro',
  'Trabalhista',
  'Previdenciário',
  'Societário',
  'Tributário',
];

export default function ConvidarUsuario() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [departamentos, setDepartamentos] = useState<string[]>([]);
  const [empresas, setEmpresas] = useState<string[]>([]);
  const [empresasList, setEmpresasList] = useState<any[]>([]);

  useEffect(() => {
    fetchEmpresas();
  }, []);

  const fetchEmpresas = async () => {
    try {
      const { data, error } = await supabase
        .from('empresas')
        .select('id, razao_social, apelido_continuo')
        .eq('ativa', true)
        .order('razao_social');

      if (error) throw error;
      setEmpresasList(data || []);
    } catch (error: any) {
      console.error('Error fetching empresas:', error);
    }
  };

  const getRoleOptions = () => {
    if (user?.role === 'admin') {
      return [
        { value: 'admin', label: 'Administrador' },
        { value: 'gestor', label: 'Gestor' },
        { value: 'colaborador', label: 'Colaborador' },
        { value: 'cliente', label: 'Cliente' },
      ];
    }
    // Gestor can only invite colaborador and cliente
    return [
      { value: 'colaborador', label: 'Colaborador' },
      { value: 'cliente', label: 'Cliente' },
    ];
  };

  const handleDepartamentoToggle = (dep: string) => {
    setDepartamentos(prev =>
      prev.includes(dep)
        ? prev.filter(d => d !== dep)
        : [...prev, dep]
    );
  };

  const handleEmpresaToggle = (empresaId: string) => {
    setEmpresas(prev =>
      prev.includes(empresaId)
        ? prev.filter(e => e !== empresaId)
        : [...prev, empresaId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nome || !email || !role || departamentos.length === 0 || empresas.length === 0) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('auth_token');
      
      const { data, error } = await supabase.functions.invoke('auth-invite-user', {
        body: { nome, email, role, departamentos, empresas },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (error) throw error;

      if (data.error) {
        toast({
          title: 'Erro',
          description: data.error,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Sucesso',
        description: 'Convite enviado com sucesso!',
      });

      navigate('/usuarios');

    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao enviar convite',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/usuarios')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Convidar Novo Usuário</h1>
            <p className="text-muted-foreground">
              Envie um convite para um novo usuário acessar o sistema
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-accent" />
              Dados do Convite
            </CardTitle>
            <CardDescription>
              Preencha as informações do novo usuário
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Completo *</Label>
                <Input
                  id="nome"
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Cargo / Função *</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cargo" />
                  </SelectTrigger>
                  <SelectContent>
                    {getRoleOptions().map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Departamentos * (selecione pelo menos um)</Label>
                <div className="grid grid-cols-2 gap-3 p-4 border rounded-md">
                  {departamentosOptions.map(dep => (
                    <div key={dep} className="flex items-center space-x-2">
                      <Checkbox
                        id={dep}
                        checked={departamentos.includes(dep)}
                        onCheckedChange={() => handleDepartamentoToggle(dep)}
                      />
                      <Label htmlFor={dep} className="cursor-pointer">
                        {dep}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Empresas * (selecione pelo menos uma)</Label>
                <div className="max-h-60 overflow-y-auto border rounded-md p-4 space-y-2">
                  {empresasList.map(empresa => (
                    <div key={empresa.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={empresa.id}
                        checked={empresas.includes(empresa.id)}
                        onCheckedChange={() => handleEmpresaToggle(empresa.id)}
                      />
                      <Label htmlFor={empresa.id} className="cursor-pointer">
                        {empresa.apelido_continuo || empresa.razao_social}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/usuarios')}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-accent hover:bg-accent/90"
                  disabled={loading}
                >
                  {loading ? 'Enviando...' : 'Enviar Convite'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}