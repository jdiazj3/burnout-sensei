import { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Video, VideoOff, Camera, Loader2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ExerciseVideoCaptureProps {
  isActive: boolean;
  onCapture: (imageData: string) => void;
  isAnalyzing: boolean;
  feedback?: VideoFeedback | null;
  onToggle: () => void;
  isMonitoring?: boolean;
  onToggleMonitoring?: () => void;
}

export interface VideoFeedback {
  isCorrect: boolean;
  message: string;
  corrections?: {
    area: string;
    instruction: string;
    position?: { x: number; y: number };
  }[];
}

export function ExerciseVideoCapture({
  isActive,
  onCapture,
  isAnalyzing,
  feedback,
  onToggle,
  isMonitoring = false,
  onToggleMonitoring,
}: ExerciseVideoCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
        audio: false,
      });
      setStream(mediaStream);
      setHasPermission(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      setHasPermission(false);
      toast({
        title: "Error de cámara",
        description: "No se pudo acceder a la cámara. Verifica los permisos.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [stream]);

  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    return canvas.toDataURL("image/jpeg", 0.7);
  }, []);

  // Draw feedback overlay
  useEffect(() => {
    if (!overlayRef.current || !feedback) return;

    const overlay = overlayRef.current;
    const ctx = overlay.getContext("2d");
    if (!ctx) return;

    // Clear previous overlay
    ctx.clearRect(0, 0, overlay.width, overlay.height);

    // Set overlay dimensions
    if (videoRef.current) {
      overlay.width = videoRef.current.videoWidth || 640;
      overlay.height = videoRef.current.videoHeight || 480;
    }

    // Draw feedback indicators
    if (feedback.corrections && feedback.corrections.length > 0) {
      feedback.corrections.forEach((correction, index) => {
        const x = correction.position?.x || 50 + index * 100;
        const y = correction.position?.y || 50;

        // Draw circle indicator
        ctx.beginPath();
        ctx.arc(x, y, 30, 0, 2 * Math.PI);
        ctx.strokeStyle = feedback.isCorrect ? "#22c55e" : "#ef4444";
        ctx.lineWidth = 4;
        ctx.stroke();

        // Draw number
        ctx.fillStyle = feedback.isCorrect ? "#22c55e" : "#ef4444";
        ctx.font = "bold 20px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(index + 1), x, y);

        // Draw label
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(x - 60, y + 40, 120, 25);
        ctx.fillStyle = "white";
        ctx.font = "12px sans-serif";
        ctx.fillText(correction.area, x, y + 52);
      });
    }

    // Draw overall status
    const statusText = feedback.isCorrect ? "✓ Correcto" : "⚠ Ajusta la postura";
    ctx.fillStyle = feedback.isCorrect ? "rgba(34, 197, 94, 0.9)" : "rgba(239, 68, 68, 0.9)";
    ctx.fillRect(10, 10, 150, 35);
    ctx.fillStyle = "white";
    ctx.font = "bold 16px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(statusText, 20, 32);
  }, [feedback]);

  // Auto-capture frames only when monitoring is active
  useEffect(() => {
    if (isActive && stream && !isAnalyzing && isMonitoring) {
      intervalRef.current = setInterval(() => {
        const frame = captureFrame();
        if (frame) {
          onCapture(frame);
        }
      }, 3000); // Capture every 3 seconds
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive, stream, isAnalyzing, isMonitoring, captureFrame, onCapture]);

  useEffect(() => {
    if (isActive && !stream) {
      startCamera();
    } else if (!isActive && stream) {
      stopCamera();
    }
  }, [isActive, stream, startCamera, stopCamera]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  if (!isActive) {
    return (
      <Card className="mb-4">
        <CardContent className="p-4">
          <Button
            onClick={onToggle}
            variant="outline"
            className="w-full gap-2"
          >
            <Video className="w-4 h-4" />
            Activar cámara para monitoreo
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-2">
            El bot analizará tu postura cada 3 segundos
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-4 overflow-hidden">
      <CardContent className="p-0 relative">
        <div className="relative bg-black aspect-video">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          <canvas ref={canvasRef} className="hidden" />
          <canvas
            ref={overlayRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
          />

          {/* Status indicators */}
          <div className="absolute top-2 right-2 flex gap-2">
            {isAnalyzing && (
              <div className="bg-amber-500/90 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                Analizando...
              </div>
            )}
            {isMonitoring && (
              <div className="bg-destructive text-destructive-foreground px-2 py-1 rounded-full text-xs flex items-center gap-1">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                MONITOREANDO
              </div>
            )}
            <div className="bg-muted text-muted-foreground px-2 py-1 rounded-full text-xs flex items-center gap-1">
              <Video className="w-3 h-3" />
              CÁMARA
            </div>
          </div>

          {/* Controls */}
          <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center gap-2">
            {onToggleMonitoring && (
              <>
                {!isMonitoring ? (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={onToggleMonitoring}
                    className="gap-1 flex-1"
                  >
                    <Camera className="w-4 h-4" />
                    Iniciar monitoreo
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={onToggleMonitoring}
                    disabled={isAnalyzing}
                    className="gap-1 flex-1"
                  >
                    <X className="w-4 h-4" />
                    Detener monitoreo
                  </Button>
                )}
              </>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const frame = captureFrame();
                if (frame) onCapture(frame);
              }}
              disabled={isAnalyzing || isMonitoring}
              className="gap-1"
            >
              <Camera className="w-4 h-4" />
              Captura manual
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={onToggle}
              className="gap-1"
            >
              <VideoOff className="w-4 h-4" />
              Cerrar
            </Button>
          </div>
        </div>

        {/* Feedback panel */}
        {feedback && (
          <div
            className={`p-3 ${
              feedback.isCorrect
                ? "bg-green-50 dark:bg-green-950 border-t border-green-200 dark:border-green-800"
                : "bg-red-50 dark:bg-red-950 border-t border-red-200 dark:border-red-800"
            }`}
          >
            <p
              className={`font-medium text-sm ${
                feedback.isCorrect
                  ? "text-green-700 dark:text-green-300"
                  : "text-red-700 dark:text-red-300"
              }`}
            >
              {feedback.message}
            </p>
            {feedback.corrections && feedback.corrections.length > 0 && (
              <ul className="mt-2 space-y-1">
                {feedback.corrections.map((correction, i) => (
                  <li
                    key={i}
                    className="text-xs text-muted-foreground flex items-start gap-2"
                  >
                    <span className="font-bold text-red-500">{i + 1}.</span>
                    <span>
                      <strong>{correction.area}:</strong> {correction.instruction}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {hasPermission === false && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
            <div className="text-center text-white p-4">
              <VideoOff className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="font-medium">Cámara no disponible</p>
              <p className="text-sm opacity-75">
                Permite el acceso a la cámara en tu navegador
              </p>
              <Button
                size="sm"
                variant="secondary"
                onClick={startCamera}
                className="mt-3"
              >
                Reintentar
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
