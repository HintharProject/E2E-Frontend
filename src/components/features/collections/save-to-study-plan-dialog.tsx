"use client";

import { SaveButton } from "./save-button";

export function SaveToStudyPlanDialog({
  lessonId,
  variant = "secondary",
  size = "default",
  showLabel = true,
}: {
  lessonId: string;
  variant?: "default" | "secondary" | "ghost" | "outline";
  size?: "default" | "sm" | "lg" | "icon";
  showLabel?: boolean;
}) {
  return (
    <SaveButton
      entityType="lesson"
      entityId={lessonId}
      variant={variant}
      size={size}
      showLabel={showLabel}
      label="Save"
      defaultTab="plan"
    />
  );
}
