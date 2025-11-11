import { useAuth } from '@/hooks/useAuth';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, FileText, Users, TrendingUp } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();

  const stats = [
    { title: 'Empresas', value: '12', icon: Building2, color: 'text-blue-500' },
    { title: 'Lançamentos', value: '1,234', icon: FileText, color: 'text-green-500' },
    { title: 'Usuários', value: '45', icon: Users, color: 'text-purple-500' },
    { title: 'Crescimento', value: '+12%', icon: TrendingUp, color: 'text-accent' },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">
            Bem-vindo, {user?.nome}
          </h1>
          <p className="text-muted-foreground">
            Role: <span className="font-semibold text-accent">{user?.role}</span>
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Seus Departamentos</CardTitle>
            <CardDescription>
              Você tem acesso aos seguintes departamentos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {user?.departamentos?.map((dep) => (
                <span
                  key={dep}
                  className="bg-accent/10 text-accent px-4 py-2 rounded-md font-medium"
                >
                  {dep}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
