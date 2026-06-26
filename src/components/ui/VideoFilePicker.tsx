"use client";

import { useId, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { MediaPreview } from "@/components/ui/MediaPreview";
import { processVideoFile } from "@/lib/client-media";

interface VideoFilePickerProps {
  label?: string;
  hint?: string;
  value?: string;
  onChange: (dataUrl: string) => void;
  onClear?: () => void;
  previewClassName?: string;
  buttonLabel?: string;
}

export function VideoFilePicker({
  label,
  hint,
  value,
  onChange,
  onClear,
  previewClassName = "aspect-video w-full max-w-md rounded-lg",
  buttonLabel = "Escolher vídeo",
}: VideoFilePickerProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleChange(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;

    setBusy(true);
    setError("");
    try {
      const dataUrl = await processVideoFile(file);
      onChange(dataUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar vídeo.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-3">
      {(label || hint) && (
        <div>
          {label && <p className="text-sm font-medium text-foreground">{label}</p>}
          {hint && <p className={`${label ? "mt-0.5" : ""} text-xs text-muted`}>{hint}</p>}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept="video/*"
          className="sr-only"
          disabled={busy}
          onChange={(e) => void handleChange(e.target.files)}
        />
        <label
          htmlFor={inputId}
          className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium transition hover:bg-surface-hover ${
            busy ? "pointer-events-none opacity-60" : ""
          }`}
        >
          <Icon name="sparkles" className="h-4 w-4 opacity-70" />
          {busy ? "Carregando vídeo…" : buttonLabel}
        </label>
        {value && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="rounded-lg border border-border px-3 py-2 text-sm text-muted hover:text-foreground"
          >
            Remover
          </button>
        )}
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      {value && previewClassName !== "hidden" && (
        <div className="overflow-hidden rounded-xl border border-border">
          <MediaPreview src={value} videoClassName={previewClassName} className={previewClassName} />
        </div>
      )}
    </div>
  );
}
