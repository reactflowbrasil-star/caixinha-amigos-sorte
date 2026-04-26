import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileDown, FileUp, Database, Loader2 } from "lucide-react";
import { downloadCSV } from "@/lib/csv";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/relatorios")({
  component: Relatorios,
});

function Relatorios() {
  const [busy, setBusy] = useState<string | null>(null);

  async function exportTable(name: "profiles" | "contributions" | "payouts" | "user_documents") {
    setBusy(name);
    try {
      const { data, error } = await supabase.from(name).select("*");
      if (error) throw error;
      if (!data || !data.length) {
        toast.info("Sem dados para exportar");
      } else {
        const flat = data.map((row: any) => {
          const out: Record<string, unknown> = {};
          for (const [k, v] of Object.entries(row)) {
            out[k] = v === null || v === undefined ? "" : typeof v === "object" ? JSON.stringify(v) : v;
          }
          return out;
        });
        downloadCSV(flat, `${name}-${new Date().toISOString().slice(0, 10)}.csv`);
        toast.success(`${name} exportado`);
      }
    } catch (e: any) {
      toast.error(e?.message || "Erro ao exportar");
    } finally {
      setBusy(null);
    }
  }

  async function exportAllJSON() {
    setBusy("json");
    try {
      const [p, c, pay, d, n, t, m] = await Promise.all([
        supabase.from("profiles").select("*"),
        supabase.from("contributions").select("*"),
        supabase.from("payouts").select("*"),
        supabase.from("user_documents").select("*"),
        supabase.from("notifications").select("*"),
        supabase.from("support_tickets").select("*"),
        supabase.from("messages").select("*"),
      ]);
      const dump = {
        exported_at: new Date().toISOString(),
        profiles: p.data,
        contributions: c.data,
        payouts: pay.data,
        user_documents: d.data,
        notifications: n.data,
        support_tickets: t.data,
        messages: m.data,
      };
      const blob = new Blob([JSON.stringify(dump, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `caixinha-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Backup completo gerado");
    } catch (e: any) {
      toast.error(e?.message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold">Relatórios e Backup</h1>
        <p className="text-sm text-muted-foreground">Exporte tabelas em CSV (Excel/Sheets) ou um backup completo em JSON.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ReportCard title="Usuários" desc="Todos os perfis cadastrados" busy={busy === "profiles"} onClick={() => exportTable("profiles")} />
        <ReportCard title="Contribuições" desc="Histórico completo de pagamentos" busy={busy === "contributions"} onClick={() => exportTable("contributions")} />
        <ReportCard title="Recebimentos" desc="Histórico de payouts" busy={busy === "payouts"} onClick={() => exportTable("payouts")} />
        <ReportCard title="Documentos" desc="Lista de documentos enviados" busy={busy === "user_documents"} onClick={() => exportTable("user_documents")} />
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Database className="h-6 w-6 text-primary" />
            <div>
              <h2 className="font-bold">Backup completo (JSON)</h2>
              <p className="text-xs text-muted-foreground">Exporta todas as tabelas em um único arquivo. Importação manual sob demanda.</p>
            </div>
          </div>
          <Button onClick={exportAllJSON} disabled={busy === "json"} variant="outline">
            {busy === "json" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileDown className="h-4 w-4 mr-2" />}
            Baixar backup
          </Button>
        </div>
      </Card>

      <Card className="p-5 border-dashed">
        <div className="flex items-center gap-3">
          <FileUp className="h-5 w-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Importação de backup é sensível e exige validação manual. Para restaurar, contate o time técnico com o arquivo JSON.
          </p>
        </div>
      </Card>
    </div>
  );
}

function ReportCard({ title, desc, onClick, busy }: { title: string; desc: string; onClick: () => void; busy: boolean }) {
  return (
    <Card className="p-5">
      <h3 className="font-bold">{title}</h3>
      <p className="text-xs text-muted-foreground mt-1 mb-3">{desc}</p>
      <Button size="sm" variant="outline" onClick={onClick} disabled={busy} className="w-full">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : (<><FileDown className="h-4 w-4 mr-2" /> Exportar CSV</>)}
      </Button>
    </Card>
  );
}
