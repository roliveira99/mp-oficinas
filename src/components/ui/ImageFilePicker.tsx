"use client";

import { useId, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { processGalleryMediaFile, processImageFile } from "@/lib/client-media";

interface ImageFilePickerProps {
  label?: string;
  hint?: string;
  value?: string;
  onChange: (dataUrl: string) => void;
  onClear?: () => void;
  previewClassName?: string;
  buttonLabel?: string;
}

export function ImageFilePicker({
  label,
  hint,
  value,
  onChange,
  onClear,
  previewClassName = "h-40 w-full object-cover",
  buttonLabel = "Escolher da galeria",
}: ImageFilePickerProps) {
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
      const dataUrl = await processImageFile(file);
      onChange(dataUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar imagem.");
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
          accept="image/*"
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
          {busy ? "Processando…" : buttonLabel}
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

      {value && (
        <div className="overflow-hidden rounded-xl border border-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className={previewClassName} />
        </div>
      )}
    </div>
  );
}

export function GalleryMediaPicker({
  onAdd,
  caption = "",
  disabled = false,
}: {
  onAdd: (items: { url: string; caption: string; mediaType: "image" | "video" }[]) => void;
  caption?: string;
  disabled?: boolean;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleChange(fileList: FileList | null) {
    if (!fileList?.length) return;

    setBusy(true);
    setError("");
    try {
      const items = await Promise.all(Array.from(fileList).map((file) => processGalleryMediaFile(file)));
      onAdd(
        items.map((item) => ({
          url: item.url,
          mediaType: item.mediaType,
          caption:
            caption.trim() ||
            (item.mediaType === "video" ? "Vídeo do perfil" : "Foto do perfil"),
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar arquivos.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/*,video/*"
        multiple
        className="sr-only"
        disabled={disabled || busy}
        onChange={(e) => void handleChange(e.target.files)}
      />
      <label
        htmlFor={inputId}
        className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border bg-surface px-4 py-3 text-sm font-medium transition hover:border-accent hover:bg-surface-hover ${
          disabled || busy ? "pointer-events-none opacity-60" : ""
        }`}
      >
        <Icon name="sparkles" className="h-4 w-4 opacity-70" />
        {busy ? "Enviando arquivos…" : "Adicionar fotos ou vídeos"}
      </label>
      <p className="text-xs text-muted">Selecione da galeria do celular ou do computador.</p>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
