"use client";

import * as React from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Expand,
  GripVertical,
  ImagePlus,
  Pilcrow,
  Plus,
  Sigma,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MathRenderer } from "@/components/ui/math-renderer";
import {
  ImageLightbox,
  type LightboxImageItem,
} from "@/components/ui/image-lightbox";
import {
  createComposerBlockId,
  normalizeComposerBlocks,
  parseBodyToBlocks,
  resolveAttachmentForRef,
  serializeBlocksToBody,
  type ComposerBlock,
  type MediaAttachmentLike,
} from "@/lib/inline-media";
import { formatBytes } from "@/lib/upload-rules";
import { cn } from "@/lib/utils";

export interface BlockEditorMediaItem extends MediaAttachmentLike {
  id: string;
  file_name: string;
  previewUrl: string;
  sizeBytes?: number;
  status?: "existing" | "idle" | "optimizing" | "uploading" | "uploaded" | "error";
  progress?: number;
}

export interface BlockDocumentEditorProps {
  id?: string;
  value: string;
  onChange: (nextBody: string) => void;
  onBlur?: () => void;
  mode: "write" | "preview";
  attachments: BlockEditorMediaItem[];
  canUploadMore?: boolean;
  acceptString?: string;
  onUploadImages?: (files: File[]) => Promise<Array<{ fileName: string }>>;
  maxLength?: number;
  placeholder?: string;
  disabled?: boolean;
  "aria-invalid"?: boolean;
  emptyPreviewText?: string;
}

