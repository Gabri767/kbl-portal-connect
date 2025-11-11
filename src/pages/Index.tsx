import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <h1 className="text-5xl font-bold">
          Portal <span className="text-accent">KBL</span>
        </h1>
        <p className="text-xl text-muted-foreground">
          Sistema de Gestão Contábil
        </p>
        <Button 
          onClick={() => navigate('/login')}
          className="bg-accent hover:bg-accent/90"
        >
          Acessar Sistema
        </Button>
      </div>
    </div>
  );
};

export default Index;
