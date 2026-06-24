import { shareViaWhatsApp } from "@/lib/document-share";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export function downloadDocumentBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Mensagem curta para WhatsApp — o documento vai como imagem anexada, não como texto. */
export function buildWhatsAppImageIntro(
  documentTitle: string,
  tradeName: string,
  reference?: string
): string {
  const ref = reference ? ` (ref. ${reference})` : "";
  return `Olá! Segue o documento *${documentTitle}*${ref} da *${tradeName}*. Anexe a imagem salva nesta conversa.`;
}

export async function shareDocumentImageViaWhatsApp(input: {
  blob: Blob;
  filename: string;
  documentTitle: string;
  tradeName: string;
  reference?: string;
  phone?: string;
}): Promise<"shared" | "download"> {
  const intro = buildWhatsAppImageIntro(input.documentTitle, input.tradeName, input.reference);
  const file = new File([input.blob], input.filename, { type: "image/png" });

  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({
      files: [file],
      text: intro,
      title: input.documentTitle,
    });
    return "shared";
  }

  downloadDocumentBlob(input.blob, input.filename);
  const phone = (input.phone ?? "").replace(/\D/g, "");
  if (phone) {
    window.open(buildWhatsAppUrl(phone, intro), "_blank", "noopener,noreferrer");
  } else {
    shareViaWhatsApp(intro);
  }
  return "download";
}
