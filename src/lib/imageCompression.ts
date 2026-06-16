// Client-side image normalisation for uploads.
//
// Why this exists:
// - Phone photos are frequently larger than our storage limits (8–15MB is common).
// - iPhones default to HEIC/HEIF, which most browsers cannot render in <img>, so a
//   "successful" upload looks broken in the CRM. Re-encoding to JPEG fixes display.
//
// This downscales to a sensible max dimension and re-encodes as JPEG. On any failure
// (e.g. a browser that can't decode HEIC), it falls back to the original file so the
// upload still goes through rather than blocking the user.

interface CompressOptions {
  maxDimension?: number; // longest edge, in px
  quality?: number; // 0..1 JPEG quality
}

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not decode image'));
    img.src = src;
  });
}

export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<File> {
  const maxDimension = options.maxDimension ?? 2000;
  const quality = options.quality ?? 0.85;

  const looksLikeImage =
    file.type.startsWith('image/') ||
    /\.(jpe?g|png|webp|heic|heif|bmp|tiff?)$/i.test(file.name);

  // Don't touch non-images or animated GIFs (canvas would flatten the animation).
  if (!looksLikeImage || file.type === 'image/gif') {
    return file;
  }

  try {
    const dataUrl = await readAsDataURL(file);
    const img = await loadImage(dataUrl);

    let { width, height } = img;
    if (!width || !height) return file;

    if (width > maxDimension || height > maxDimension) {
      const scale = Math.min(maxDimension / width, maxDimension / height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', quality)
    );
    if (!blob || blob.size === 0) return file;

    const newName = file.name.replace(/\.[^.]+$/, '') + '.jpg';
    return new File([blob], newName, { type: 'image/jpeg' });
  } catch {
    // Browser couldn't decode (e.g. HEIC on Chrome) — upload the original so the
    // user isn't blocked. It will at least be stored.
    return file;
  }
}