export function BlockDocumentEditor({
  id,
  value,
  onChange,
  onBlur,
  mode,
  attachments,
  canUploadMore = false,
  acceptString = ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp",
  onUploadImages,
  maxLength,
  placeholder = "Explain the problem or derivation clearly. Insert diagrams wherever they help the reader.",
  disabled = false,
  "aria-invalid": ariaInvalid,
  emptyPreviewText = "Nothing to preview yet.",
}: BlockDocumentEditorProps) {
  const [blocks, setBlocks] = React.useState<ComposerBlock[]>(() =>
    parseBodyToBlocks(value)
  );
  const lastSerializedRef = React.useRef<string>(
    serializeBlocksToBody(parseBodyToBlocks(value))
  );
  const textareaRefs = React.useRef<Map<string, HTMLTextAreaElement>>(new Map());
  const lastFocusedTextBlockIdRef = React.useRef<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const pendingInsertIndexRef = React.useRef<number | null>(null);

  const [announcement, setAnnouncement] = React.useState("");
  const [openPickerAt, setOpenPickerAt] = React.useState<number | null>(null);
  const [dragIndex, setDragIndex] = React.useState<number | null>(null);
  const [dragOver, setDragOver] = React.useState<{
    index: number;
    position: "top" | "bottom";
  } | null>(null);

  const [lightboxOpen, setLightboxOpen] = React.useState(false);
  const [lightboxIndex, setLightboxIndex] = React.useState(0);

  // Sync when external `value` changes (e.g., draft restore, discard, or attachment deletion)
  React.useEffect(() => {
    const normalizedExternal = (value || "").replace(/\r\n/g, "\n");
    if (normalizedExternal !== lastSerializedRef.current) {
      const parsed = parseBodyToBlocks(normalizedExternal);
      lastSerializedRef.current = serializeBlocksToBody(parsed);
      setBlocks(parsed);
    }
  }, [value]);

  const commitBlocks = React.useCallback(
    (nextBlocks: ComposerBlock[], normalize = false) => {
      const finalBlocks = normalize
        ? normalizeComposerBlocks(nextBlocks)
        : nextBlocks.length > 0
          ? nextBlocks
          : [
              {
                id: createComposerBlockId("txt"),
                type: "text" as const,
                content: "",
              },
            ];
      const serialized = serializeBlocksToBody(finalBlocks);
      lastSerializedRef.current = serialized;
      setBlocks(finalBlocks);
      onChange(serialized);
    },
    [onChange]
  );

  // Placed vs unplaced image tracking for the inline picker
  const placedRefsLower = React.useMemo(() => {
    const set = new Set<string>();
    for (const b of blocks) {
      if (b.type === "image") {
        set.add(b.imageRef.trim().toLowerCase());
      }
    }
    return set;
  }, [blocks]);

  const unplacedImages = React.useMemo(
    () =>
      attachments.filter(
        (att) => !placedRefsLower.has(att.file_name.trim().toLowerCase())
      ),
    [attachments, placedRefsLower]
  );

  const lightboxImages = React.useMemo<LightboxImageItem[]>(
    () =>
      attachments
        .filter((att) => Boolean(att.previewUrl))
        .map((att) => ({
          id: att.id,
          url: att.previewUrl,
          downloadUrl: att.previewUrl,
          filename: att.file_name,
          alt: att.file_name,
        })),
    [attachments]
  );

  const openLightboxForAttachment = React.useCallback(
    (attOrRef: string) => {
      const target = resolveAttachmentForRef(attOrRef, attachments);
      if (!target) return;
      const idx = lightboxImages.findIndex((img) => img.id === target.id);
      if (idx >= 0) {
        setLightboxIndex(idx);
        setLightboxOpen(true);
      }
    },
    [attachments, lightboxImages]
  );

  const focusTextBlock = React.useCallback((blockId: string) => {
    requestAnimationFrame(() => {
      const el = textareaRefs.current.get(blockId);
      if (el) {
        el.focus();
      }
    });
  }, []);

  const insertMathSnippet = (snippet: string, cursorOffsetFromEnd: number) => {
    if (disabled) return;
    const textBlocks = blocks.filter((b) => b.type === "text");
    const target =
      textBlocks.find((b) => b.id === lastFocusedTextBlockIdRef.current) ||
      textBlocks[textBlocks.length - 1];

    if (!target || target.type !== "text") {
      const newBlock: ComposerBlock = {
        id: createComposerBlockId("txt"),
        type: "text",
        content: snippet,
      };
      commitBlocks([...blocks, newBlock]);
      focusTextBlock(newBlock.id);
      return;
    }

    const textarea = textareaRefs.current.get(target.id);
    const start = textarea?.selectionStart ?? target.content.length;
    const end = textarea?.selectionEnd ?? target.content.length;
    const nextContent =
      target.content.slice(0, start) + snippet + target.content.slice(end);

    commitBlocks(
      blocks.map((b) =>
        b.id === target.id ? { ...b, content: nextContent } : b
      )
    );

    requestAnimationFrame(() => {
      const el = textareaRefs.current.get(target.id);
      if (el) {
        el.focus();
        const pos = start + snippet.length - cursorOffsetFromEnd;
        el.setSelectionRange(pos, pos);
      }
    });
  };

  const insertParagraphAt = (insertIndex: number) => {
    if (disabled) return;
    const nextId = createComposerBlockId("txt");
    const next = [...blocks];
    next.splice(insertIndex, 0, {
      id: nextId,
      type: "text",
      content: "",
    });
    setOpenPickerAt(null);
    commitBlocks(next);
    focusTextBlock(nextId);
    setAnnouncement("Inserted new paragraph block");
  };

  const insertImageAt = (insertIndex: number, fileName: string) => {
    if (disabled) return;
    const next = [...blocks];
    next.splice(insertIndex, 0, {
      id: createComposerBlockId("img"),
      type: "image",
      imageRef: fileName,
      caption: "",
    });
    setOpenPickerAt(null);
    commitBlocks(next);
    setAnnouncement(`Inserted image ${fileName} at position ${insertIndex + 1}`);
  };

  const moveBlock = (fromIndex: number, toIndex: number) => {
    if (
      disabled ||
      toIndex < 0 ||
      toIndex >= blocks.length ||
      fromIndex === toIndex
    ) {
      return;
    }
    const next = [...blocks];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    commitBlocks(next);
    const label =
      moved.type === "image" ? `image ${moved.imageRef}` : "paragraph";
    setAnnouncement(`Moved ${label} to position ${toIndex + 1} of ${next.length}`);
  };

  const removeBlock = (index: number) => {
    if (disabled) return;
    const target = blocks[index];
    const next = blocks.filter((_, idx) => idx !== index);
    commitBlocks(next, true);
    if (target?.type === "image") {
      setAnnouncement(`Removed ${target.imageRef} from prose`);
    } else {
      setAnnouncement("Removed paragraph block");
    }
  };

  const handleTriggerUploadForSlot = (insertIndex: number) => {
    if (disabled || !onUploadImages) return;
    pendingInsertIndexRef.current = insertIndex;
    fileInputRef.current?.click();
  };

  const handleFileInputChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    e.target.value = "";
    if (files.length === 0 || !onUploadImages) return;

    const targetIndex = pendingInsertIndexRef.current ?? blocks.length;
    pendingInsertIndexRef.current = null;
    setOpenPickerAt(null);

    const uploadedRefs = await onUploadImages(files);
    if (uploadedRefs.length === 0) return;

    const next = [...blocks];
    const insertedBlocks: ComposerBlock[] = uploadedRefs.map((ref) => ({
      id: createComposerBlockId("img"),
      type: "image",
      imageRef: ref.fileName,
      caption: "",
    }));
    next.splice(targetIndex, 0, ...insertedBlocks);
    commitBlocks(next);
    setAnnouncement(
      `Inserted ${uploadedRefs.length} ${uploadedRefs.length === 1 ? "image" : "images"} into document`
    );
  };

  if (mode === "preview") {
    const hasPreview = Boolean(value.trim());
    return (
      <>
        <div
          id={id}
          className="min-h-[260px] rounded-xl border border-border/70 bg-card/40 p-5 sm:p-6"
        >
          {hasPreview ? (
            <MathRenderer
              content={value}
              attachments={attachments}
              onInlineImageClick={(ref) => openLightboxForAttachment(ref)}
              className="max-w-[68ch] text-base leading-[1.75]"
            />
          ) : (
            <p className="text-sm italic text-muted-foreground">
              {emptyPreviewText}
            </p>
          )}
        </div>
        <ImageLightbox
          images={lightboxImages}
          initialIndex={lightboxIndex}
          open={lightboxOpen}
          onOpenChange={setLightboxOpen}
        />
      </>
    );
  }

  return (
    <div
      id={id}
      aria-invalid={ariaInvalid}
      className={cn(
        "space-y-2",
        ariaInvalid && "rounded-xl ring-1 ring-destructive/60 p-1"
      )}
    >
      <div className="sr-only" aria-live="polite">
        {announcement}
      </div>

      {onUploadImages && (
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptString}
          onChange={handleFileInputChange}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
        />
      )}

      {/* Quiet Math & Insert Micro-Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            disabled={disabled}
            onClick={() => insertMathSnippet("$x$", 1)}
            className="inline-flex min-h-[36px] sm:min-h-[28px] cursor-pointer items-center gap-1 rounded-md border border-border bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/45 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Sigma className="size-3.5 text-primary" aria-hidden="true" />
            <span>Inline math</span>
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => insertMathSnippet("\n$$\n\n$$\n", 4)}
            className="inline-flex min-h-[36px] sm:min-h-[28px] cursor-pointer items-center gap-1 rounded-md border border-border bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/45 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="font-mono text-xs text-primary">$$</span>
            <span>Display block</span>
          </button>
        </div>

        {typeof maxLength === "number" && (
          <span className="text-xs text-muted-foreground">
            Drag or use arrows to reorder blocks
          </span>
        )}
      </div>

      {/* Block List */}
      <div className="space-y-1">
        {blocks.map((block, index) => {
          const isDragging = dragIndex === index;
          const isDropTop =
            dragOver?.index === index && dragOver.position === "top";
          const isDropBottom =
            dragOver?.index === index && dragOver.position === "bottom";

          return (
            <React.Fragment key={block.id}>
              <div
                draggable={!disabled}
                onDragStart={(e) => {
                  if (disabled) return;
                  setDragIndex(index);
                  e.dataTransfer.effectAllowed = "move";
                  e.dataTransfer.setData("text/plain", String(index));
                }}
                onDragOver={(e) => {
                  if (dragIndex === null || dragIndex === index) return;
                  e.preventDefault();
                  const rect = e.currentTarget.getBoundingClientRect();
                  const position =
                    e.clientY < rect.top + rect.height / 2 ? "top" : "bottom";
                  setDragOver({ index, position });
                }}
                onDragLeave={() => {
                  if (dragOver?.index === index) {
                    setDragOver(null);
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (dragIndex === null || dragOver === null) {
                    setDragIndex(null);
                    setDragOver(null);
                    return;
                  }
                  let targetIndex =
                    dragOver.position === "top"
                      ? dragOver.index
                      : dragOver.index + 1;
                  if (dragIndex < targetIndex) {
                    targetIndex -= 1;
                  }
                  moveBlock(dragIndex, targetIndex);
                  setDragIndex(null);
                  setDragOver(null);
                }}
                onDragEnd={() => {
                  setDragIndex(null);
                  setDragOver(null);
                }}
                className={cn(
                  "relative rounded-xl transition-opacity",
                  isDragging && "opacity-45",
                  isDropTop &&
                    "before:absolute before:inset-x-2 before:-top-1 before:h-0.5 before:rounded-full before:bg-primary",
                  isDropBottom &&
                    "after:absolute after:inset-x-2 after:-bottom-1 after:h-0.5 after:rounded-full after:bg-primary"
                )}
              >
                {block.type === "text" ? (
                  <ProseBlockItem
                    block={block}
                    index={index}
                    total={blocks.length}
                    disabled={disabled}
                    placeholder={
                      index === 0
                        ? placeholder
                        : "Continue writing explanation or LaTeX..."
                    }
                    registerRef={(el) => {
                      if (el) textareaRefs.current.set(block.id, el);
                      else textareaRefs.current.delete(block.id);
                    }}
                    onFocus={() => {
                      lastFocusedTextBlockIdRef.current = block.id;
                    }}
                    onBlur={onBlur}
                    onChange={(nextContent) => {
                      commitBlocks(
                        blocks.map((b) =>
                          b.id === block.id
                            ? { ...b, content: nextContent }
                            : b
                        )
                      );
                    }}
                    onMoveUp={() => moveBlock(index, index - 1)}
                    onMoveDown={() => moveBlock(index, index + 1)}
                    onRemove={() => removeBlock(index)}
                  />
                ) : (
                  <ImageBreakBlockItem
                    block={block}
                    index={index}
                    total={blocks.length}
                    disabled={disabled}
                    attachment={resolveAttachmentForRef(
                      block.imageRef,
                      attachments
                    )}
                    onCaptionChange={(nextCaption) => {
                      commitBlocks(
                        blocks.map((b) =>
                          b.id === block.id
                            ? { ...b, caption: nextCaption }
                            : b
                        )
                      );
                    }}
                    onMoveUp={() => moveBlock(index, index - 1)}
                    onMoveDown={() => moveBlock(index, index + 1)}
                    onRemove={() => removeBlock(index)}
                    onZoom={() => openLightboxForAttachment(block.imageRef)}
                  />
                )}
              </div>

              {/* Between-block insertion seam */}
              <InsertionSeam
                insertIndex={index + 1}
                disabled={disabled}
                isOpen={openPickerAt === index + 1}
                unplacedImages={unplacedImages}
                canUploadMore={canUploadMore && Boolean(onUploadImages)}
                onTogglePicker={() =>
                  setOpenPickerAt((prev) =>
                    prev === index + 1 ? null : index + 1
                  )
                }
                onInsertParagraph={() => insertParagraphAt(index + 1)}
                onInsertImage={(fileName) => insertImageAt(index + 1, fileName)}
                onUploadNew={() => handleTriggerUploadForSlot(index + 1)}
              />
            </React.Fragment>
          );
        })}
      </div>

      <ImageLightbox
        images={lightboxImages}
        initialIndex={lightboxIndex}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
      />
    </div>
  );
}

