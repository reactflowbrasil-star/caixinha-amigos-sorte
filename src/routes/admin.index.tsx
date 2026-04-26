import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Users, HandCoins, CheckCircle2, Clock, TrendingUp } from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from "recharts";

export const Route = createFileRoute("/admin/")({
  component: AdminOverview,
});

interface DailyAgg {
  date: string;
  confirmado: number;
  pendente: number;
}

function AdminOverview() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    pending: 0,
    confirmedToday: 0,
    totalToday: 0,
  });
  const [series, setSeries] = useState<DailyAgg[]>([]);
  const [statusPie, setStatusPie] = useState<{ name: string; value: number }[]>([]);

  useEffect(() => { void load(); }, []);

  async function load() {
    const today = new Date().toISOString().slice(0, 10);
    const since = new Date(Date.now() - 13 * 86400000).toISOString().slice(0, 10);

    const [{ count: total }, { count: active }, { data: contribs14 }] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("is_active", true).eq("is_banned", false),
      supabase.from("contributions").select("contribution_date,status,amount").gte("contribution_date", since),
    ]);

    const byDate: Record<string, DailyAgg> = {};
    for (let i = 0; i < 14; i++) {
      const d = new Date(Date.now() - (13 - i) * 86400000).toISOString().slice(0, 10);
      byDate[d] = { date: d.slice(5), confirmado: 0, pendente: 0 };
    }
    let pending = 0, confirmedToday = 0, totalToday = 0;
    let cConf = 0, cPend = 0, cRej = 0;
    for (const c of contribs14 || []) {
      const k = c.contribution_date.slice(5);
      const bk = byDate[c.contribution_date];
      const amt = Number(c.amount);
      if (bk) {
        if (c.status === "confirmed") bk.confirmado += amt;
        else if (c.status === "pending") bk.pendente += amt;
      }
      if (c.status === "pending") { pending++; cPend++; }
      else if (c.status === "confirmed") { cConf++; }
      else if (c.status === "rejected") { cRej++; }
      if (c.contribution_date === today) {
        totalToday += amt;
        if (c.status === "confirmed") confirmedToday += amt;
      }
    }

    setStats({
      totalUsers: total || 0,
      activeUsers: active || 0,
      pending,
      confirmedToday,
      totalToday,
    });
    setSeries(Object.values(byDate));
    setStatusPie([
      { name: "Confirmados", value: cConf },
      { name: "Pendentes", value: cPend },
      { name: "Rejeitados", value: cRej },
    ]);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold">Visão geral</h1>
        <p className="text-sm text-muted-foreground">Resumo do CRM e dos pagamentos da Caixinha.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Total cadastrados" value={stats.totalUsers} />
        <StatCard icon={CheckCircle2} label="Ativos" value={stats.activeUsers} accent="text-primary" />
        <StatCard icon={Clock} label="Pendentes confirmação" value={stats.pending} accent="text-accent" />
        <StatCard icon={HandCoins} label="Arrecadado hoje" value={`R$ ${stats.confirmedToday.toFixed(2)}`} sub={`de R$ ${stats.totalToday.toFixed(2)} esperados`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> Pagamentos (últimos 14 dias)</h2>
              <p className="text-xs text-muted-foreground">Confirmado vs pendente em R$</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={series}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="date" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="confirmado" stroke="oklch(0.55 0.18 150)" strokeWidth={2} />
                <Line type="monotone" dataKey="pendente" stroke="oklch(0.72 0.18 35)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-bold mb-4">Status (14 dias)</h2>
          <div className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={statusPie} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={2}>
                  {statusPie.map((_, i) => (
                    <Cell key={i} fill={["oklch(0.55 0.18 150)", "oklch(0.88 0.18 95)", "oklch(0.58 0.22 25)"][i]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, accent }: { icon: any; label: string; value: any; sub?: string; accent?: string }) {
  return (
    <Card className="p-5">
      <Icon className={`h-5 w-5 mb-2 ${accent || "text-muted-foreground"}`} />
      <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{label}</p>
      <p className="text-2xl font-extrabold mt-1">{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground mt-1">{sub}</p>}
    </Card>
  );
}
