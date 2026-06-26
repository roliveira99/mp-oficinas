export function isDataVideoUrl(url: string): boolean {
  return url.startsWith("data:video/");
}

export function isDataImageUrl(url: string): boolean {
  return url.startsWith("data:image/");
}

export function isUploadedMediaUrl(url: string): boolean {
  return url.startsWith("data:");
}

export function isYouTubeUrl(url: string): boolean {
  return /youtube\.com|youtu\.be/i.test(url);
}

export function isVimeoUrl(url: string): boolean {
  return /vimeo\.com/i.test(url);
}

export function isEmbedVideoUrl(url: string): boolean {
  return isYouTubeUrl(url) || isVimeoUrl(url);
}

export function getYouTubeEmbedUrl(url: string): string | null {
  const short = url.match(/youtu\.be\/([\w-]+)/i);
  if (short) return `https://www.youtube.com/embed/${short[1]}`;

  const watch = url.match(/[?&]v=([\w-]+)/i);
  if (watch) return `https://www.youtube.com/embed/${watch[1]}`;

  const embed = url.match(/youtube\.com\/embed\/([\w-]+)/i);
  if (embed) return `https://www.youtube.com/embed/${embed[1]}`;

  return null;
}

export function getVimeoEmbedUrl(url: string): string | null {
  const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  return match ? `https://player.vimeo.com/video/${match[1]}` : null;
}

export function getEmbedVideoUrl(url: string): string | null {
  return getYouTubeEmbedUrl(url) ?? getVimeoEmbedUrl(url);
}

export function mediaUrlLabel(url: string): string {
  if (isDataVideoUrl(url)) return "Vídeo do dispositivo";
  if (isDataImageUrl(url)) return "Imagem";
  if (isYouTubeUrl(url)) return "YouTube";
  if (isVimeoUrl(url)) return "Vimeo";
  return "Link externo";
}

const MAX_IMAGE_DATA_LENGTH = 2_500_000;
const MAX_VIDEO_DATA_LENGTH = 7_500_000;

export function isOversizedMediaUrl(url: string | undefined): boolean {
  if (!url) return false;
  if (url.startsWith("data:video/")) return url.length > MAX_VIDEO_DATA_LENGTH;
  if (url.startsWith("data:")) return url.length > MAX_IMAGE_DATA_LENGTH;
  return false;
}