interface ProseBlockItemProps {
  block: Extract<ComposerBlock, { type: "text" }>;
  index: number;
  total: number;
  disabled: boolean;
  placeholder: string;
  registerRef: (el: HTMLTextAreaElement | null) => void;
  onFocus: () => void;
  onBlur?: () => void;
  onChange: (nextContent: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}

function ProseBlockItem({
  block,
  index,
  total,
  disabled,
  placeholder,
  registerRef,
  onFocus,
  onBlur,
  onChange,
  onMoveUp,
  onMoveDown,
  onRemove,
}: ProseBlockItemProps) {
  const localRef = React.useRef<HTMLTextAreaElement | null>(null);

  React.useLayoutEffect(() => {
    const el = localRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(el.scrollHeight, 72)}px`;
  }, [block.content]);

  return (
    <div className="group rounded-xl p-1.5 transition-colors focus-within:bg-card/55">
      {total > 1 && (
        <div className="mb-1 flex items-center justify-between gap-2 opacity-65 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <GripVertical className="size-3.5" aria-hidden="true" />
            <span>Paragraph</span>
          </span>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              disabled={disabled || index === 0}
              onClick={onMoveUp}
              aria-label={`Move paragraph ${index + 1} up`}
              className="min-h-[44px] min-w-[44px] sm:min-h-[28px] sm:min-w-[28px]"
            >
              <ArrowUp className="size-3.5" aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              disabled={disabled || index === total - 1}
              onClick={onMoveDown}
              aria-label={`Move paragraph ${index + 1} down`}
              className="min-h-[44px] min-w-[44px] sm:min-h-[28px] sm:min-w-[28px]"
            >
              <ArrowDown className="size-3.5" aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              disabled={disabled}
              onClick={onRemove}
              aria-label={`Remove paragraph ${index + 1}`}
              className="min-h-[44px] min-w-[44px] sm:min-h-[28px] sm:min-w-[28px] text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="size-3.5" aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}

      <textarea
        ref={(el) => {
          localRef.current = el;
          registerRef(el);
        }}
        rows={3}
        value={block.content}
        disabled={disabled}
        placeholder={placeholder}
        onFocus={onFocus}
        onBlur={onBlur}
        onChange={(e) => onChange(e.target.value)}
        className="w-full max-w-[72ch] resize-none overflow-hidden bg-transparent px-1 py-1 text-base leading-[1.75] text-foreground placeholder:text-muted-foreground/70 focus:outline-none scroll-mt-32"
      />
    </div>
  );
}

interface ImageBreakBlockItemProps {
  block: Extract<ComposerBlock, { type: "image" }>;
  index: number;
  total: number;
  disabled: boolean;
  attachment?: BlockEditorMediaItem;
  onCaptionChange: (nextCaption: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  onZoom: () => void;
}

function ImageBreakBlockItem({
  block,
  index,
  total,
  disabled,
  attachment,
  onCaptionChange,
  onMoveUp,
  onMoveDown,
  onRemove,
  onZoom,
}: ImageBreakBlockItemProps) {
  const hasPreview = Boolean(attachment?.previewUrl);

  return (
    <div className="my-1 overflow-hidden rounded-xl border border-border bg-card shadow-card transition-colors hover:border-primary/35">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 bg-muted/35 px-3 py-2">
        <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
          <GripVertical className="size-4 shrink-0 cursor-grab" aria-hidden="true" />
          <span className="font-semibold text-foreground">Image break</span>
          <span className="truncate font-mono text-xs">{block.imageRef}</span>
          {typeof attachment?.sizeBytes === "number" && (
            <span className="shrink-0 font-mono tabular-nums text-muted-foreground">
              · {formatBytes(attachment.sizeBytes)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            disabled={disabled || index === 0}
            onClick={onMoveUp}
            aria-label={`Move image ${block.imageRef} up`}
            className="min-h-[44px] min-w-[44px] sm:min-h-[30px] sm:min-w-[30px]"
          >
            <ArrowUp className="size-3.5" aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            disabled={disabled || index === total - 1}
            onClick={onMoveDown}
            aria-label={`Move image ${block.imageRef} down`}
            className="min-h-[44px] min-w-[44px] sm:min-h-[30px] sm:min-w-[30px]"
          >
            <ArrowDown className="size-3.5" aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            disabled={disabled}
            onClick={onRemove}
            aria-label={`Remove image ${block.imageRef} from prose`}
            className="min-h-[44px] sm:min-h-[30px] gap-1 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="size-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Remove</span>
          </Button>
        </div>
      </div>

      {hasPreview && attachment ? (
        <div className="relative flex max-h-72 items-center justify-center bg-muted/25 p-3">
          <button
            type="button"
            onClick={onZoom}
            aria-label={`Preview ${block.imageRef} full size`}
            className="group relative block max-w-full cursor-pointer rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={attachment.previewUrl}
              alt={block.caption || block.imageRef}
              className="max-h-64 rounded-lg object-contain"
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute right-2 bottom-2 inline-flex items-center gap-1 rounded-full border border-border bg-popover/90 px-2 py-1 text-xs font-medium text-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
            >
              <Expand className="size-3 text-primary" />
              <span>Zoom</span>
            </span>
          </button>
        </div>
      ) : (
        <div className="flex items-start gap-2.5 bg-warning/10 px-4 py-3 text-xs text-foreground">
          <AlertTriangle
            className="mt-0.5 size-4 shrink-0 text-warning"
            aria-hidden="true"
          />
          <p>
            Local image <span className="font-mono">{block.imageRef}</span> is
            not attached in this browser session. Re-attach a file named{" "}
            <span className="font-mono">{block.imageRef}</span> below or remove
            this block before submitting.
          </p>
        </div>
      )}

      <div className="border-t border-border/70 px-3.5 py-2">
        <input
          type="text"
          value={block.caption}
          disabled={disabled}
          onChange={(e) => onCaptionChange(e.target.value)}
          placeholder="Add an optional figure caption..."
          aria-label={`Caption for ${block.imageRef}`}
          className="w-full bg-transparent text-base sm:text-xs text-foreground placeholder:text-muted-foreground/75 focus:outline-none"
        />
      </div>
    </div>
  );
}

interface InsertionSeamProps {
  insertIndex: number;
  disabled: boolean;
  isOpen: boolean;
  unplacedImages: BlockEditorMediaItem[];
  canUploadMore: boolean;
  onTogglePicker: () => void;
  onInsertParagraph: () => void;
  onInsertImage: (fileName: string) => void;
  onUploadNew: () => void;
}

function InsertionSeam({
  disabled,
  isOpen,
  unplacedImages,
  canUploadMore,
  onTogglePicker,
  onInsertParagraph,
  onInsertImage,
  onUploadNew,
}: InsertionSeamProps) {
  const hasImageOptions = unplacedImages.length > 0 || canUploadMore;

  return (
    <div className="space-y-2 py-1">
      <div className="relative flex items-center justify-center gap-2">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-border/60"
        />
        <button
          type="button"
          disabled={disabled}
          onClick={onInsertParagraph}
          className="relative z-10 inline-flex min-h-[36px] sm:min-h-[28px] cursor-pointer items-center gap-1 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/45 hover:bg-card hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Pilcrow className="size-3" aria-hidden="true" />
          <span>+ Paragraph</span>
        </button>

        {hasImageOptions && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              if (unplacedImages.length === 0 && canUploadMore) {
                onUploadNew();
              } else {
                onTogglePicker();
              }
            }}
            aria-expanded={isOpen}
            className="relative z-10 inline-flex min-h-[36px] sm:min-h-[28px] cursor-pointer items-center gap-1 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/45 hover:bg-card hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ImagePlus className="size-3" aria-hidden="true" />
            <span>+ Image break</span>
          </button>
        )}
      </div>

      {isOpen && (
        <div className="mx-auto max-w-lg rounded-xl border border-border bg-popover p-3 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-foreground">
              Insert image break here
            </span>
            <button
              type="button"
              onClick={onTogglePicker}
              aria-label="Close image picker"
              className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
          </div>

          {unplacedImages.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {unplacedImages.map((img) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => onInsertImage(img.file_name)}
                  className="flex items-center gap-2.5 rounded-lg border border-border bg-card p-2 text-left text-xs transition-colors hover:border-primary/45 cursor-pointer"
                >
                  {img.previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={img.previewUrl}
                      alt=""
                      className="size-9 shrink-0 rounded border border-border object-cover"
                    />
                  ) : (
                    <div className="flex size-9 shrink-0 items-center justify-center rounded border border-border bg-muted">
                      <Plus className="size-3.5 text-muted-foreground" />
                    </div>
                  )}
                  <span className="min-w-0 flex-1 truncate font-mono text-foreground">
                    {img.file_name}
                  </span>
                </button>
              ))}
            </div>
          )}

          {canUploadMore && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onUploadNew}
              className="w-full gap-1.5 text-xs"
            >
              <Upload className="size-3.5 text-primary" aria-hidden="true" />
              <span>Upload new image from device…</span>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
