import Image from "next/image";
import { getEmbedVideoUrl, isDataVideoUrl, isEmbedVideoUrl, isUploadedMediaUrl } from "@/lib/media-url";

export function MediaPreview({
  src,
  alt = "",
  className = "h-full w-full object-cover",
  videoClassName,
  fill,
  controls = true,
}: {
  src: string;
  alt?: string;
  className?: string;
  videoClassName?: string;
  fill?: boolean;
  controls?: boolean;
}) {
  if (isEmbedVideoUrl(src)) {
    const embed = getEmbedVideoUrl(src);
    if (!embed) return null;
    return (
      <iframe
        src={embed}
        title={alt || "Vídeo"}
        className={videoClassName ?? "aspect-video h-full w-full rounded-lg border-0"}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }

  if (isDataVideoUrl(src) || /\.(mp4|webm|mov)(\?|$)/i.test(src)) {
    return (
      <video
        src={src}
        controls={controls}
        playsInline
        className={videoClassName ?? className}
        aria-label={alt || "Vídeo"}
      />
    );
  }

  if (isUploadedMediaUrl(src)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt} className={className} />
    );
  }

  if (fill) {
    return <Image src={src} alt={alt} fill className={className} sizes="(max-width: 768px) 100vw, 50vw" unoptimized={isUploadedMediaUrl(src)} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} />
  );
}
