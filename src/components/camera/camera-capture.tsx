"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Camera, SwitchCamera, X, Upload, Aperture } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CameraCaptureProps = {
  onCapture: (imageBase64: string, mimeType: string) => void;
  onCancel: () => void;
};

type CameraState = "idle" | "streaming" | "captured" | "error";

export function CameraCapture({ onCapture, onCancel }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cameraState, setCameraState] = useState<CameraState>("idle");
  const [initCounter, setInitCounter] = useState(0);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">(
    "environment",
  );

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode,
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        setCameraState("streaming");
      } catch {
        if (!cancelled) setCameraState("error");
      }
    }

    init();
    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [facingMode, initCounter, stopCamera]);

  function capturePhoto() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    const base64 = dataUrl.split(",")[1];

    setCapturedImage(dataUrl);
    setCameraState("captured");
    stopCamera();

    onCapture(base64, "image/jpeg");
  }

  function retake() {
    setCapturedImage(null);
    setCameraState("idle");
    setInitCounter((c) => c + 1);
  }

  function switchCamera() {
    stopCamera();
    setCameraState("idle");
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      const mimeType = file.type || "image/jpeg";

      setCapturedImage(result);
      setCameraState("captured");
      stopCamera();

      onCapture(base64, mimeType);
    };
    reader.readAsDataURL(file);
  }

  // Error / no camera: show file upload fallback
  if (cameraState === "error") {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-border bg-card p-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
          <Camera className="h-7 w-7 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium">Camera unavailable</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Upload a photo of your groceries or receipt instead
          </p>
        </div>
        <Button
          variant="outline"
          className="gap-2 rounded-xl"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-4 w-4" />
          Upload photo
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="text-muted-foreground"
        >
          Cancel
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileUpload}
        />
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-black">
      {/* Video stream */}
      <video
        ref={videoRef}
        playsInline
        muted
        className={cn(
          "aspect-[3/4] w-full object-cover",
          cameraState === "captured" && "hidden",
        )}
      />

      {/* Captured preview */}
      {capturedImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={capturedImage}
          alt="Captured"
          className="aspect-[3/4] w-full object-cover"
        />
      )}

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Hidden file input fallback */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Controls overlay */}
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-6 bg-gradient-to-t from-black/60 to-transparent p-6 pt-16">
        {cameraState === "streaming" && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full text-white hover:bg-white/20"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-5 w-5" />
            </Button>

            <button
              onClick={capturePhoto}
              className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-white/20 transition-transform active:scale-90"
            >
              <Aperture className="h-8 w-8 text-white" />
            </button>

            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full text-white hover:bg-white/20"
              onClick={switchCamera}
            >
              <SwitchCamera className="h-5 w-5" />
            </Button>
          </>
        )}

        {cameraState === "captured" && (
          <Button
            variant="ghost"
            className="rounded-xl text-white hover:bg-white/20"
            onClick={retake}
          >
            Retake
          </Button>
        )}
      </div>

      {/* Close button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/40 text-white hover:bg-black/60"
        onClick={() => {
          stopCamera();
          onCancel();
        }}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
