import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  DollarSign, 
  Settings,
  Shield,
  BarChart3,
  FileText,
  MessageSquare
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

interface AdminSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  isOwner: boolean;
}

export const AdminSidebar = ({ activeSection, onSectionChange, isOwner }: AdminSidebarProps) => {
  const { open } = useSidebar();

  const menuItems = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      id: "dashboard",
    },
    {
      title: "Usuários",
      icon: Users,
      id: "users",
    },
    {
      title: "Funções",
      icon: Shield,
      id: "roles",
    },
    {
      title: "Planos",
      icon: CreditCard,
      id: "plans",
    },
    {
      title: "Pagamentos",
      icon: DollarSign,
      id: "payments",
    },
    {
      title: "Feedbacks",
      icon: MessageSquare,
      id: "feedbacks",
    },
    {
      title: "Changelog",
      icon: FileText,
      id: "changelog",
    },
    {
      title: "Relatórios",
      icon: BarChart3,
      id: "reports",
    },
    {
      title: "Configurações do Site",
      icon: Settings,
      id: "site-settings",
    },
  ];

  return (
    <Sidebar className={open ? "w-64" : "w-16"} collapsible="icon">
      <div className="p-4 border-b flex items-center justify-between">
        {open && (
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">Admin Panel</span>
          </div>
        )}
        <SidebarTrigger className={!open ? "mx-auto" : ""} />
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className={!open ? "sr-only" : ""}>
            Menu Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => onSectionChange(item.id)}
                    isActive={activeSection === item.id}
                    className={
                      activeSection === item.id
                        ? "bg-primary/10 text-primary font-medium"
                        : "hover:bg-muted"
                    }
                  >
                    <item.icon className="h-5 w-5" />
                    {open && <span>{item.title}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isOwner && open && (
          <div className="mt-auto p-4 border-t bg-gradient-to-br from-primary/5 to-secondary/5">
            <div className="flex items-center gap-2 text-sm">
              <Shield className="h-4 w-4 text-primary" />
              <div>
                <p className="font-semibold text-primary">Modo Owner</p>
                <p className="text-xs text-muted-foreground">Acesso total ao sistema</p>
              </div>
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
};
