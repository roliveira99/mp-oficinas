const MAX_IMAGE_INPUT_BYTES = 12 * 1024 * 1024;
const MAX_VIDEO_INPUT_BYTES = 5 * 1024 * 1024;
const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.82;

function loadImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Não foi possível ler esta imagem."));
    };
    img.src = url;
  });
}

function canvasToJpegBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Falha ao processar a imagem."))),
      "image/jpeg",
      quality
    );
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Falha ao preparar o arquivo."));
    reader.readAsDataURL(blob);
  });
}

/** Redimensiona e comprime uma foto da galeria/dispositivo para salvar no perfil. */
export async function processImageFile(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Selecione um arquivo de imagem (JPG, PNG, WebP…).");
  }
  if (file.size > MAX_IMAGE_INPUT_BYTES) {
    throw new Error("Imagem muito grande. O limite é 12 MB.");
  }

  const img = await loadImageElement(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Seu navegador não suporta processamento de imagem.");

  ctx.drawImage(img, 0, 0, width, height);

  let quality = JPEG_QUALITY;
  let blob = await canvasToJpegBlob(canvas, quality);

  while (blob.size > 900_000 && quality > 0.5) {
    quality -= 0.08;
    blob = await canvasToJpegBlob(canvas, quality);
  }

  return blobToDataUrl(blob);
}

export async function processImageFiles(files: FileList | File[]): Promise<string[]> {
  const results: string[] = [];
  for (const file of Array.from(files)) {
    results.push(await processImageFile(file));
  }
  return results;
}

/** Lê um vídeo do dispositivo (limite 5 MB) para salvar no perfil ou catálogo. */
export async function processVideoFile(file: File): Promise<string> {
  if (!file.type.startsWith("video/")) {
    throw new Error("Selecione um arquivo de vídeo (MP4, WebM, MOV…).");
  }
  if (file.size > MAX_VIDEO_INPUT_BYTES) {
    throw new Error("Vídeo muito grande. O limite é 5 MB — prefira clipes curtos.");
  }
  return blobToDataUrl(file);
}

export async function processVideoFiles(files: FileList | File[]): Promise<string[]> {
  const results: string[] = [];
  for (const file of Array.from(files)) {
    results.push(await processVideoFile(file));
  }
  return results;
}

export function detectGalleryMediaType(file: File): "image" | "video" {
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("image/")) return "image";
  throw new Error("Selecione uma foto ou vídeo.");
}

export async function processGalleryMediaFile(
  file: File
): Promise<{ url: string; mediaType: "image" | "video" }> {
  const mediaType = detectGalleryMediaType(file);
  const url =
    mediaType === "video" ? await processVideoFile(file) : await processImageFile(file);
  return { url, mediaType };
}
