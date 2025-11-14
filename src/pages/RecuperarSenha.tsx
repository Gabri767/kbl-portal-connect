import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ThemeToggle from "@/components/ThemeToggle";
import logoKbl from "@/assets/logo-kbl.png";
import logoKblBranco from "@/assets/logo-kbl-branco.png";

export default function RecuperarSenha() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'email' | 'codigo'>('email');
  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    return () => observer.disconnect();
  }, []);

  const handleEnviarCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('enviar-codigo-recuperacao', {
        body: { email }
      });

      if (error) throw error;

      toast({
        title: 'Código Enviado',
        description: data.message
      });

      setStep('codigo');
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao enviar código',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRedefinirSenha = async (e: React.FormEvent) => {
    e.preventDefault();

    if (novaSenha !== confirmarSenha) {
      toast({
        title: 'Erro',
        description: 'As senhas não coincidem',
        variant: 'destructive'
      });
      return;
    }

    if (novaSenha.length < 8) {
      toast({
        title: 'Erro',
        description: 'A senha deve ter no mínimo 8 caracteres',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('reset-senha', {
        body: { email, codigo, novaSenha }
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
        description: data.message
      });

      navigate('/login');
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao redefinir senha',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <img src={isDark ? logoKblBranco : logoKbl} alt="Logo KBL" className="h-24 w-auto" />
          </div>
          <CardTitle className="text-2xl text-center text-accent">
            Recuperar Senha
          </CardTitle>
          <CardDescription className="text-primary text-center">
            {step === 'email' 
              ? 'Digite seu email para receber o código de recuperação'
              : 'Digite o código recebido e sua nova senha'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'email' ? (
            <form onSubmit={handleEnviarCodigo} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="seu@email.com"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate('/login')}
                >
                  Voltar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-brand hover:bg-brand/90"
                  disabled={loading}
                >
                  {loading ? 'Enviando...' : 'Enviar Código'}
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRedefinirSenha} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="codigo">Código de Verificação</Label>
                <Input
                  id="codigo"
                  type="text"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  required
                  placeholder="000000"
                  maxLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="novaSenha">Nova Senha</Label>
                <Input
                  id="novaSenha"
                  type="password"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  required
                  placeholder="Mínimo 8 caracteres"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmarSenha">Confirmar Senha</Label>
                <Input
                  id="confirmarSenha"
                  type="password"
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  required
                  placeholder="Digite a senha novamente"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep('email')}
                >
                  Voltar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-brand hover:bg-brand/90"
                  disabled={loading}
                >
                  {loading ? 'Redefinindo...' : 'Redefinir Senha'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
