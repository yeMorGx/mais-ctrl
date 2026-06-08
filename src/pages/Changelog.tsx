import { Navigation } from "@/components/Navigation";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Sparkles, Bug, Zap, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const typeConfig = {
  feature: {
    label: "Novidade",
    icon: Sparkles,
    className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  },
  fix: {
    label: "Correção",
    icon: Bug,
    className: "bg-red-500/10 text-red-500 border-red-500/20",
  },
  improvement: {
    label: "Melhoria",
    icon: Zap,
    className: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  },
};

const Changelog = () => {
  const { data: entries, isLoading } = useQuery({
    queryKey: ["changelog"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("changelog")
        .select("*")
        .eq("is_published", true)
        .order("published_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      <div className="relative z-10 bg-gradient-hero">
        <Navigation />

        <div className="container mx-auto px-4 pt-32 pb-20">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-16">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Novidades do{" "}
                <span className="bg-gradient-primary bg-clip-text text-transparent">
                  +Ctrl
                </span>
              </h1>
              <p className="text-xl text-muted-foreground">
                Acompanhe todas as atualizações e melhorias do sistema
              </p>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : entries && entries.length > 0 ? (
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-8 top-0 bottom-0 w-px bg-border" />

                <div className="space-y-8">
                  {entries.map((entry, index) => {
                    const config = typeConfig[entry.type as keyof typeof typeConfig] || typeConfig.feature;
                    const Icon = config.icon;

                    return (
                      <div key={entry.id} className="relative pl-20">
                        {/* Timeline dot */}
                        <div className="absolute left-6 w-5 h-5 rounded-full bg-primary border-4 border-background" />

                        <div className="bg-card rounded-xl border border-border p-6 hover:shadow-elegant transition-shadow">
                          <div className="flex flex-wrap items-center gap-3 mb-3">
                            <Badge
                              variant="outline"
                              className={`${config.className} font-medium`}
                            >
                              <Icon className="w-3 h-3 mr-1" />
                              {config.label}
                            </Badge>
                            <Badge variant="secondary" className="font-mono">
                              v{entry.version}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {format(new Date(entry.published_at), "d 'de' MMMM 'de' yyyy", {
                                locale: ptBR,
                              })}
                            </span>
                          </div>

                          <h3 className="text-xl font-semibold mb-2">
                            {entry.title}
                          </h3>
                          <p className="text-muted-foreground leading-relaxed">
                            {entry.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-20 text-muted-foreground">
                Nenhuma atualização disponível ainda.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-border py-12">
          <div className="container mx-auto px-4 text-center text-muted-foreground">
            <p>© 2025 +Ctrl. Todos os direitos reservados.</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Changelog;
