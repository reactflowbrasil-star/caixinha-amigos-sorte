import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, Camera, RefreshCw, CheckCircle2, AlertCircle, ScanFace } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const MODELS_URL = "https://justadudewhohacks.github.io/face-api.js/models";
const MATCH_THRESHOLD = 0.55; // distance lower = better; <0.6 is generally considered match

interface Props {
  userId: string;
  documentImageUrl: string | null; // signed/public URL of RG/CNH
  currentSelfieUrl: string | null;
  faceVerified: boolean;
  faceScore: number | null;
  onUpdated: () => void;
}

let modelsLoaded = false;
async function loadModels() {
  if (modelsLoaded) return;
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODELS_URL),
    faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODELS_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODELS_URL),
  ]);
  modelsLoaded = true;
}

export function FaceVerification({
  userId, documentImageUrl, currentSelfieUrl, faceVerified, faceScore, onUpdated,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [stage, setStage] = useState<"idle" | "loading" | "camera" | "captured" | "comparing">("idle");
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [faceDetected, setFaceDetected] = useState(false);

  useEffect(() => () => stopCamera(), []);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  async function startCamera() {
    try {
      setStage("loading");
      setProgress(20);
      await loadModels();
      setProgress(60);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setProgress(100);
      setStage("camera");
      // start live face detection loop
      void detectLoop();
    } catch (e: any) {
      toast.error(e?.message || "Não foi possível acessar a câmera");
      setStage("idle");
    }
  }

  async function detectLoop() {
    if (!videoRef.current) return;
    const v = videoRef.current;
    const tick = async () => {
      if (!streamRef.current || stage === "captured") return;
      try {
        const det = await faceapi.detectSingleFace(
          v,
          new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }),
        );
        setFaceDetected(!!det);
      } catch { /* ignore */ }
      if (streamRef.current) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  function capture() {
    if (!videoRef.current || !canvasRef.current) return;
    const v = videoRef.current;
    const c = canvasRef.current;
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    // mirror to match preview
    ctx.translate(c.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(v, 0, 0, c.width, c.height);
    const dataUrl = c.toDataURL("image/jpeg", 0.9);
    setSnapshot(dataUrl);
    setStage("captured");
    stopCamera();
  }

  function retake() {
    setSnapshot(null);
    setStage("idle");
    setFaceDetected(false);
  }

  async function imageFromUrl(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Falha ao carregar imagem do documento"));
      img.src = url;
    });
  }

  async function imageFromDataUrl(dataUrl: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Falha ao carregar selfie"));
      img.src = dataUrl;
    });
  }

  async function compareAndSave() {
    if (!snapshot) return;
    if (!documentImageUrl) {
      toast.error("Envie um documento (RG ou CNH) antes de validar a selfie");
      return;
    }
    try {
      setStage("comparing");
      setProgress(10);
      await loadModels();
      setProgress(30);

      const [selfieImg, docImg] = await Promise.all([
        imageFromDataUrl(snapshot),
        imageFromUrl(documentImageUrl),
      ]);
      setProgress(50);

      const opts = new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.4 });
      const selfieDet = await faceapi
        .detectSingleFace(selfieImg, opts)
        .withFaceLandmarks(true)
        .withFaceDescriptor();
      setProgress(70);
      const docDet = await faceapi
        .detectSingleFace(docImg, opts)
        .withFaceLandmarks(true)
        .withFaceDescriptor();
      setProgress(85);

      if (!selfieDet) {
        toast.error("Não detectamos um rosto na selfie. Tente novamente com boa iluminação e o rosto centralizado.");
        setStage("captured");
        return;
      }
      if (!docDet) {
        toast.error("Não detectamos um rosto no documento. Reenvie uma foto nítida do RG ou CNH.");
        setStage("captured");
        return;
      }

      const distance = faceapi.euclideanDistance(selfieDet.descriptor, docDet.descriptor);
      const score = Math.max(0, Math.min(1, 1 - distance)); // 0..1, higher = more similar
      const matched = distance <= MATCH_THRESHOLD;

      // upload selfie file
      const blob = await (await fetch(snapshot)).blob();
      const path = `${userId}/selfie-${Date.now()}.jpg`;
      const { error: upErr } = await supabase.storage.from("documents").upload(path, blob, {
        upsert: true, contentType: "image/jpeg",
      });
      if (upErr) throw upErr;
      const { data: signed } = await supabase.storage.from("documents").createSignedUrl(path, 60 * 60 * 24 * 365);

      const { error: pErr } = await supabase.from("profiles").update({
        selfie_url: signed?.signedUrl || path,
        face_verified: matched,
        face_match_score: Number(score.toFixed(4)),
      }).eq("id", userId);
      if (pErr) throw pErr;

      // also store as document for admin review
      await supabase.from("user_documents").insert({
        user_id: userId,
        document_type: "selfie" as any,
        file_path: path,
        notes: matched ? `Match automático (score ${score.toFixed(2)})` : `Sem match (score ${score.toFixed(2)})`,
      });

      setProgress(100);
      if (matched) {
        toast.success(`Validação facial aprovada! Similaridade: ${(score * 100).toFixed(0)}%`);
      } else {
        toast.warning(`Não foi possível confirmar (similaridade ${(score * 100).toFixed(0)}%). Admin fará revisão manual.`);
      }
      onUpdated();
      setStage("idle");
      setSnapshot(null);
    } catch (e: any) {
      toast.error(e?.message || "Erro na validação facial");
      setStage("captured");
    }
  }

  return (
    <Card className="p-4 sm:p-5 space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <ScanFace className="h-5 w-5 text-primary" />
          <h2 className="font-bold">Validação facial</h2>
        </div>
        {faceVerified ? (
          <Badge className="bg-primary"><CheckCircle2 className="h-3 w-3 mr-1" /> Verificado{faceScore != null && ` (${(faceScore * 100).toFixed(0)}%)`}</Badge>
        ) : currentSelfieUrl ? (
          <Badge variant="secondary"><AlertCircle className="h-3 w-3 mr-1" /> Em revisão{faceScore != null && ` (${(faceScore * 100).toFixed(0)}%)`}</Badge>
        ) : (
          <Badge variant="outline">Não enviado</Badge>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Tire uma selfie. Vamos comparar com a foto do seu RG ou CNH para confirmar que é você.
        {!documentImageUrl && <span className="block mt-1 text-amber-600 dark:text-amber-400">⚠ Envie primeiro um RG ou CNH na aba Documentos.</span>}
      </p>

      <div className="relative w-full aspect-[4/3] sm:aspect-video bg-muted rounded-xl overflow-hidden grid place-items-center">
        {stage === "camera" && (
          <>
            <video
              ref={videoRef}
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: "scaleX(-1)" }}
            />
            <div className={`absolute inset-6 sm:inset-10 rounded-full border-4 ${faceDetected ? "border-primary" : "border-white/60"} pointer-events-none transition-colors`} />
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
              <Badge className={faceDetected ? "bg-primary" : "bg-background text-foreground"}>
                {faceDetected ? "Rosto detectado" : "Posicione o rosto no círculo"}
              </Badge>
            </div>
          </>
        )}
        {stage === "captured" && snapshot && (
          <img src={snapshot} alt="Sua selfie" className="w-full h-full object-cover" />
        )}
        {(stage === "idle" || stage === "loading") && !snapshot && (
          <div className="text-center px-4">
            {currentSelfieUrl && stage === "idle" ? (
              <img src={currentSelfieUrl} alt="Selfie atual" className="w-32 h-32 sm:w-40 sm:h-40 mx-auto rounded-full object-cover border-4 border-background shadow-md" />
            ) : (
              <Camera className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
            )}
            {stage === "loading" && <p className="text-sm text-muted-foreground mt-3">Carregando câmera e modelos…</p>}
          </div>
        )}
        {(stage === "loading" || stage === "comparing") && (
          <div className="absolute inset-x-4 bottom-3"><Progress value={progress} /></div>
        )}
      </div>
      <canvas ref={canvasRef} hidden />

      <div className="flex flex-wrap gap-2">
        {stage === "idle" && (
          <Button onClick={startCamera} className="flex-1 bg-primary">
            <Camera className="h-4 w-4 mr-2" /> {currentSelfieUrl ? "Refazer selfie" : "Iniciar câmera"}
          </Button>
        )}
        {stage === "camera" && (
          <>
            <Button onClick={capture} disabled={!faceDetected} className="flex-1 bg-primary">
              <Camera className="h-4 w-4 mr-2" /> Capturar
            </Button>
            <Button variant="outline" onClick={() => { stopCamera(); setStage("idle"); }} className="flex-1 sm:flex-none">
              Cancelar
            </Button>
          </>
        )}
        {stage === "captured" && (
          <>
            <Button onClick={compareAndSave} className="flex-1 bg-primary" disabled={!documentImageUrl}>
              <CheckCircle2 className="h-4 w-4 mr-2" /> Validar e salvar
            </Button>
            <Button variant="outline" onClick={retake} className="flex-1 sm:flex-none">
              <RefreshCw className="h-4 w-4 mr-2" /> Refazer
            </Button>
          </>
        )}
        {stage === "comparing" && (
          <Button disabled className="flex-1"><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Comparando…</Button>
        )}
        {stage === "loading" && (
          <Button disabled className="flex-1"><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Preparando…</Button>
        )}
      </div>
    </Card>
  );
}
