import React from "react";
import { BookOpen, FileText, FileSpreadsheet, Layers, Archive } from "lucide-react";
import { getFileExtension } from "@/lib/resources";

interface DocTypeIconProps {
  filename: string;
  resourceType?: string;
  className?: string;
}

export function DocTypeIcon({ filename, resourceType, className = "size-4 shrink-0" }: DocTypeIconProps) {
  const ext = getFileExtension(filename);

  if (ext === ".zip") {
    return <Archive className={`${className} text-purple-500`} />;
  }
  if (resourceType === "TEXTBOOK") {
    return <BookOpen className={`${className} text-blue-500`} />;
  }
  if (ext === ".pdf") {
    return <FileText className={`${className} text-red-500`} />;
  }
  if ([".doc", ".docx", ".rtf", ".txt"].includes(ext)) {
    return <FileText className={`${className} text-blue-500`} />;
  }
  if ([".xls", ".xlsx", ".csv"].includes(ext)) {
    return <FileSpreadsheet className={`${className} text-emerald-500`} />;
  }
  if ([".ppt", ".pptx"].includes(ext)) {
    return <Layers className={`${className} text-amber-500`} />;
  }
  return <FileText className={`${className} text-primary`} />;
}
