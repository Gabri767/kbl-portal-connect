import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface Empresa {
  codi_emp: number;
  nome_emp: string;
  razao_emp: string;
  fantasia_emp: string;
  cgce_emp: string;
  iest_emp: string;
  imun_emp: string;
  ende_emp: string;
  bair_emp: string;
  cida_emp: string;
  esta_emp: string;
  cepe_emp: string;
  fone_emp: string;
  email_emp: string;
  site_emp: string | null;
  ramo_emp: string;
  rleg_emp: string;
  djuc_emp: string;
  stat_emp: string;
  apel_emp: string;
  created_at: string;
}

export default function EmpresaDetalhes() {
  const { codiEmp } = useParams();
  const navigate = useNavigate();
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmpresa();
  }, [codiEmp]);

  const fetchEmpresa = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Sessão expirada. Faça login novamente.");
        navigate("/login");
        return;
      }

      const { data, error } = await supabase.functions.invoke("empresas-list", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (error) throw error;

      if (data.success && data.data) {
        const empresaEncontrada = data.data.find(
          (emp: Empresa) => emp.codi_emp === parseInt(codiEmp || "0")
        );

        if (empresaEncontrada) {
          setEmpresa(empresaEncontrada);
        } else {
          toast.error("Empresa não encontrada");
          navigate("/empresas");
        }
      }
    } catch (error: any) {
      console.error("Erro ao buscar empresa:", error);
      toast.error(error.message || "Erro ao carregar empresa");
      navigate("/empresas");
    } finally {
      setLoading(false);
    }
  };

  const formatCNPJ = (cnpj: string) => {
    if (!cnpj || cnpj.length !== 14) return cnpj;
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
  };

  const formatCEP = (cep: string) => {
    if (!cep || cep.length !== 8) return cep;
    return cep.replace(/^(\d{5})(\d{3})$/, "$1-$2");
  };

  const formatDate = (date: string) => {
    if (!date) return "-";
    try {
      return new Date(date).toLocaleDateString("pt-BR");
    } catch {
      return date;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
      </div>
    );
  }

  if (!empresa) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/empresas")}
          className="text-primary"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{empresa.nome_emp}</h1>
          <p className="text-muted-foreground">{empresa.fantasia_emp}</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">Código</div>
          <div className="text-2xl font-bold">{empresa.codi_emp}</div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Dados Cadastrais</CardTitle>
            <CardDescription>Informações básicas da empresa</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Razão Social</div>
              <div className="text-base">{empresa.razao_emp || "-"}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Nome Fantasia</div>
              <div className="text-base">{empresa.fantasia_emp || "-"}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Apelido</div>
              <div className="text-base">{empresa.apel_emp || "-"}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Ramo de Atividade</div>
              <div className="text-base">{empresa.ramo_emp || "-"}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Status</div>
              <div className="text-base">
                {empresa.stat_emp === "A" ? "Ativo" : empresa.stat_emp === "I" ? "Inativo" : empresa.stat_emp}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dados Fiscais</CardTitle>
            <CardDescription>Informações fiscais e tributárias</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">CNPJ</div>
              <div className="text-base font-mono">{formatCNPJ(empresa.cgce_emp)}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Inscrição Estadual</div>
              <div className="text-base">{empresa.iest_emp || "-"}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Inscrição Municipal</div>
              <div className="text-base">{empresa.imun_emp || "-"}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Data Junta Comercial</div>
              <div className="text-base">{formatDate(empresa.djuc_emp)}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Representante Legal</div>
              <div className="text-base">{empresa.rleg_emp || "-"}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Endereço</CardTitle>
            <CardDescription>Localização da empresa</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Logradouro</div>
              <div className="text-base">{empresa.ende_emp || "-"}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Bairro</div>
              <div className="text-base">{empresa.bair_emp || "-"}</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Cidade</div>
                <div className="text-base">{empresa.cida_emp || "-"}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">UF</div>
                <div className="text-base">{empresa.esta_emp || "-"}</div>
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">CEP</div>
              <div className="text-base font-mono">{formatCEP(empresa.cepe_emp)}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contato</CardTitle>
            <CardDescription>Informações de contato</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Telefone</div>
              <div className="text-base">{empresa.fone_emp || "-"}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Email</div>
              <div className="text-base">{empresa.email_emp || "-"}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Website</div>
              <div className="text-base">
                {empresa.site_emp ? (
                  <a
                    href={empresa.site_emp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {empresa.site_emp}
                  </a>
                ) : (
                  "-"
                )}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Cadastrado em</div>
              <div className="text-base">{formatDate(empresa.created_at)}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
