const MAX_SOURCE_BYTES = 20 * 1024 * 1024;
const MAX_EDGE = 1600;

export async function optimizePlantPhoto(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) throw new Error("Choose an image file.");
  if (file.size > MAX_SOURCE_BYTES) throw new Error("Photo must be smaller than 20 MB.");

  const sourceUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("This photo could not be opened."));
      element.src = sourceUrl;
    });
    const scale = Math.min(1, MAX_EDGE / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Photo processing is not available on this device.");
    context.drawImage(image, 0, 0, width, height);
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((value) => value ? resolve(value) : reject(new Error("Photo processing failed.")), "image/webp", 0.82),
    );
    const baseName = file.name.replace(/\.[^.]+$/, "") || "plant";
    return new File([blob], `${baseName}.webp`, { type: "image/webp", lastModified: Date.now() });
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}
