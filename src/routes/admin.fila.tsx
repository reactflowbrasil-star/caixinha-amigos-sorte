import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/fila")({
  component: Fila,
});

interface Profile {
  id: string;
  full_name: string;
  receive_position: number | null;
  is_active: boolean;
  is_banned: boolean;
  has_received: boolean;
}

function Fila() {
  const [queue, setQueue] = useState<Profile[]>([]);
  const [dirty, setDirty] = useState(false);

  useEffect(() => { void load(); }, []);

  async function load() {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, receive_position, is_active, is_banned, has_received")
      .eq("is_active", true)
      .eq("is_banned", false)
      .eq("has_received", false)
      .order("receive_position", { ascending: true, nullsFirst: false });

    // garante que quem não tem posição vai para o final
    const withPos = (data as Profile[]) || [];
    setQueue(withPos);
    setDirty(false);
  }

  function move(idx: number, dir: -1 | 1) {
    const next = [...queue];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setQueue(next);
    setDirty(true);
  }

  function autoFill() {
    setQueue((prev) => prev.map((p, i) => ({ ...p, receive_position: i + 1 })));
    setDirty(true);
  }

  async function save() {
    const updates = queue.map((p, i) => ({ id: p.id, position: i + 1 }));
    for (const u of updates) {
      await supabase.from("profiles").update({ receive_position: u.position }).eq("id", u.id);
    }
    toast.success("Fila atualizada");
    void load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold">Fila de recebimento</h1>
          <p className="text-sm text-muted-foreground">
            Reordene quem recebe primeiro. Quem já recebeu sai da fila automaticamente.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={autoFill}><Sparkles className="mr-2 h-4 w-4" /> Auto-numerar</Button>
          <Button onClick={save} disabled={!dirty} className="bg-primary"><Save className="mr-2 h-4 w-4" /> Salvar</Button>
        </div>
      </div>

      <Card className="divide-y">
        {queue.map((p, i) => (
          <div key={p.id} className="flex items-center justify-between gap-3 p-3">
            <div className="flex items-center gap-3">
              <div className="grid place-items-center h-10 w-10 rounded-xl bg-primary/10 text-primary font-extrabold">
                {i + 1}
              </div>
              <div>
                <p className="font-semibold">{p.full_name}</p>
                <p className="text-xs text-muted-foreground">
                  Posição salva: {p.receive_position ?? "—"}
                </p>
              </div>
            </div>
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" onClick={() => move(i, -1)} disabled={i === 0}>
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => move(i, 1)} disabled={i === queue.length - 1}>
                <ArrowDown className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        {queue.length === 0 && (
          <p className="text-center py-10 text-muted-foreground">Nenhum participante elegível na fila.</p>
        )}
      </Card>
    </div>
  );
}
