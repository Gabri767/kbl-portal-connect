import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Plus, Pencil, Trash2, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';

interface Empresa {
  id: string;
  razao_social: string;
  nome_fantasia?: string;
  cnpj?: string;
  regime?: string;
  grupo_de_empresas?: string;
  ativa: string;
  cidade?: string;
  uf?: string;
  tags?: string;
}

interface FormData {
  id?: string;
  razao_social: string;
  nome_fantasia: string;
  cnpj: string;
  fone: string;
  regime: string;
  nire: string;
  insc_municipal: string;
  dt_insc_municipal: string;
  endereco: string;
  numero: string;
  complemento: string;
  cep: string;
  bairro: string;
  cidade: string;
  uf: string;
  data_de_abertura: string;
  cliente_desde: string;
  cliente_ate: string;
  ativa: string;
  honorarios: string;
  website_da_empresa: string;
  apelido_continuo: string;
  grupo_de_empresas: string;
  inscricoes_estaduais: string;
  empresa_isenta: string;
  outros_identificadores: string;
  comentarios_e_anotacoes_gerais: string;
  tags: string;
}

export default function Empresas() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loadingCep, setLoadingCep] = useState(false);
  const [regimes, setRegimes] = useState<string[]>([]);
  const [grupos, setGrupos] = useState<string[]>([]);
  const [tagsList, setTagsList] = useState<string[]>([]);

  const [formData, setFormData] = useState<FormData>({
    id: '',
    razao_social: '',
    nome_fantasia: '',
    cnpj: '',
    fone: '',
    regime: '',
    nire: '',
    insc_municipal: '',
    dt_insc_municipal: '',
    endereco: '',
    numero: '',
    complemento: '',
    cep: '',
    bairro: '',
    cidade: '',
    uf: '',
    data_de_abertura: '',
    cliente_desde: '',
    cliente_ate: '',
    ativa: 'Ativa',
    honorarios: '',
    website_da_empresa: '',
    apelido_continuo: '',
    grupo_de_empresas: '',
    inscricoes_estaduais: '',
    empresa_isenta: 'Não',
    outros_identificadores: '',
    comentarios_e_anotacoes_gerais: '',
    tags: '',
  });

  useEffect(() => {
    fetchEmpresas();
    fetchRegimes();
    fetchGrupos();
    fetchTags();
  }, []);

  const fetchEmpresas = async () => {
    try {
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .order('razao_social');

      if (error) throw error;
      setEmpresas((data || []) as any);
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

  const fetchRegimes = async () => {
    const { data } = await (supabase as any).from('regimes').select('nome').order('nome');
    setRegimes((data as any)?.map((r: any) => r.nome) || []);
  };

  const fetchGrupos = async () => {
    const { data } = await (supabase as any).from('grupo_de_empresas').select('nome').order('nome');
    setGrupos((data as any)?.map((g: any) => g.nome) || []);
  };

  const fetchTags = async () => {
    const { data } = await (supabase as any).from('tags').select('nome').order('nome');
    setTagsList((data as any)?.map((t: any) => t.nome) || []);
  };

  const handleBuscarCep = async () => {
    if (!formData.cep || formData.cep.length < 8) {
      toast({
        title: 'Erro',
        description: 'Digite um CEP válido',
        variant: 'destructive',
      });
      return;
    }

    setLoadingCep(true);
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cep-lookup?cep=${formData.cep}`;
      const response = await fetch(url);
      const result = await response.json();

      if (result.success && result.data) {
        setFormData((prev) => ({
          ...prev,
          endereco: result.data.endereco || '',
          bairro: result.data.bairro || '',
          cidade: result.data.cidade || '',
          uf: result.data.uf || '',
          complemento: result.data.complemento || prev.complemento,
        }));
        toast({
          title: 'Sucesso',
          description: 'Endereço preenchido automaticamente',
        });
      } else {
        toast({
          title: 'Erro',
          description: 'CEP não encontrado',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao buscar CEP',
        variant: 'destructive',
      });
    } finally {
      setLoadingCep(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.razao_social) {
      toast({
        title: 'Erro',
        description: 'Razão social é obrigatória',
        variant: 'destructive',
      });
      return;
    }

    // Validar CNPJ
    const cnpjLimpo = formData.cnpj?.replace(/\D/g, '');
    if (!cnpjLimpo || cnpjLimpo.length !== 14) {
      toast({
        title: 'Erro',
        description: 'CNPJ inválido. Deve conter 14 dígitos.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Converter campos vazios para null
      const dataToSave: any = {
        razao_social: formData.razao_social?.trim(),
        cnpj: cnpjLimpo,
        ativa: formData.ativa || 'Ativa',
        nome_fantasia: formData.nome_fantasia?.trim() || null,
        fone: formData.fone?.trim() || null,
        regime: formData.regime?.trim() || null,
        nire: formData.nire?.trim() || null,
        insc_municipal: formData.insc_municipal?.trim() || null,
        dt_insc_municipal: formData.dt_insc_municipal || null,
        endereco: formData.endereco?.trim() || null,
        numero: formData.numero?.trim() || null,
        complemento: formData.complemento?.trim() || null,
        cep: formData.cep?.trim() || null,
        bairro: formData.bairro?.trim() || null,
        cidade: formData.cidade?.trim() || null,
        uf: formData.uf?.trim() || null,
        data_de_abertura: formData.data_de_abertura || null,
        cliente_desde: formData.cliente_desde || null,
        cliente_ate: formData.cliente_ate || null,
        honorarios: formData.honorarios?.trim() || null,
        website_da_empresa: formData.website_da_empresa?.trim() || null,
        apelido_continuo: formData.apelido_continuo?.trim() || null,
        inscricoes_estaduais: formData.inscricoes_estaduais?.trim() || null,
        outros_identificadores: formData.outros_identificadores?.trim() || null,
        comentarios_e_anotacoes_gerais: formData.comentarios_e_anotacoes_gerais?.trim() || null,
        tags: formData.tags?.trim() || null,
        grupo_de_empresas: formData.grupo_de_empresas?.trim() || null,
        empresa_isenta: formData.empresa_isenta?.trim() || null,
      };

      if (editingId) {
        // Atualizar empresa existente
        const { error } = await supabase
          .from('empresas')
          .update(dataToSave)
          .eq('id', editingId);

        if (error) throw error;

        toast({
          title: 'Sucesso',
          description: 'Empresa atualizada com sucesso',
        });
      } else {
        // Criar nova empresa
        // Se ID customizado foi fornecido, converter para UUID usando a função do banco
        if (formData.id?.trim()) {
          const { data: convertedId, error: convertError } = await supabase
            .rpc('convert_to_uuid', { input_text: formData.id.trim() });

          if (convertError) throw convertError;
          dataToSave.id = convertedId;
        }

        const { error } = await supabase
          .from('empresas')
          .insert([dataToSave]);

        if (error) {
          if (error.code === '23505') {
            toast({
              title: 'Erro',
              description: 'CNPJ já cadastrado no sistema.',
              variant: 'destructive',
            });
            return;
          }
          throw error;
        }

        toast({
          title: 'Sucesso',
          description: 'Empresa criada com sucesso',
        });
      }

      setDialogOpen(false);
      resetForm();
      fetchEmpresas();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao salvar empresa',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (empresa: Empresa) => {
    setEditingId(empresa.id);
    setFormData({
      id: empresa.id,
      razao_social: empresa.razao_social || '',
      nome_fantasia: empresa.nome_fantasia || '',
      cnpj: empresa.cnpj || '',
      fone: '',
      regime: empresa.regime || '',
      nire: '',
      insc_municipal: '',
      dt_insc_municipal: '',
      endereco: '',
      numero: '',
      complemento: '',
      cep: '',
      bairro: '',
      cidade: empresa.cidade || '',
      uf: empresa.uf || '',
      data_de_abertura: '',
      cliente_desde: '',
      cliente_ate: '',
      ativa: empresa.ativa || 'Ativa',
      honorarios: '',
      website_da_empresa: '',
      apelido_continuo: '',
      grupo_de_empresas: empresa.grupo_de_empresas || '',
      inscricoes_estaduais: '',
      empresa_isenta: 'Não',
      outros_identificadores: '',
      comentarios_e_anotacoes_gerais: '',
      tags: empresa.tags || '',
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta empresa?')) return;

    try {
      const { error } = await supabase
        .from('empresas')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Empresa excluída com sucesso',
      });

      fetchEmpresas();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao excluir empresa',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      id: '',
      razao_social: '',
      nome_fantasia: '',
      cnpj: '',
      fone: '',
      regime: '',
      nire: '',
      insc_municipal: '',
      dt_insc_municipal: '',
      endereco: '',
      numero: '',
      complemento: '',
      cep: '',
      bairro: '',
      cidade: '',
      uf: '',
      data_de_abertura: '',
      cliente_desde: '',
      cliente_ate: '',
      ativa: 'Ativa',
      honorarios: '',
      website_da_empresa: '',
      apelido_continuo: '',
      grupo_de_empresas: '',
      inscricoes_estaduais: '',
      empresa_isenta: 'Não',
      outros_identificadores: '',
      comentarios_e_anotacoes_gerais: '',
      tags: '',
    });
  };

  const filteredEmpresas = empresas.filter(
    (empresa) =>
      empresa.razao_social?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      empresa.nome_fantasia?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      empresa.cnpj?.includes(searchTerm)
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Empresas</h1>
            <p className="text-muted-foreground">Gerencie as empresas cadastradas no sistema</p>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setDialogOpen(true);
            }}
            className="bg-brand hover:bg-brand/90 text-brand-foreground"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Empresa
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-accent" />
                  Lista de Empresas
                </CardTitle>
                <CardDescription>
                  {filteredEmpresas.length}{' '}
                  {filteredEmpresas.length === 1 ? 'empresa' : 'empresas'} cadastrada
                  {filteredEmpresas.length !== 1 ? 's' : ''}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar empresas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Carregando...</p>
            ) : filteredEmpresas.length === 0 ? (
              <p className="text-muted-foreground">Nenhuma empresa cadastrada</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Razão Social</TableHead>
                    <TableHead>Nome Fantasia</TableHead>
                    <TableHead>CNPJ</TableHead>
                    <TableHead>Regime</TableHead>
                    <TableHead>Grupo</TableHead>
                    <TableHead>Situação</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmpresas.map((empresa) => (
                    <TableRow key={empresa.id}>
                      <TableCell className="font-medium">{empresa.razao_social}</TableCell>
                      <TableCell>{empresa.nome_fantasia || '-'}</TableCell>
                      <TableCell>{empresa.cnpj || '-'}</TableCell>
                      <TableCell>{empresa.regime || '-'}</TableCell>
                      <TableCell>{empresa.grupo_de_empresas || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={empresa.ativa === 'Ativa' ? 'default' : 'secondary'}>
                          {empresa.ativa}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(empresa)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(empresa.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Empresa' : 'Nova Empresa'}</DialogTitle>
            <DialogDescription>
              Preencha os dados da empresa abaixo. Campos marcados com * são obrigatórios.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {!editingId && (
              <div className="space-y-2">
                <Label htmlFor="id">ID Customizado (opcional)</Label>
                <Input
                  id="id"
                  value={formData.id}
                  onChange={(e) => setFormData((prev) => ({ ...prev, id: e.target.value }))}
                  placeholder="Deixe em branco para gerar automaticamente"
                />
              </div>
            )}
            
            {/* Dados Básicos */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Dados Básicos</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="razao_social">
                    Razão Social <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="razao_social"
                    value={formData.razao_social}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, razao_social: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nome_fantasia">Nome Fantasia</Label>
                  <Input
                    id="nome_fantasia"
                    value={formData.nome_fantasia}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, nome_fantasia: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    value={formData.cnpj}
                    onChange={(e) => setFormData((prev) => ({ ...prev, cnpj: e.target.value }))}
                    placeholder="00.000.000/0000-00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fone">Telefone</Label>
                  <Input
                    id="fone"
                    value={formData.fone}
                    onChange={(e) => setFormData((prev) => ({ ...prev, fone: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="regime">Regime Tributário</Label>
                  <Select
                    value={formData.regime}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, regime: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {regimes.map((regime) => (
                        <SelectItem key={regime} value={regime}>
                          {regime}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nire">NIRE</Label>
                  <Input
                    id="nire"
                    value={formData.nire}
                    onChange={(e) => setFormData((prev) => ({ ...prev, nire: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="insc_municipal">Inscrição Municipal</Label>
                  <Input
                    id="insc_municipal"
                    value={formData.insc_municipal}
                    onChange={(e) => setFormData((prev) => ({ ...prev, insc_municipal: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dt_insc_municipal">Data Insc. Municipal</Label>
                  <Input
                    id="dt_insc_municipal"
                    type="date"
                    value={formData.dt_insc_municipal}
                    onChange={(e) => setFormData((prev) => ({ ...prev, dt_insc_municipal: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="inscricoes_estaduais">Inscrições Estaduais</Label>
                  <Input
                    id="inscricoes_estaduais"
                    value={formData.inscricoes_estaduais}
                    onChange={(e) => setFormData((prev) => ({ ...prev, inscricoes_estaduais: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="empresa_isenta">Empresa Isenta</Label>
                  <Select
                    value={formData.empresa_isenta}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, empresa_isenta: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sim">Sim</SelectItem>
                      <SelectItem value="Não">Não</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="outros_identificadores">Outros Identificadores</Label>
                  <Input
                    id="outros_identificadores"
                    value={formData.outros_identificadores}
                    onChange={(e) => setFormData((prev) => ({ ...prev, outros_identificadores: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="data_de_abertura">Data de Abertura</Label>
                  <Input
                    id="data_de_abertura"
                    type="date"
                    value={formData.data_de_abertura}
                    onChange={(e) => setFormData((prev) => ({ ...prev, data_de_abertura: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cliente_desde">Cliente Desde</Label>
                  <Input
                    id="cliente_desde"
                    type="date"
                    value={formData.cliente_desde}
                    onChange={(e) => setFormData((prev) => ({ ...prev, cliente_desde: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cliente_ate">Cliente Até</Label>
                  <Input
                    id="cliente_ate"
                    type="date"
                    value={formData.cliente_ate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, cliente_ate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="honorarios">Honorários</Label>
                  <Input
                    id="honorarios"
                    value={formData.honorarios}
                    onChange={(e) => setFormData((prev) => ({ ...prev, honorarios: e.target.value }))}
                    placeholder="R$"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="website_da_empresa">Website da Empresa</Label>
                  <Input
                    id="website_da_empresa"
                    type="url"
                    value={formData.website_da_empresa}
                    onChange={(e) => setFormData((prev) => ({ ...prev, website_da_empresa: e.target.value }))}
                    placeholder="https://"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apelido_continuo">Apelido Contínuo</Label>
                  <Input
                    id="apelido_continuo"
                    value={formData.apelido_continuo}
                    onChange={(e) => setFormData((prev) => ({ ...prev, apelido_continuo: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="grupo">Grupo de Empresas</Label>
                  <Select
                    value={formData.grupo_de_empresas}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, grupo_de_empresas: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {grupos.map((grupo) => (
                        <SelectItem key={grupo} value={grupo}>
                          {grupo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tags">Tags</Label>
                  <Select
                    value={formData.tags}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, tags: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {tagsList.map((tag) => (
                        <SelectItem key={tag} value={tag}>
                          {tag}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ativa">Situação</Label>
                  <Select
                    value={formData.ativa}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, ativa: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ativa">Ativa</SelectItem>
                      <SelectItem value="Inativa">Inativa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Endereço */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Endereço</h3>
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cep">CEP</Label>
                  <div className="flex gap-2">
                    <Input
                      id="cep"
                      value={formData.cep}
                      onChange={(e) => setFormData((prev) => ({ ...prev, cep: e.target.value }))}
                      placeholder="00000-000"
                    />
                    <Button
                      type="button"
                      onClick={handleBuscarCep}
                      disabled={loadingCep}
                      className="bg-brand hover:bg-brand/90 text-brand-foreground"
                    >
                      {loadingCep ? 'Buscando...' : 'Buscar'}
                    </Button>
                  </div>
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="endereco">Endereço</Label>
                  <Input
                    id="endereco"
                    value={formData.endereco}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, endereco: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numero">Número</Label>
                  <Input
                    id="numero"
                    value={formData.numero}
                    onChange={(e) => setFormData((prev) => ({ ...prev, numero: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="complemento">Complemento</Label>
                  <Input
                    id="complemento"
                    value={formData.complemento}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, complemento: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bairro">Bairro</Label>
                  <Input
                    id="bairro"
                    value={formData.bairro}
                    onChange={(e) => setFormData((prev) => ({ ...prev, bairro: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="cidade">Cidade</Label>
                    <Input
                      id="cidade"
                      value={formData.cidade}
                      onChange={(e) => setFormData((prev) => ({ ...prev, cidade: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="uf">UF</Label>
                    <Input
                      id="uf"
                      value={formData.uf}
                      onChange={(e) => setFormData((prev) => ({ ...prev, uf: e.target.value }))}
                      maxLength={2}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Observações */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Observações</h3>
              <div className="space-y-2">
                <Label htmlFor="comentarios">Comentários e Anotações Gerais</Label>
                <Textarea
                  id="comentarios"
                  value={formData.comentarios_e_anotacoes_gerais}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, comentarios_e_anotacoes_gerais: e.target.value }))
                  }
                  rows={4}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} className="bg-brand hover:bg-brand/90 text-brand-foreground">
              {editingId ? 'Atualizar' : 'Criar'} Empresa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
