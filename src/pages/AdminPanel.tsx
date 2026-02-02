import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { AdminUsers } from "@/components/admin/AdminUsers";
import { AdminPlans } from "@/components/admin/AdminPlans";
import { AdminPayments } from "@/components/admin/AdminPayments";
import { AdminReports } from "@/components/admin/AdminReports";
import { AdminSettings } from "@/components/admin/AdminSettings";
import { AdminRoles } from "@/components/admin/AdminRoles";
import { AdminFeedbacks } from "@/components/admin/AdminFeedbacks";
import { AdminChangelog } from "@/components/admin/AdminChangelog";
import { AdminSiteSettings } from "@/components/admin/AdminSiteSettings";
import { AdminAffiliates } from "@/components/admin/AdminAffiliates";
import { Logo } from "@/components/Logo";

const AdminPanel = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("dashboard");
  const OWNER_ID = "0aa7f072-7169-48f3-9389-170100fb2418";

  // Fetch user roles
  const { data: userRoles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ["userRoles", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      if (error) throw error;
      return data.map(r => r.role);
    },
    enabled: !!user,
  });

  const isOwner = user?.id === OWNER_ID;
  const isAdmin = userRoles.includes("admin") || isOwner;

  // Redirect if not authorized
  if (!authLoading && !rolesLoading && !isAdmin) {
    navigate("/dashboard");
    return null;
  }

  if (authLoading || rolesLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Logo size="lg" />
          <p className="text-muted-foreground">Carregando painel administrativo...</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return <AdminDashboard isOwner={isOwner} />;
      case "users":
        return <AdminUsers />;
      case "roles":
        return <AdminRoles isOwner={isOwner} />;
      case "plans":
        return <AdminPlans />;
      case "payments":
        return <AdminPayments />;
      case "affiliates":
        return <AdminAffiliates />;
      case "feedbacks":
        return <AdminFeedbacks />;
      case "changelog":
        return <AdminChangelog />;
      case "site-settings":
        return <AdminSiteSettings />;
      case "reports":
        return <AdminReports />;
      case "settings":
        return <AdminSettings />;
      default:
        return <AdminDashboard isOwner={isOwner} />;
    }
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar 
          activeSection={activeSection} 
          onSectionChange={setActiveSection}
          isOwner={isOwner}
        />
        
        <div className="flex-1 flex flex-col w-full">
          <AdminHeader isOwner={isOwner} />
          
          <main className="flex-1 p-6 overflow-auto">
            {renderContent()}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminPanel;
