import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Send, Plug, Loader2, Building2, RefreshCw, Trash2, AlertTriangle, Lightbulb, Crown, X, Copy, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

declare global {
  interface Window { PluggyConnect: any; }
}

interface Msg { role: "user" | "assistant"; content: string; limitReached?: boolean; }

const fmtBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const normalize = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9 ]/g, "").trim();

export const CtrlAIChat = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Oi! Eu sou a **Ctrl AI** ✨\n\nPosso te ajudar com **dicas de economia, análise de assinaturas e organização financeira** mesmo sem conectar nenhuma conta.\n\n> 💡 Para análises **muito mais precisas** (gastos reais, padrões e duplicatas), conecte sua conta via **Open Finance** no botão acima." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);

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

  const { data: subs = [] } = useQuery({
    queryKey: ["subs-for-ai"],
    queryFn: async () => {
      const { data } = await supabase.from("subscriptions").select("*").eq("is_active", true);
      return data || [];
    },
  });

  const { data: txs = [] } = useQuery({
    queryKey: ["txs-for-ai"],
    queryFn: async () => {
      const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase.from("pluggy_transactions").select("description,amount,date").gte("date", since);
      return data || [];
    },
  });

  // Auto recommendations
  const recommendations = useMemo(() => {
    const recs: { id: string; type: "duplicate" | "unused"; title: string; description: string; subIds: string[]; saving: number; }[] = [];

    // Duplicates: same normalized name OR similar prefix
    const groups = new Map<string, any[]>();
    for (const s of subs) {
      const key = normalize(s.name).split(" ")[0];
      if (!key) continue;
      const arr = groups.get(key) || [];
      arr.push(s);
      groups.set(key, arr);
    }
    for (const [key, arr] of groups) {
      if (arr.length >= 2) {
        const total = arr.reduce((sum, x) => sum + Number(x.value || 0), 0);
        const min = Math.min(...arr.map((x) => Number(x.value || 0)));
        recs.push({
          id: `dup-${key}`,
          type: "duplicate",
          title: `Possível duplicata: ${arr.map((a) => a.name).join(", ")}`,
          description: `${arr.length} assinaturas parecidas detectadas. Mantendo só a mais barata você economiza **${fmtBRL(total - min)}**/mês.`,
          subIds: arr.map((a) => a.id),
          saving: total - min,
        });
      }
    }

    // Unused: subscription name not seen in last 90 days of transactions
    if (txs.length > 0) {
      for (const s of subs) {
        const norm = normalize(s.name);
        if (!norm) continue;
        const seen = txs.some((t: any) => normalize(t.description || "").includes(norm));
        if (!seen) {
          recs.push({
            id: `unused-${s.id}`,
            type: "unused",
            title: `${s.name} parece pouco usada`,
            description: `Não vi nenhuma transação relacionada nos últimos 90 dias. Cancelar economiza **${fmtBRL(Number(s.value))}**/mês.`,
            subIds: [s.id],
            saving: Number(s.value),
          });
        }
      }
    }

    return recs.filter((r) => !dismissed.has(r.id));
  }, [subs, txs, dismissed]);

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
          toast({ title: "Conta conectada!", description: "Sincronizando..." });
          await supabase.functions.invoke("pluggy-sync", { body: { itemId: itemData.item.id } });
          qc.invalidateQueries({ queryKey: ["pluggy-items"] });
          qc.invalidateQueries({ queryKey: ["txs-for-ai"] });
        },
        onError: (err: any) => toast({ title: "Erro", description: err?.message, variant: "destructive" }),
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
    else { toast({ title: "Sincronizado!" }); qc.invalidateQueries({ queryKey: ["txs-for-ai"] }); }
  };

  const handleRemove = async (id: string) => {
    if (!confirm("Remover esta conta conectada?")) return;
    await supabase.from("pluggy_items").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["pluggy-items"] });
  };

  const cancelSubscription = async (id: string) => {
    const { error } = await supabase.from("subscriptions").update({ is_active: false }).eq("id", id);
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    toast({ title: "Assinatura cancelada", description: "Removida da sua lista ativa." });
    qc.invalidateQueries({ queryKey: ["subs-for-ai"] });
    qc.invalidateQueries({ queryKey: ["all-subscriptions"] });
    qc.invalidateQueries({ queryKey: ["subscriptions"] });
  };

  const applyRec = async (rec: typeof recommendations[number]) => {
    if (rec.type === "duplicate") {
      // keep cheapest, cancel others
      const list = subs.filter((s: any) => rec.subIds.includes(s.id));
      const cheapest = list.reduce((m: any, x: any) => (Number(x.value) < Number(m.value) ? x : m), list[0]);
      const toCancel = list.filter((s: any) => s.id !== cheapest.id);
      if (!confirm(`Cancelar ${toCancel.length} assinatura(s) e manter ${cheapest.name}?`)) return;
      for (const s of toCancel) await cancelSubscription(s.id);
    } else {
      const s = subs.find((x: any) => x.id === rec.subIds[0]);
      if (!s) return;
      if (!confirm(`Cancelar "${s.name}"?`)) return;
      await cancelSubscription(s.id);
    }
    setDismissed((d) => new Set([...d, rec.id]));
  };

  const send = async (preset?: string) => {
    const text = (preset ?? input).trim();
    if (!text || loading) return;
    const newMessages: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ctrl-ai-chat", {
        body: { messages: newMessages.map((m) => ({ role: m.role, content: m.content })) },
      });
      if (error) {
        let errMsg = error.message;
        try { errMsg = JSON.parse((error as any)?.context?.body || "{}")?.error || errMsg; } catch {}
        if (errMsg === "limit_reached" || /402/.test(error.message || "")) {
          setMessages((p) => [...p, {
            role: "assistant",
            limitReached: true,
            content: "🚫 Você atingiu o limite de **5 perguntas/mês** do plano Free.\n\nFaça upgrade para **Premium** e tenha:\n\n- 💬 Conversas **ilimitadas** com a Ctrl AI\n- 📊 Análises detalhadas de gastos\n- 🔔 Alertas inteligentes em tempo real",
          }]);
          return;
        }
        throw new Error(errMsg);
      }
      setMessages((p) => [...p, { role: "assistant", content: data.content }]);
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

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card className="p-4 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="h-4 w-4 text-primary" />
            <h3 className="font-semibold">Recomendações automáticas</h3>
            <Badge variant="secondary" className="ml-auto">{recommendations.length}</Badge>
          </div>
          <div className="grid gap-2">
            <AnimatePresence>
              {recommendations.map((r) => (
                <motion.div
                  key={r.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex items-start gap-3 p-3 rounded-lg bg-background/70 border"
                >
                  <div className={`mt-0.5 h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                    r.type === "duplicate" ? "bg-amber-500/15 text-amber-600" : "bg-blue-500/15 text-blue-600"
                  }`}>
                    {r.type === "duplicate" ? <Copy className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{r.title}</p>
                    <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:my-0 text-muted-foreground">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{r.description}</ReactMarkdown>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="sm" onClick={() => applyRec(r)} className="bg-gradient-primary">
                      {r.type === "duplicate" ? "Resolver" : "Cancelar"}
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setDismissed((d) => new Set([...d, r.id]))}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </Card>
      )}

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
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  m.role === "user"
                    ? "bg-gradient-primary text-primary-foreground"
                    : "bg-muted/60 backdrop-blur"
                }`}>
                  <div className={`prose prose-sm dark:prose-invert max-w-none
                    [&>*:first-child]:mt-0 [&>*:last-child]:mb-0
                    [&_p]:my-2 [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-0.5
                    [&_h1]:text-base [&_h2]:text-base [&_h3]:text-sm
                    [&_h1]:mt-3 [&_h2]:mt-3 [&_h3]:mt-2 [&_h1]:mb-1 [&_h2]:mb-1 [&_h3]:mb-1
                    [&_table]:my-2 [&_table]:text-xs
                    [&_code]:text-xs [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:bg-foreground/10
                    [&_blockquote]:border-l-2 [&_blockquote]:border-primary [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-muted-foreground
                    ${m.role === "user" ? "[&_*]:text-primary-foreground" : ""}
                  `}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                  </div>
                  {m.limitReached && (
                    <div className="mt-3 pt-3 border-t border-border/50 flex flex-col sm:flex-row gap-2">
                      <Button onClick={() => navigate("/pricing")} className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:opacity-90 text-white shadow-glow">
                        <Crown className="h-4 w-4 mr-2" /> Fazer upgrade para Premium
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => navigate("/pricing")}>
                        Ver planos
                      </Button>
                    </div>
                  )}
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

        {messages.length <= 1 && (
          <div className="px-4 pb-2 flex flex-wrap gap-2">
            {["Analise minhas assinaturas", "Onde posso economizar?", "Resumo do mês"].map((q) => (
              <Button key={q} variant="outline" size="sm" onClick={() => send(q)}>{q}</Button>
            ))}
          </div>
        )}

        <div className="border-t p-4 flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
            placeholder="Pergunte sobre seus gastos..."
            disabled={loading}
          />
          <Button onClick={() => send()} disabled={loading || !input.trim()} className="bg-gradient-primary">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
};
