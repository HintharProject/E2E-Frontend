export const INLINE_IMAGE_TOKEN_REGEX = /^!\[((?:(?!\]\().)*)\]\(e2e-img:([^)\s]+)\)$/;

const IMAGE_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "svg",
]);

export interface MediaAttachmentLike {
  id?: string;
  attachment_url?: string | null;
  file_url?: string | null;
  download_url?: string | null;
  file_name?: string | null;
  attachment_name?: string | null;
  created_at?: string;
}

export interface TextComposerBlock {
  id: string;
  type: "text";
  content: string;
}

export interface ImageComposerBlock {
  id: string;
  type: "image";
  imageRef: string;
  caption: string;
}

export type ComposerBlock = TextComposerBlock | ImageComposerBlock;

let fallbackCounter = 0;

export function createComposerBlockId(prefix = "blk"): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  fallbackCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${fallbackCounter}`;
}

export function isImageFileName(name?: string | null): boolean {
  if (!name) return false;
  const clean = name.split("?")[0].trim();
  const dotIdx = clean.lastIndexOf(".");
  if (dotIdx <= 0 || dotIdx === clean.length - 1) return false;
  const ext = clean.slice(dotIdx + 1).toLowerCase();
  return IMAGE_EXTENSIONS.has(ext);
}

export function getAttachmentDisplayName(att: MediaAttachmentLike): string {
  return (
    att.file_name?.trim() ||
    att.attachment_name?.trim() ||
    att.id ||
    "attachment"
  );
}

export function getAttachmentPreviewUrl(att: MediaAttachmentLike): string {
  return (att.attachment_url || att.file_url || "").trim();
}

export function decodeInlineImageRef(rawRef: string): string {
  const trimmed = rawRef.trim();
  try {
    return decodeURIComponent(trimmed);
  } catch {
    return trimmed;
  }
}

export function sanitizeInlineCaption(caption: string): string {
  return caption
    .replace(/[\r\n]+/g, " ")
    .replace(/\[/g, "(")
    .replace(/\]/g, ")")
    .replace(/\s+/g, " ")
    .trim();
}

export function formatInlineImageToken(
  imageRef: string,
  caption = ""
): string {
  const cleanRef = imageRef.trim();
  if (!cleanRef) return "";
  const safeCaption = sanitizeInlineCaption(caption);
  return `![${safeCaption}](e2e-img:${encodeURIComponent(cleanRef)})`;
}

/**
 * Generates a collision-free filename by appending `-2`, `-3`, etc. before the extension.
 */
export function deduplicateFileName(
  fileName: string,
  existingNames: Iterable<string>
): string {
  const taken = new Set<string>();
  for (const existing of existingNames) {
    const trimmed = existing?.trim();
    if (trimmed) taken.add(trimmed.toLowerCase());
  }

  const clean = fileName.trim() || "attachment";
  if (!taken.has(clean.toLowerCase())) {
    return clean;
  }

  const dotIdx = clean.lastIndexOf(".");
  const hasExt = dotIdx > 0 && dotIdx < clean.length - 1;
  const base = hasExt ? clean.slice(0, dotIdx) : clean;
  const ext = hasExt ? clean.slice(dotIdx) : "";

  let suffix = 2;
  while (taken.has(`${base}-${suffix}${ext}`.toLowerCase())) {
    suffix += 1;
  }
  return `${base}-${suffix}${ext}`;
}

/**
 * Returns a new File wrapper if `file.name` collides with `existingNames`.
 */
export function renameFileIfColliding(
  file: File,
  existingNames: Iterable<string>
): File {
  const uniqueName = deduplicateFileName(file.name, existingNames);
  if (uniqueName === file.name) {
    return file;
  }
  return new File([file], uniqueName, {
    type: file.type,
    lastModified: file.lastModified,
  });
}

function trimSeparatorBlankLines(lines: string[]): string {
  let start = 0;
  let end = lines.length;
  while (start < end && lines[start].trim() === "") {
    start += 1;
  }
  while (end > start && lines[end - 1].trim() === "") {
    end -= 1;
  }
  return lines.slice(start, end).join("\n");
}

/**
 * Parses a raw Markdown/LaTeX `body` string into interleaved prose and inline image blocks.
 * Guarantees at least one text block.
 */
export function parseBodyToBlocks(body: string): ComposerBlock[] {
  const normalized = (body || "").replace(/\r\n/g, "\n");
  if (!normalized.trim()) {
    return [
      {
        id: createComposerBlockId("txt"),
        type: "text",
        content: "",
      },
    ];
  }

  const lines = normalized.split("\n");
  const blocks: ComposerBlock[] = [];
  let textBuffer: string[] = [];

  const flushText = () => {
    const content = trimSeparatorBlankLines(textBuffer);
    textBuffer = [];
    if (content.trim().length > 0) {
      blocks.push({
        id: createComposerBlockId("txt"),
        type: "text",
        content,
      });
    }
  };

  for (const line of lines) {
    const match = line.trim().match(INLINE_IMAGE_TOKEN_REGEX);
    if (match) {
      flushText();
      blocks.push({
        id: createComposerBlockId("img"),
        type: "image",
        caption: match[1].trim(),
        imageRef: decodeInlineImageRef(match[2]),
      });
    } else {
      textBuffer.push(line);
    }
  }

  flushText();

  if (blocks.length === 0) {
    return [
      {
        id: createComposerBlockId("txt"),
        type: "text",
        content: "",
      },
    ];
  }

  return blocks;
}

/**
 * Serializes editor blocks back into a single backend-compatible `body` string.
 */
export function serializeBlocksToBody(blocks: readonly ComposerBlock[]): string {
  const parts: string[] = [];

  for (const block of blocks) {
    if (block.type === "text") {
      const cleaned = block.content
        .replace(/\r\n/g, "\n")
        .replace(/^\n+|\n+$/g, "");
      if (cleaned.trim().length > 0) {
        parts.push(cleaned);
      }
    } else {
      const token = formatInlineImageToken(block.imageRef, block.caption);
      if (token) {
        parts.push(token);
      }
    }
  }

  return parts.join("\n\n");
}

/**
 * Merges consecutive text blocks after an image block is removed or moved,
 * guaranteeing at least one text block remains.
 */
export function normalizeComposerBlocks(
  blocks: readonly ComposerBlock[]
): ComposerBlock[] {
  const merged: ComposerBlock[] = [];

  for (const block of blocks) {
    if (block.type === "text") {
      const prev = merged[merged.length - 1];
      if (prev && prev.type === "text") {
        const left = prev.content.replace(/\n+$/g, "");
        const right = block.content.replace(/^\n+/g, "");
        const joined =
          left && right ? `${left}\n\n${right}` : left || right || "";
        merged[merged.length - 1] = {
          ...prev,
          content: joined,
        };
      } else {
        merged.push(block);
      }
    } else {
      merged.push(block);
    }
  }

  if (merged.length === 0) {
    return [
      {
        id: createComposerBlockId("txt"),
        type: "text",
        content: "",
      },
    ];
  }

  return merged;
}

/**
 * Returns decoded `imageRef` strings referenced as standalone inline tokens inside `body`.
 */
export function extractInlineImageRefs(body: string): string[] {
  if (!body) return [];
  const refs: string[] = [];
  const lines = body.replace(/\r\n/g, "\n").split("\n");
  for (const line of lines) {
    const match = line.trim().match(INLINE_IMAGE_TOKEN_REGEX);
    if (match) {
      const decoded = decodeInlineImageRef(match[2]);
      if (decoded) refs.push(decoded);
    }
  }
  return refs;
}

export function resolveAttachmentForRef<T extends MediaAttachmentLike>(
  ref: string,
  attachments: readonly T[]
): T | undefined {
  const target = decodeInlineImageRef(ref).trim().toLowerCase();
  if (!target || attachments.length === 0) return undefined;

  return attachments.find((att) => {
    const id = att.id?.trim().toLowerCase();
    const fileName = att.file_name?.trim().toLowerCase();
    const attName = att.attachment_name?.trim().toLowerCase();
    return id === target || fileName === target || attName === target;
  });
}

/**
 * Filters `attachments` down to images that are NOT referenced inline inside `body`.
 * Legacy posts/problems/solutions/lessons (with 0 inline tokens) return all image attachments.
 */
export function getUnplacedImageAttachments<T extends MediaAttachmentLike>(
  body: string,
  attachments: readonly T[]
): T[] {
  if (!attachments || attachments.length === 0) return [];
  const refs = extractInlineImageRefs(body);
  if (refs.length === 0) return [...attachments];

  const placedSet = new Set<T>();
  for (const ref of refs) {
    const matched = resolveAttachmentForRef(ref, attachments);
    if (matched) {
      placedSet.add(matched);
    }
  }

  return attachments.filter((att) => !placedSet.has(att));
}

/**
 * Removes `e2e-img:` tokens from prose excerpts for feed cards without leaking raw URIs.
 */
export function stripInlineImageTokens(text: string): string {
  if (!text) return "";
  return text
    .split(/\r?\n/)
    .filter((line) => !INLINE_IMAGE_TOKEN_REGEX.test(line.trim()))
    .join("\n")
    .replace(/!\[[^\]]*\]\(e2e-img:[^)\s]+\)/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function appendInlineImageToBody(
  body: string,
  imageRef: string,
  caption = ""
): string {
  const token = formatInlineImageToken(imageRef, caption);
  if (!token) return body;
  const trimmed = (body || "").replace(/\r\n/g, "\n").trim();
  return trimmed ? `${trimmed}\n\n${token}` : token;
}

export function removeInlineImageFromBody(
  body: string,
  imageRef: string
): string {
  const target = decodeInlineImageRef(imageRef).trim().toLowerCase();
  if (!target || !body) return body;
  const blocks = parseBodyToBlocks(body);
  const filtered = blocks.filter(
    (b) => !(b.type === "image" && b.imageRef.trim().toLowerCase() === target)
  );
  return serializeBlocksToBody(normalizeComposerBlocks(filtered));
}

export function toLightboxImages(attachments: readonly MediaAttachmentLike[]) {
  return attachments
    .map((att, idx) => {
      const url = (att?.attachment_url || att?.file_url || "").trim();
      const name = getAttachmentDisplayName(att) || `Image ${idx + 1}`;
      return {
        id: att?.id || String(idx),
        url,
        downloadUrl: att?.download_url || url,
        filename: name,
        alt: name,
      };
    })
    .filter((item) => Boolean(item.url));
}
