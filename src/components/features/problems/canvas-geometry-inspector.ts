export interface GeometryInspectionResult {
  isValid: boolean;
  file: File;
  width?: number;
  height?: number;
  aspectRatio?: number;
  error?: string;
}

const MIN_DIMENSION = 200;
const MAX_DIMENSION = 2560;
const MIN_ASPECT_RATIO = 0.20;
const MAX_ASPECT_RATIO = 5.00;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

/**
 * Client-Side HTML5 Canvas Geometry Inspector.
 * Validates dimensions, aspect ratio, and performs offscreen downscale optimization
 * to avoid uploading 15MB phone camera images directly to object storage.
 */
export async function inspectImageGeometry(file: File): Promise<GeometryInspectionResult> {
  // 1. MIME check
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      isValid: false,
      file,
      error: "Only .jpg, .png, and .webp images are allowed for problem photos.",
    };
  }

  // 2. File size check
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      file,
      error: "File size exceeds 5MB limit. Please upload a smaller image.",
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
          error: "Image dimensions are disproportionate. Please crop to focus specifically on the question.",
        });
        return;
      }

      // 5. Downscale optimization if image exceeds 2560px
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        try {
          const scale = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
          const targetWidth = Math.round(width * scale);
          const targetHeight = Math.round(height * scale);

          const canvas = document.createElement("canvas");
          canvas.width = targetWidth;
          canvas.height = targetHeight;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve({ isValid: true, file, width, height, aspectRatio });
            return;
          }

          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

          // Test WebP export with JPEG fallback
          const format = "image/webp";
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const optimizedName = file.name.replace(/\.[^.]+$/, ".webp");
                const optimizedFile = new File([blob], optimizedName, {
                  type: "image/webp",
                  lastModified: Date.now(),
                });
                resolve({
                  isValid: true,
                  file: optimizedFile,
                  width: targetWidth,
                  height: targetHeight,
                  aspectRatio,
                });
              } else {
                // Fallback to original file if blob export failed
                resolve({ isValid: true, file, width, height, aspectRatio });
              }
            },
            format,
            0.88
          );
        } catch {
          resolve({ isValid: true, file, width, height, aspectRatio });
        }
      } else {
        resolve({
          isValid: true,
          file,
          width,
          height,
          aspectRatio,
        });
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
