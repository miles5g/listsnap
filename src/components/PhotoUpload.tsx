import React, { useCallback, useRef, useState } from "react";
import { Camera, Upload, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PhotoUploadProps {
  onImageUpload: (file: File, preview: string) => void;
  preview: string | null;
  isAnalyzing: boolean;
}

const MAX_IMAGE_DIMENSION = 1200;
const JPEG_QUALITY = 0.8;

async function compressImage(file: File): Promise<string> {
  try {
    const bitmap = await createImageBitmap(file);
    let { width: w, height: h } = bitmap;
    if (w <= MAX_IMAGE_DIMENSION && h <= MAX_IMAGE_DIMENSION) {
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("No 2d context");
      ctx.drawImage(bitmap, 0, 0);
      return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
    }
    if (w > h) {
      h = Math.round((h * MAX_IMAGE_DIMENSION) / w);
      w = MAX_IMAGE_DIMENSION;
    } else {
      w = Math.round((w * MAX_IMAGE_DIMENSION) / h);
      h = MAX_IMAGE_DIMENSION;
    }
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No 2d context");
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();
    return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
  } catch {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
    return dataUrl;
  }
}

const PhotoUpload: React.FC<PhotoUploadProps> = ({ onImageUpload, preview, isAnalyzing }) => {
  const [isDragging, setIsDragging] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) return;
      const dataUrl = await compressImage(file);
      onImageUpload(file, dataUrl);
    },
    [onImageUpload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  if (preview) {
    return (
      <div className="relative rounded-2xl overflow-hidden bg-black">
        <img
          src={preview}
          alt="Uploaded item"
          className="w-full max-h-[75vh] object-contain bg-black"
        />
        {!isAnalyzing && (
          <div className="absolute top-3 left-3 right-3 flex justify-end">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="font-mono text-xs h-9 shadow-md"
              onClick={() => fileInputRef.current?.click()}
            >
              Use different photo
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleChange}
              className="hidden"
              aria-hidden
            />
          </div>
        )}
        {isAnalyzing && (
          <div className="absolute inset-0 flex flex-col" aria-live="polite" aria-busy="true">
            {/* Dimmed overlay — image still visible */}
            <div className="absolute inset-0 bg-background/50" aria-hidden />
            {/* Scanning laser line — sweeps over the photo */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div
                className="absolute left-0 right-0 h-1 -mt-px animate-scan-sweep"
                style={{
                  boxShadow: "0 0 12px hsl(142 72% 50% / 0.9), 0 0 24px hsl(142 72% 50% / 0.5)",
                  background: "linear-gradient(to bottom, transparent 0%, hsl(142 72% 50% / 0.2) 20%, hsl(142 72% 60% / 0.95) 50%, hsl(142 72% 50% / 0.2) 80%, transparent 100%)",
                }}
              />
            </div>
            {/* Status */}
            <div className="absolute bottom-4 left-0 right-0 flex flex-col items-center gap-2" role="status">
              <span className="font-mono text-sm text-primary drop-shadow-sm" id="analyzing-status">Analyzing item…</span>
              <span className="text-xs text-muted-foreground font-mono">Usually 15–30 seconds</span>
              <div className="w-8 h-0.5 rounded-full bg-primary/40 overflow-hidden">
                <div className="h-full w-1/3 rounded-full bg-primary animate-pulse" style={{ animationDuration: "1s" }} />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Camera button — primary CTA on mobile */}
      <button
        type="button"
        onClick={() => cameraInputRef.current?.click()}
        className="w-full min-h-[140px] rounded-2xl bg-primary text-primary-foreground flex flex-col items-center justify-center gap-3 active:scale-[0.98] transition-transform glow-green"
      >
        <div className="w-16 h-16 rounded-full bg-primary-foreground/20 flex items-center justify-center">
          <Camera className="w-8 h-8" />
        </div>
        <span className="font-mono font-semibold text-base">Take Photo</span>
      </button>
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleChange}
        className="hidden"
      />

      {/* Browse / drag-drop area — secondary */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl min-h-[56px] flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 ${
          isDragging
            ? "border-primary bg-primary/5 glow-green"
            : "border-border hover:border-primary/40 hover:bg-card"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleChange}
          className="hidden"
        />
        {isDragging ? (
          <ImageIcon className="w-5 h-5 text-primary" />
        ) : (
          <Upload className="w-5 h-5 text-muted-foreground" />
        )}
        <span className="text-sm text-muted-foreground font-mono">Browse files</span>
      </div>
    </div>
  );
};

export default PhotoUpload;
