import { inferContentType } from "@/lib/upload-rules";

export interface GeometryInspectionResult {
  isValid: boolean;
  file: File;
  width?: number;
  height?: number;
  aspectRatio?: number;
  error?: string;
}

export interface InspectImageGeometryOptions {
  onProgress?: (stage: "reading" | "optimizing" | "done") => void;
  maxOutputMB?: number;
}

export const MAX_RAW_IMAGE_BYTES = 25 * 1024 * 1024; // 25MB raw pre-compression cap
const DEFAULT_MAX_OUTPUT_MB = 5;
const MIN_DIMENSION = 200;
const MAX_DIMENSION = 2560;
const MIN_ASPECT_RATIO = 0.2;
const MAX_ASPECT_RATIO = 5.0;
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

function encodeCanvasToWebP(
  canvas: HTMLCanvasElement,
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/webp", quality);
  });
}

function toWebpFileName(name: string): string {
  return name.includes(".") ? name.replace(/\.[^.]+$/, ".webp") : `${name}.webp`;
}

/**
 * Client-Side HTML5 Canvas Geometry Inspector.
 * Accepts raw images up to 25MB, validates dimensions and aspect ratio,
 * downscales >2560px or >maxOutputMB images to <=2560px WebP, and enforces <=maxOutputMB after compression.
 */
export async function inspectImageGeometry(
  file: File,
  options?: InspectImageGeometryOptions
): Promise<GeometryInspectionResult> {
  const maxOutputMB = options?.maxOutputMB ?? DEFAULT_MAX_OUTPUT_MB;
  const maxOutputBytes = maxOutputMB * 1024 * 1024;
  options?.onProgress?.("reading");

  // 1. MIME check (with extension inference when browser omits file.type)
  const effectiveType = inferContentType(file);
  if (!ALLOWED_MIME_TYPES.includes(effectiveType)) {
    return {
      isValid: false,
      file,
      error: "Only .jpg, .png, and .webp images are allowed.",
    };
  }

  // 2. Empty & raw pre-compression size check
  if (file.size <= 0) {
    return {
      isValid: false,
      file,
      error: "Image file is empty. Please choose a valid image.",
    };
  }

  if (file.size > MAX_RAW_IMAGE_BYTES) {
    return {
      isValid: false,
      file,
      error: "Raw image exceeds the 25MB limit. Please choose a smaller photo.",
    };
  }

  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = async () => {
      URL.revokeObjectURL(objectUrl);
      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;

      // 3. Minimum resolution check
      if (width < MIN_DIMENSION || height < MIN_DIMENSION) {
        resolve({
          isValid: false,
          file,
          width,
          height,
          error: `Image resolution is too low (${width}x${height}px). Minimum required is ${MIN_DIMENSION}px.`,
        });
        return;
      }

      // 4. Aspect ratio clamp check
      const aspectRatio = width / height;
      if (aspectRatio < MIN_ASPECT_RATIO || aspectRatio > MAX_ASPECT_RATIO) {
        resolve({
          isValid: false,
          file,
          width,
          height,
          aspectRatio,
          error:
            "Image dimensions are disproportionate. Please crop to focus specifically on the question.",
        });
        return;
      }

      // 5. Downscale & WebP compression when >2560px or >maxOutputBytes
      const needsOptimization =
        width > MAX_DIMENSION ||
        height > MAX_DIMENSION ||
        file.size > maxOutputBytes;

      if (!needsOptimization) {
        options?.onProgress?.("done");
        resolve({
          isValid: true,
          file,
          width,
          height,
          aspectRatio,
        });
        return;
      }

      options?.onProgress?.("optimizing");

      try {
        const scale = Math.min(1, MAX_DIMENSION / width, MAX_DIMENSION / height);
        const targetWidth = Math.round(width * scale);
        const targetHeight = Math.round(height * scale);

        const canvas = document.createElement("canvas");
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          if (file.size <= maxOutputBytes) {
            options?.onProgress?.("done");
            resolve({ isValid: true, file, width, height, aspectRatio });
          } else {
            resolve({
              isValid: false,
              file,
              width,
              height,
              aspectRatio,
              error:
                `Optimized image still exceeds ${maxOutputMB}MB. Please crop or use a lower-resolution photo.`,
            });
          }
          return;
        }

        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        let blob = await encodeCanvasToWebP(canvas, 0.86);
        if (blob && blob.size > maxOutputBytes) {
          blob = await encodeCanvasToWebP(canvas, 0.74);
        }

        if (!blob) {
          if (file.size <= maxOutputBytes) {
            options?.onProgress?.("done");
            resolve({ isValid: true, file, width, height, aspectRatio });
          } else {
            resolve({
              isValid: false,
              file,
              width,
              height,
              aspectRatio,
              error:
                `Optimized image still exceeds ${maxOutputMB}MB. Please crop or use a lower-resolution photo.`,
            });
          }
          return;
        }

        const optimizedFile = new File([blob], toWebpFileName(file.name), {
          type: "image/webp",
          lastModified: Date.now(),
        });

        if (optimizedFile.size > maxOutputBytes) {
          resolve({
            isValid: false,
            file: optimizedFile,
            width: targetWidth,
            height: targetHeight,
            aspectRatio,
            error:
              `Optimized image still exceeds ${maxOutputMB}MB. Please crop or use a lower-resolution photo.`,
          });
          return;
        }

        options?.onProgress?.("done");
        resolve({
          isValid: true,
          file: optimizedFile,
          width: targetWidth,
          height: targetHeight,
          aspectRatio,
        });
      } catch {
        if (file.size <= maxOutputBytes) {
          options?.onProgress?.("done");
          resolve({ isValid: true, file, width, height, aspectRatio });
        } else {
          resolve({
            isValid: false,
            file,
            width,
            height,
            aspectRatio,
            error:
              `Failed to optimize image below ${maxOutputMB}MB. Please upload a smaller image.`,
          });
        }
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({
        isValid: false,
        file,
        error: "Unable to read image file. The file may be corrupt.",
      });
    };

    img.src = objectUrl;
  });
}
