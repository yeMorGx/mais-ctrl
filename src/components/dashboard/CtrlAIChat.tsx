import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Send, Plug, Loader2, Building2, RefreshCw, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";

declare global {
  interface Window { PluggyConnect: any; }
}

interface Msg { role: "user" | "assistant"; content: string; }

export const CtrlAIChat = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Oi! Eu sou a **Ctrl AI** ✨\n\nConecte sua conta bancária via Open Finance e me pergunte qualquer coisa sobre seus gastos, padrões e oportunidades de economia." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load Pluggy Connect widget
  useEffect(() => {
    if (document.getElementById("pluggy-connect-script")) return;
    const s = document.createElement("script");
    s.id = "pluggy-connect-script";
    s.src = "https://cdn.pluggy.ai/web-connect/v2.9.0/pluggy-connect.js";
    s.async = true;
    document.body.appendChild(s);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const { data: items = [] } = useQuery({
    queryKey: ["pluggy-items"],
    queryFn: async () => {
      const { data } = await supabase.from("pluggy_items").select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke("pluggy-connect-token");
      if (error || !data?.accessToken) throw new Error(error?.message || "Falha ao iniciar conexão");

      if (!window.PluggyConnect) {
        toast({ title: "Aguarde", description: "Carregando widget, tente novamente em 2s." });
        return;
      }
      const pc = new window.PluggyConnect({
        connectToken: data.accessToken,
        includeSandbox: true,
        onSuccess: async (itemData: any) => {
          toast({ title: "Conta conectada!", description: "Sincronizando transações..." });
          const { error: syncErr } = await supabase.functions.invoke("pluggy-sync", {
            body: { itemId: itemData.item.id },
          });
          if (syncErr) toast({ title: "Erro ao sincronizar", description: syncErr.message, variant: "destructive" });
          else toast({ title: "Tudo pronto!", description: "Suas transações foram importadas." });
          qc.invalidateQueries({ queryKey: ["pluggy-items"] });
        },
        onError: (err: any) => {
          toast({ title: "Erro na conexão", description: err?.message || "Tente novamente", variant: "destructive" });
        },
      });
      pc.init();
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setConnecting(false);
    }
  };

  const handleSync = async (itemId: string) => {
    toast({ title: "Sincronizando..." });
    const { error } = await supabase.functions.invoke("pluggy-sync", { body: { itemId } });
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else toast({ title: "Sincronizado!" });
  };

  const handleRemove = async (id: string) => {
    if (!confirm("Remover esta conta conectada?")) return;
    await supabase.from("pluggy_items").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["pluggy-items"] });
  };

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const newMessages = [...messages, { role: "user" as const, content: text }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ctrl-ai-chat", {
        body: { messages: newMessages.map(m => ({ role: m.role, content: m.content })) },
      });
      if (error) {
        const msg = (error as any)?.context?.body ? JSON.parse((error as any).context.body)?.error : error.message;
        if (msg === "limit_reached" || (error as any)?.message?.includes("402")) {
          setMessages(prev => [...prev, { role: "assistant", content: "🚫 Você atingiu o limite de **5 perguntas/mês** do plano Free.\n\nFaça upgrade para Premium e tenha conversas ilimitadas com a Ctrl AI." }]);
        } else {
          throw new Error(msg || error.message);
        }
        return;
      }
      setMessages(prev => [...prev, { role: "assistant", content: data.content }]);
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-soft">
          <Sparkles className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Ctrl AI</h1>
          <p className="text-sm text-muted-foreground">Sua assistente financeira inteligente com Open Finance</p>
        </div>
      </div>

      {/* Connected accounts */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold flex items-center gap-2"><Building2 className="h-4 w-4" /> Contas conectadas</h3>
          <Button size="sm" onClick={handleConnect} disabled={connecting} className="bg-gradient-primary">
            {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plug className="h-4 w-4 mr-2" />}
            Conectar conta
          </Button>
        </div>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma conta conectada. Conecte via Open Finance para começar.</p>
        ) : (
          <div className="grid gap-2">
            {items.map((it: any) => (
              <div key={it.id} className="flex items-center justify-between p-3 rounded-lg bg-background/60 border">
                <div className="flex items-center gap-3">
                  {it.institution_logo && <img src={it.institution_logo} alt="" className="h-8 w-8 rounded" />}
                  <div>
                    <p className="font-medium text-sm">{it.institution_name}</p>
                    <p className="text-xs text-muted-foreground">{it.status}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => handleSync(it.pluggy_item_id)}><RefreshCw className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => handleRemove(it.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Chat */}
      <Card className="flex flex-col h-[600px]">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
          <AnimatePresence initial={false}>
            {messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  m.role === "user"
                    ? "bg-gradient-primary text-primary-foreground"
                    : "bg-muted/60 backdrop-blur"
                }`}>
                  <div className="prose prose-sm dark:prose-invert max-w-none [&>*]:my-1">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {loading && (
            <div className="flex justify-start">
              <div className="bg-muted/60 rounded-2xl px-4 py-3 flex gap-1">
                <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" />
                <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" />
                <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          )}
        </div>
        <div className="border-t p-4 flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
            placeholder="Pergunte sobre seus gastos..."
            disabled={loading}
          />
          <Button onClick={send} disabled={loading || !input.trim()} className="bg-gradient-primary">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
};
