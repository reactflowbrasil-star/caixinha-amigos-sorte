import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SiteHeader } from "@/components/SiteHeader";
import { Upload, CheckCircle2, AlertCircle, Loader2, FileText, Camera } from "lucide-react";
import { toast } from "sonner";
import { formatCPF, isValidCPF } from "@/lib/cpf";

export const Route = createFileRoute("/perfil")({
  component: Perfil,
});

interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  cpf: string | null;
  cpf_valid: boolean;
  avatar_url: string | null;
}

interface Doc {
  id: string;
  document_type: string;
  status: string;
  file_path: string;
  notes: string | null;
  created_at: string;
}

const DOC_LABELS: Record<string, string> = {
  rg: "RG", cnh: "CNH", address_proof: "Comprovante de endereço",
  payment_proof: "Comprovante de pagamento", other: "Outro",
};

function Perfil() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [cpfInput, setCpfInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const avatarRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (user) void load(); }, [user]);

  async function load() {
    if (!user) return;
    const [{ data: prof }, { data: ds }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase.from("user_documents").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]);
    setProfile(prof as any);
    setDocs((ds as Doc[]) || []);
    setCpfInput(formatCPF((prof as any)?.cpf || ""));
  }

  async function saveCPF() {
    if (!user) return;
    const valid = isValidCPF(cpfInput);
    if (!valid) return toast.error("CPF inválido. Verifique os dígitos.");
    setSaving(true);
    const digits = cpfInput.replace(/\D/g, "");
    const { error } = await supabase.from("profiles").update({ cpf: digits, cpf_valid: true }).eq("id", user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("CPF validado e salvo");
    void load();
  }

  async function uploadAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingAvatar(true);
    const path = `${user.id}/avatar-${Date.now()}.${file.name.split(".").pop()}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) { toast.error(error.message); setUploadingAvatar(false); return; }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    await supabase.from("profiles").update({ avatar_url: data.publicUrl }).eq("id", user.id);
    setUploadingAvatar(false);
    toast.success("Foto atualizada");
    void load();
  }

  async function uploadDoc(type: string, file: File) {
    if (!user) return;
    setUploadingDoc(type);
    const path = `${user.id}/${type}-${Date.now()}.${file.name.split(".").pop()}`;
    const { error: upErr } = await supabase.storage.from("documents").upload(path, file);
    if (upErr) { toast.error(upErr.message); setUploadingDoc(null); return; }
    const { error } = await supabase.from("user_documents").insert({
      user_id: user.id, document_type: type as any, file_path: path,
    });
    setUploadingDoc(null);
    if (error) return toast.error(error.message);
    toast.success("Documento enviado para análise");
    void load();
  }

  if (!profile) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <SiteHeader />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold">Meu perfil</h1>
            <p className="text-sm text-muted-foreground">Foto, CPF e documentos.</p>
          </div>
          <Link to="/dashboard" className="text-sm text-primary hover:underline">← Voltar ao painel</Link>
        </div>

        <Tabs defaultValue="info">
          <TabsList>
            <TabsTrigger value="info">Informações</TabsTrigger>
            <TabsTrigger value="docs">Documentos</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="mt-4 space-y-4">
            <Card className="p-5">
              <h2 className="font-bold mb-4 flex items-center gap-2"><Camera className="h-4 w-4 text-primary" /> Foto de perfil</h2>
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback>{profile.full_name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <input ref={avatarRef} type="file" accept="image/*" hidden onChange={uploadAvatar} />
                <Button variant="outline" onClick={() => avatarRef.current?.click()} disabled={uploadingAvatar}>
                  <Upload className="mr-2 h-4 w-4" /> {uploadingAvatar ? "Enviando..." : "Trocar foto"}
                </Button>
              </div>
            </Card>

            <Card className="p-5 space-y-3">
              <h2 className="font-bold">CPF</h2>
              <p className="text-xs text-muted-foreground">
                Validamos o formato e os dígitos verificadores localmente. (A Receita Federal não oferece API pública gratuita.)
              </p>
              <div className="flex gap-2">
                <Input
                  value={cpfInput}
                  onChange={(e) => setCpfInput(formatCPF(e.target.value))}
                  placeholder="000.000.000-00"
                  maxLength={14}
                />
                <Button onClick={saveCPF} disabled={saving} className="bg-primary">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Validar"}
                </Button>
              </div>
              {profile.cpf_valid && (
                <Badge className="bg-primary"><CheckCircle2 className="h-3 w-3 mr-1" /> CPF válido</Badge>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="docs" className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {(["rg", "cnh", "address_proof"] as const).map((t) => (
                <DocUploader
                  key={t}
                  type={t}
                  label={DOC_LABELS[t]}
                  uploading={uploadingDoc === t}
                  onUpload={(f) => uploadDoc(t, f)}
                />
              ))}
            </div>

            <Card className="p-5">
              <h3 className="font-bold mb-3 flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> Histórico</h3>
              {docs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Nenhum documento enviado.</p>
              ) : (
                <div className="divide-y">
                  {docs.map((d) => (
                    <div key={d.id} className="flex items-center justify-between py-3">
                      <div>
                        <p className="font-medium">{DOC_LABELS[d.document_type] || d.document_type}</p>
                        <p className="text-xs text-muted-foreground">
                          Enviado em {new Date(d.created_at).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <Badge
                        className={d.status === "approved" ? "bg-primary" : ""}
                        variant={d.status === "approved" ? "default" : d.status === "rejected" ? "destructive" : "secondary"}
                      >
                        {d.status === "approved" ? "Aprovado" : d.status === "rejected" ? "Rejeitado" : "Em análise"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function DocUploader({ type, label, uploading, onUpload }: { type: string; label: string; uploading: boolean; onUpload: (f: File) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <Card className="p-5">
      <h3 className="font-bold mb-1">{label}</h3>
      <p className="text-xs text-muted-foreground mb-3">PNG, JPG ou PDF até 10MB</p>
      <input ref={ref} type="file" accept="image/*,.pdf" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); }} />
      <Button variant="outline" onClick={() => ref.current?.click()} disabled={uploading} className="w-full">
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : (<><Upload className="h-4 w-4 mr-2" /> Enviar {label}</>)}
      </Button>
    </Card>
  );
}
