import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription, DialogHeader } from "@/components/ui/dialog";
import { Download, File as FileIcon, Image as ImageIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

export function PostAttachment({ url }: { url: string }) {
  const { filename, isImage } = getFileInfo(url);

  if (isImage) {
    return (
      <div className="mt-4 flex justify-center">
        <Dialog>
          <DialogTrigger 
            render={
              <button className="relative overflow-hidden rounded-xl border border-line bg-surface transition-transform hover:scale-[1.02] max-h-72 flex items-center justify-center cursor-zoom-in group" />
            }
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={filename} className="object-contain max-h-72" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
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
            <div className="relative group flex flex-col items-center justify-center w-full h-full max-h-[90vh]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="Attachment full size" className="max-h-[90vh] w-auto object-contain rounded-md shadow-2xl" />
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <a 
                  href={url} 
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
        href={url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="inline-flex items-center gap-4 px-5 py-3.5 rounded-xl border border-line bg-surface hover:bg-surface-raised transition-colors shadow-sm w-full group"
      >
        <div className="p-2.5 bg-brand/10 text-brand rounded-lg shrink-0">
          <FileIcon className="w-6 h-6" />
        </div>
        <div className="flex flex-col flex-1 min-w-0 pr-2">
          <span className="text-sm font-semibold text-ink truncate block">{filename}</span>
          <span className="text-xs text-ink-muted mt-0.5 font-medium">Click to view or download</span>
        </div>
        <div className="pl-2 border-l border-line">
          <Download className="w-5 h-5 text-ink-muted group-hover:text-ink transition-colors ml-2" />
        </div>
      </a>
    </div>
  );
}
