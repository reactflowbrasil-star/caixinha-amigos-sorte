import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Upload, Copy } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/configuracoes")({
  component: Configuracoes,
});

interface Settings {
  pix_key: string | null;
  pix_key_type: string | null;
  pix_qr_url: string | null;
  pix_copy_paste: string | null;
  admin_whatsapp: string | null;
  daily_amount: number;
}

function Configuracoes() {
  const { user } = useAuth();
  const [s, setS] = useState<Settings>({
    pix_key: "", pix_key_type: "email", pix_qr_url: "", pix_copy_paste: "", admin_whatsapp: "", daily_amount: 5,
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.from("app_settings").select("*").eq("id", 1).single().then(({ data }) => {
      if (data) setS(data as any);
    });
  }, []);

  async function save() {
    setSaving(true);
    const { error } = await supabase.from("app_settings").update({
      pix_key: s.pix_key,
      pix_key_type: s.pix_key_type,
      pix_qr_url: s.pix_qr_url,
      pix_copy_paste: s.pix_copy_paste,
      admin_whatsapp: s.admin_whatsapp?.replace(/\D/g, ""),
      daily_amount: s.daily_amount,
      updated_by: user?.id,
    }).eq("id", 1);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Configurações salvas");
  }

  async function uploadQR(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const path = `${user.id}/qr-${Date.now()}.${file.name.split(".").pop()}`;
    const { error } = await supabase.storage.from("pix-qr").upload(path, file, { upsert: true });
    if (error) {
      toast.error(error.message);
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from("pix-qr").getPublicUrl(path);
    setS({ ...s, pix_qr_url: data.publicUrl });
    setUploading(false);
    toast.success("QR Code enviado — clique em Salvar");
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold">Configurações</h1>
        <p className="text-sm text-muted-foreground">Defina chave Pix, QR code e contato do admin.</p>
      </div>

      <Card className="p-5 space-y-4">
        <h2 className="font-bold">Chave Pix</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="sm:col-span-1">
            <Label>Tipo</Label>
            <Select value={s.pix_key_type || "email"} onValueChange={(v) => setS({ ...s, pix_key_type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="email">E-mail</SelectItem>
                <SelectItem value="cpf">CPF</SelectItem>
                <SelectItem value="phone">Telefone</SelectItem>
                <SelectItem value="random">Aleatória</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label>Chave</Label>
            <Input value={s.pix_key || ""} onChange={(e) => setS({ ...s, pix_key: e.target.value })} placeholder="caixinha@eldorado.com.br" />
          </div>
        </div>

        <div>
          <Label>Pix Copia-e-Cola (BRCode)</Label>
          <Textarea
            value={s.pix_copy_paste || ""}
            onChange={(e) => setS({ ...s, pix_copy_paste: e.target.value })}
            placeholder="00020126360014BR.GOV.BCB.PIX..."
            rows={3}
            className="font-mono text-xs"
          />
          {s.pix_copy_paste && (
            <Button
              type="button" size="sm" variant="ghost" className="mt-1"
              onClick={() => { navigator.clipboard.writeText(s.pix_copy_paste!); toast.success("Copiado"); }}
            >
              <Copy className="h-3 w-3 mr-1" /> Testar copiar
            </Button>
          )}
        </div>

        <div>
          <Label>QR Code (imagem)</Label>
          <div className="flex items-center gap-3">
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={uploadQR} />
            <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
              <Upload className="mr-2 h-4 w-4" /> {uploading ? "Enviando..." : "Enviar imagem"}
            </Button>
            {s.pix_qr_url && (
              <img src={s.pix_qr_url} alt="QR Code Pix" className="h-20 w-20 rounded border object-cover" />
            )}
          </div>
        </div>
      </Card>

      <Card className="p-5 space-y-4">
        <h2 className="font-bold">Contato e regras</h2>
        <div>
          <Label>WhatsApp do admin (com DDD, só números)</Label>
          <Input
            value={s.admin_whatsapp || ""}
            onChange={(e) => setS({ ...s, admin_whatsapp: e.target.value })}
            placeholder="5511999999999"
          />
          <p className="text-xs text-muted-foreground mt-1">Usado para os usuários enviarem comprovantes.</p>
        </div>
        <div>
          <Label>Valor diário (R$)</Label>
          <Input
            type="number" step="0.50" min="1"
            value={s.daily_amount}
            onChange={(e) => setS({ ...s, daily_amount: Number(e.target.value) })}
          />
        </div>
      </Card>

      <Button onClick={save} disabled={saving} className="bg-primary">
        <Save className="mr-2 h-4 w-4" /> {saving ? "Salvando..." : "Salvar tudo"}
      </Button>
    </div>
  );
}
