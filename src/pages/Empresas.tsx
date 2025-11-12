import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export default function Empresas() {
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmpresas();
  }, []);

  const fetchEmpresas = async () => {
    try {
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .eq('ativa', true)
        .order('razao_social');

      if (error) throw error;
      setEmpresas(data || []);
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: 'Erro ao carregar empresas',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Empresas</h1>
            <p className="text-muted-foreground">
              Gerencie as empresas cadastradas no sistema
            </p>
          </div>
          <Button className="bg-accent hover:bg-accent/90">
            <Plus className="h-4 w-4 mr-2" />
            Nova Empresa
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-accent" />
              Lista de Empresas
            </CardTitle>
            <CardDescription>
              {empresas.length} {empresas.length === 1 ? 'empresa' : 'empresas'} cadastrada{empresas.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Carregando...</p>
            ) : empresas.length === 0 ? (
              <p className="text-muted-foreground">Nenhuma empresa cadastrada</p>
            ) : (
              <div className="space-y-4">
                {empresas.map((empresa) => (
                  <div
                    key={empresa.id}
                    className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {empresa.apelido_continuo || empresa.razao_social}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {empresa.razao_social}
                        </p>
                        {empresa.cnpj && (
                          <p className="text-sm text-muted-foreground">
                            CNPJ: {empresa.cnpj}
                          </p>
                        )}
                        {empresa.cidade && empresa.uf && (
                          <p className="text-sm text-muted-foreground">
                            {empresa.cidade}/{empresa.uf}
                          </p>
                        )}
                      </div>
                      <Button variant="outline" size="sm">
                        Ver Detalhes
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
