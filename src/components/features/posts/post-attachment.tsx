"use client";

import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription, DialogHeader } from "@/components/ui/dialog";
import { Download, File as FileIcon, Image as ImageIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Image from "next/image";

function getFileInfo(url: string) {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const filename = pathname.split('/').pop() || 'attachment';
    const extension = filename.split('.').pop()?.toLowerCase() || '';
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension);
    return { filename, isImage };
  } catch (e) {
    return { filename: 'attachment', isImage: false };
  }
}

export function PostAttachment({ url, downloadUrl, filename: overrideFilename }: { url: string; downloadUrl?: string; filename?: string }) {
  const { filename: extractedFilename, isImage } = getFileInfo(url);
  const filename = overrideFilename || extractedFilename;

  if (isImage) {
    return (
      <div className="mt-4 flex justify-center w-full max-w-2xl mx-auto">
        <Dialog>
          <DialogTrigger 
            render={
              <button type="button" className="relative overflow-hidden w-full aspect-video rounded-xl border border-line bg-surface transition-transform hover:scale-[1.02] flex items-center justify-center cursor-zoom-in group" />
            }
          >
            <Image
              src={url}
              alt={filename}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 800px"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity z-10">
              <ImageIcon className="text-white w-8 h-8 opacity-80" />
            </div>
          </DialogTrigger>
          <DialogContent 
            className="max-w-[90vw] w-fit p-0 overflow-hidden bg-transparent border-none shadow-none flex flex-col items-center justify-center"
            showCloseButton={false}
          >
            <DialogHeader className="sr-only">
              <DialogTitle>Image Preview</DialogTitle>
              <DialogDescription>Full size image preview of {filename}</DialogDescription>
            </DialogHeader>
            <div className="relative group flex w-[90vw] h-[90vh] items-center justify-center">
              <Image 
                src={url} 
                alt="Attachment full size" 
                fill
                className="object-contain rounded-md shadow-2xl" 
                sizes="90vw"
              />
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-50">
                <a 
                  href={downloadUrl || url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  download 
                  className={cn(buttonVariants({ size: "icon", variant: "secondary" }), "rounded-full shadow-lg h-10 w-10")}
                >
                  <Download className="w-5 h-5" />
                </a>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="mt-4 inline-block w-full sm:w-auto">
      <a 
        href={downloadUrl || url} 
        target="_blank" 
        rel="noopener noreferrer"
        download
        className="inline-flex items-center gap-4 px-5 py-3.5 rounded-xl border border-line bg-surface hover:bg-surface-raised transition-colors shadow-sm w-full group text-left"
      >
        <div className="p-2.5 bg-brand/10 text-brand rounded-lg shrink-0">
          <FileIcon className="w-6 h-6" />
        </div>
        <div className="flex flex-col flex-1 min-w-0 pr-2">
          <span className="text-sm font-semibold text-ink truncate block">{filename}</span>
          <span className="text-xs text-ink-muted mt-0.5 font-medium">Click to view or download</span>
        </div>
        <div className="pl-2 border-l border-line flex items-center justify-center">
          <Download className="w-5 h-5 text-ink-muted group-hover:text-ink transition-colors ml-2" />
        </div>
      </a>
    </div>
  );
}
