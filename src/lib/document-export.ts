/** Gera PNG a partir de HTML de documento com classe `.doc` (sem dependências externas). */
export async function exportDocumentPngFromHtml(html: string): Promise<Blob> {
  const iframe = document.createElement("iframe");
  Object.assign(iframe.style, {
    position: "fixed",
    left: "-10000px",
    top: "0",
    width: "760px",
    height: "2400px",
    border: "none",
  });
  document.body.appendChild(iframe);

  try {
    await new Promise<void>((resolve, reject) => {
      iframe.onload = () => resolve();
      iframe.onerror = () => reject(new Error("Falha ao renderizar o documento"));
      iframe.srcdoc = html;
    });

    const doc = iframe.contentDocument;
    if (!doc) throw new Error("Documento indisponível");

    const target = doc.querySelector(".doc");
    if (!target || !(target instanceof HTMLElement)) {
      throw new Error("Layout do documento não encontrado");
    }

    await doc.fonts?.ready;

    const w = Math.ceil(target.offsetWidth);
    const h = Math.ceil(target.offsetHeight);
    const clone = target.cloneNode(true) as HTMLElement;
    clone.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
      <foreignObject width="100%" height="100%">
        ${new XMLSerializer().serializeToString(clone)}
      </foreignObject>
    </svg>`;

    const svgUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

    return await new Promise<Blob>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const ratio = 2;
        const canvas = document.createElement("canvas");
        canvas.width = w * ratio;
        canvas.height = h * ratio;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas indisponível"));
          return;
        }
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.scale(ratio, ratio);
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Falha ao gerar PNG"));
        }, "image/png");
      };
      img.onerror = () => reject(new Error("Falha ao rasterizar o documento"));
      img.src = svgUrl;
    });
  } finally {
    document.body.removeChild(iframe);
  }
}

export function openDocumentPrintWindow(html: string): void {
  const win = window.open("", "_blank", "noopener,noreferrer");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 300);
}
