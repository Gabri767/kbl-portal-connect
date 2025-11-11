import { Home, Building2, Users, FileText, Settings, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

export function AppSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const items = [
    { title: 'Dashboard', icon: Home, url: '/dashboard' },
    { title: 'Empresas', icon: Building2, url: '/empresas' },
    { title: 'Lançamentos', icon: FileText, url: '/lancamentos' },
    ...(user?.role === 'admin' ? [{ title: 'Usuários', icon: Users, url: '/admin' }] : []),
    { title: 'Perfil', icon: Settings, url: '/perfil' },
  ];

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-lg font-bold text-accent">
            Portal KBL
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() => navigate(item.url)}
                    isActive={location.pathname === item.url}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {user && (
          <SidebarGroup className="mt-4">
            <SidebarGroupLabel>Departamentos</SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="flex flex-wrap gap-2 px-2">
                {user.departamentos?.map((dep) => (
                  <span
                    key={dep}
                    className="text-xs bg-accent/10 text-accent px-2 py-1 rounded"
                  >
                    {dep}
                  </span>
                ))}
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={logout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
