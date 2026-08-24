import React, { useCallback, useState } from "react";
import { UploadCloud, X } from "lucide-react";
import { Button } from "./button";

interface FileDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
  acceptedTypes?: string[];
  error?: string;
}

export function FileDropzone({
  onFilesSelected,
  maxFiles = 1,
  maxSizeMB = 5,
  acceptedTypes,
  error,
}: FileDropzoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [localError, setLocalError] = useState<string>("");

  const validateFiles = (newFiles: File[]) => {
    let err = "";
    const totalFiles = [...files, ...newFiles];

    if (totalFiles.length > maxFiles) {
      err = `Maximum ${maxFiles} files allowed.`;
      return false;
    }

    let totalSize = 0;
    for (const file of totalFiles) {
      totalSize += file.size;
      
      if (acceptedTypes && acceptedTypes.length > 0) {
        const fileExt = "." + file.name.split('.').pop()?.toLowerCase();
        const isValidType = acceptedTypes.includes(file.type) || acceptedTypes.some(type => fileExt === type.toLowerCase() || type.includes(fileExt));
        if (!isValidType) {
          err = `Invalid file type. Accepted: ${acceptedTypes.join(", ")}`;
        }
      }
    }

    if (totalSize > maxSizeMB * 1024 * 1024) {
      err = `Total file size must not exceed ${maxSizeMB}MB.`;
    }

    if (err) {
      setLocalError(err);
      return false;
    }

    setLocalError("");
    return true;
  };

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragActive(false);
      
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const droppedFiles = Array.from(e.dataTransfer.files);
        if (validateFiles(droppedFiles)) {
          const newFilesList = [...files, ...droppedFiles];
          setFiles(newFilesList);
          onFilesSelected(newFilesList);
        }
      }
    },
    [files, maxFiles, maxSizeMB, acceptedTypes, onFilesSelected]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      if (validateFiles(selectedFiles)) {
        const newFilesList = [...files, ...selectedFiles];
        setFiles(newFilesList);
        onFilesSelected(newFilesList);
      }
      e.target.value = ""; // Reset input
    }
  };

  const removeFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
    onFilesSelected(newFiles);
    setLocalError("");
  };

  const getFilePreview = (file: File) => {
    if (file.type.startsWith("image/")) {
      return URL.createObjectURL(file);
    }
    return null;
  };

  return (
    <div className="w-full">
      <div
        className={`relative flex flex-col items-center justify-center w-full min-h-32 rounded-lg border-2 border-dashed transition-colors p-6 ${
          isDragActive ? "border-brand bg-brand/5" : "border-line bg-card hover:border-brand/50"
        } ${error || localError ? "border-danger bg-danger/5" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragActive(true);
        }}
        onDragLeave={() => setIsDragActive(false)}
        onDrop={handleDrop}
      >
        <UploadCloud className="w-8 h-8 text-ink-muted mb-2" />
        <p className="mb-2 text-sm text-ink-muted text-center">
          <span className="font-semibold text-ink">Click to upload</span> or drag and drop
        </p>
        <p className="text-xs text-ink-muted text-center">
          {acceptedTypes?.join(", ")} (Max. {maxSizeMB}MB {maxFiles > 1 ? "total" : ""})
        </p>
        
        <input
          type="file"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          multiple={maxFiles > 1}
          accept={acceptedTypes?.join(",")}
          onChange={handleFileInput}
          title=""
        />
      </div>

      {(error || localError) && (
        <p className="mt-2 text-xs text-danger">{error || localError}</p>
      )}

      {files.length > 0 && (
        <ul className="mt-4 flex flex-col gap-2">
          {files.map((file, i) => {
            const previewUrl = getFilePreview(file);
            return (
              <li key={i} className="flex items-center justify-between p-2 text-sm border border-line rounded-md bg-secondary">
                <div className="flex items-center gap-3 overflow-hidden">
                  {previewUrl ? (
                    <img src={previewUrl} alt={file.name} className="h-10 w-10 object-cover rounded border border-line shrink-0" />
                  ) : (
                    <div className="h-10 w-10 bg-muted rounded border border-line flex items-center justify-center shrink-0">
                      <span className="text-[10px] uppercase font-bold text-ink-muted">{file.name.split('.').pop()}</span>
                    </div>
                  )}
                  <span className="truncate flex-1 min-w-0 font-medium">{file.name}</span>
                </div>
                <Button type="button" variant="ghost" size="xs" onClick={() => removeFile(i)} className="shrink-0 text-ink-muted hover:text-danger">
                  <X className="w-4 h-4" />
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
