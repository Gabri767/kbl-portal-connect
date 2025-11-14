import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Search, Settings } from "lucide-react";
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
  [key: string]: any;
}

const DEFAULT_COLUMNS = [
  "codi_emp",
  "nome_emp",
  "cgce_emp",
  "fantasia_emp",
  "cepe_emp",
  "cida_emp",
  "ramo_emp",
  "email_emp",
  "created_at",
];

const COLUMN_LABELS: Record<string, string> = {
  codi_emp: "Código",
  nome_emp: "Nome",
  razao_emp: "Razão Social",
  fantasia_emp: "Fantasia",
  cgce_emp: "CNPJ",
  iest_emp: "Insc. Estadual",
  imun_emp: "Insc. Municipal",
  ende_emp: "Endereço",
  bair_emp: "Bairro",
  cida_emp: "Cidade",
  esta_emp: "UF",
  cepe_emp: "CEP",
  fone_emp: "Telefone",
  email_emp: "Email",
  site_emp: "Site",
  ramo_emp: "Ramo",
  rleg_emp: "Rep. Legal",
  djuc_emp: "Data Junta",
  stat_emp: "Status",
  apel_emp: "Apelido",
  created_at: "Cadastro",
};

export default function Empresas() {
  const navigate = useNavigate();
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [filteredEmpresas, setFilteredEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => {
    const saved = localStorage.getItem("empresas_visible_columns");
    return saved ? JSON.parse(saved) : DEFAULT_COLUMNS;
  });
  const [allColumns, setAllColumns] = useState<string[]>([]);
  const [columnPickerOpen, setColumnPickerOpen] = useState(false);

  useEffect(() => {
    fetchEmpresas();
  }, []);

  useEffect(() => {
    if (search.trim() === "") {
      setFilteredEmpresas(empresas);
    } else {
      const searchLower = search.toLowerCase();
      const filtered = empresas.filter(
        (emp) =>
          emp.nome_emp?.toLowerCase().includes(searchLower) ||
          emp.razao_emp?.toLowerCase().includes(searchLower) ||
          emp.cgce_emp?.includes(search) ||
          emp.fantasia_emp?.toLowerCase().includes(searchLower)
      );
      setFilteredEmpresas(filtered);
    }
  }, [search, empresas]);

  const fetchEmpresas = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
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
        setEmpresas(data.data);
        setFilteredEmpresas(data.data);

        // Extrair todas as colunas possíveis
        if (data.data.length > 0) {
          const columns = Object.keys(data.data[0]);
          setAllColumns(columns);
        }
      }
    } catch (error: any) {
      console.error("Erro ao buscar empresas:", error);
      toast.error(error.message || "Erro ao carregar empresas");
    } finally {
      setLoading(false);
    }
  };

  const handleColumnToggle = (column: string) => {
    setVisibleColumns((prev) => {
      const newColumns = prev.includes(column)
        ? prev.filter((c) => c !== column)
        : [...prev, column];
      
      localStorage.setItem("empresas_visible_columns", JSON.stringify(newColumns));
      return newColumns;
    });
  };

  const handleResetColumns = () => {
    setVisibleColumns(DEFAULT_COLUMNS);
    localStorage.setItem("empresas_visible_columns", JSON.stringify(DEFAULT_COLUMNS));
    toast.success("Colunas restauradas ao padrão");
  };

  const formatValue = (value: any, column: string): string => {
    if (value === null || value === undefined) return "-";
    
    if (column === "created_at" || column === "djuc_emp") {
      try {
        return new Date(value).toLocaleDateString("pt-BR");
      } catch {
        return value;
      }
    }
    
    if (column === "cgce_emp" && value.length === 14) {
      return value.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
    }
    
    if (column === "cepe_emp" && value.length === 8) {
      return value.replace(/^(\d{5})(\d{3})$/, "$1-$2");
    }
    
    return String(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Empresas</h1>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por nome, razão social, CNPJ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <Dialog open={columnPickerOpen} onOpenChange={setColumnPickerOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="text-primary">
              <Settings className="h-4 w-4 mr-2" />
              Configurar Colunas
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Configurar Colunas Visíveis</DialogTitle>
              <DialogDescription>
                Selecione quais colunas deseja visualizar na tabela
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <Button
                onClick={handleResetColumns}
                variant="outline"
                className="w-full text-primary"
              >
                Restaurar Padrão
              </Button>
              <div className="grid grid-cols-2 gap-4">
                {allColumns.map((column) => (
                  <div key={column} className="flex items-center space-x-2">
                    <Checkbox
                      id={column}
                      checked={visibleColumns.includes(column)}
                      onCheckedChange={() => handleColumnToggle(column)}
                    />
                    <Label
                      htmlFor={column}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {COLUMN_LABELS[column] || column}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Button onClick={fetchEmpresas} disabled={loading} className="bg-brand text-white">
          {loading ? "Carregando..." : "Atualizar"}
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                {visibleColumns.map((column) => (
                  <TableHead key={column}>
                    {COLUMN_LABELS[column] || column}
                  </TableHead>
                ))}
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmpresas.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={visibleColumns.length + 1}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Nenhuma empresa encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filteredEmpresas.map((empresa) => (
                  <TableRow key={empresa.codi_emp}>
                    {visibleColumns.map((column) => (
                      <TableCell key={column}>
                        {formatValue(empresa[column], column)}
                      </TableCell>
                    ))}
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/empresas/${empresa.codi_emp}`)}
                        className="text-primary"
                      >
                        Ver Detalhes
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
