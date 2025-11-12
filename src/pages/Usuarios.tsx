import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, UserPlus, Search, Mail, Edit, UserX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function Usuarios() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: usuarios, isLoading, refetch } = useQuery({
    queryKey: ['usuarios'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('usuarios')
        .select(`
          *,
          user_roles (role),
          usuarios_empresas (
            empresa_id,
            empresas (razao_social)
          )
        `)
        .order('criado_em', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleResendInvite = async (userId: string, email: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await supabase.functions.invoke('auth-invite-user', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: { userId, resend: true },
      });

      if (response.error) throw response.error;

      toast({
        title: 'Convite reenviado',
        description: `O convite foi reenviado para ${email}`,
      });
      refetch();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível reenviar o convite',
        variant: 'destructive',
      });
    }
  };

  const filteredUsuarios = usuarios?.filter((usuario) =>
    usuario.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    usuario.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'gestor':
        return 'default';
      case 'colaborador':
        return 'secondary';
      case 'cliente':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ativo':
        return <Badge className="bg-green-600">Ativo</Badge>;
      case 'convite_pendente':
        return <Badge variant="outline">Convite Pendente</Badge>;
      case 'bloqueado':
        return <Badge variant="destructive">Bloqueado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Usuários</h1>
            <p className="text-muted-foreground">
              Gerencie os usuários do sistema
            </p>
          </div>
          <Button 
            onClick={() => navigate('/usuarios/novo')}
            className="bg-accent hover:bg-accent/90"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Convidar Usuário
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-accent" />
              Lista de Usuários
            </CardTitle>
            <CardDescription>
              Usuários cadastrados e convites pendentes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            {isLoading ? (
              <p className="text-center text-muted-foreground py-8">Carregando...</p>
            ) : filteredUsuarios && filteredUsuarios.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Cargo</TableHead>
                      <TableHead>Departamentos</TableHead>
                      <TableHead>Empresas</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data de Criação</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsuarios.map((usuario) => (
                      <TableRow key={usuario.id}>
                        <TableCell className="font-medium">{usuario.nome}</TableCell>
                        <TableCell>{usuario.email}</TableCell>
                        <TableCell>
                          <Badge variant={getRoleBadgeVariant(usuario.user_roles?.[0]?.role || 'cliente')}>
                            {usuario.user_roles?.[0]?.role || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {usuario.departamentos?.map((dep: string) => (
                              <Badge key={dep} variant="outline" className="text-xs">
                                {dep}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {usuario.usuarios_empresas?.slice(0, 2).map((ue: any) => (
                              <span key={ue.empresa_id} className="text-xs">
                                {ue.empresas?.razao_social || 'N/A'}
                              </span>
                            ))}
                            {usuario.usuarios_empresas && usuario.usuarios_empresas.length > 2 && (
                              <span className="text-xs text-muted-foreground">
                                +{usuario.usuarios_empresas.length - 2} mais
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(usuario.status || 'N/A')}</TableCell>
                        <TableCell>
                          {usuario.criado_em ? format(new Date(usuario.criado_em), 'dd/MM/yyyy') : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {usuario.status === 'convite_pendente' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleResendInvite(usuario.id, usuario.email)}
                                title="Reenviar convite"
                              >
                                <Mail className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => navigate(`/usuarios/editar/${usuario.id}`)}
                              title="Editar usuário"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Desativar usuário"
                            >
                              <UserX className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Nenhum usuário encontrado
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}