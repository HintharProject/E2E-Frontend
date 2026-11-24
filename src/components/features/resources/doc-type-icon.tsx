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
    return <Archive className={`${className} text-tier-4`} aria-hidden="true" />;
  }
  if (resourceType === "TEXTBOOK") {
    return <BookOpen className={`${className} text-chart-3`} aria-hidden="true" />;
  }
  if (ext === ".pdf") {
    return <FileText className={`${className} text-destructive`} aria-hidden="true" />;
  }
  if ([".doc", ".docx", ".rtf", ".txt"].includes(ext)) {
    return <FileText className={`${className} text-chart-3`} aria-hidden="true" />;
  }
  if ([".xls", ".xlsx", ".csv"].includes(ext)) {
    return <FileSpreadsheet className={`${className} text-primary`} aria-hidden="true" />;
  }
  if ([".ppt", ".pptx"].includes(ext)) {
    return <Layers className={`${className} text-warning`} aria-hidden="true" />;
  }
  return <FileText className={`${className} text-primary`} aria-hidden="true" />;
}
