"use client";

import { SaveButton } from "./save-button";

export function SaveToSessionDialog({
  postId,
  lessonId,
  problemId,
  solutionId,
  resourceId,
}: {
  postId?: string;
  lessonId?: string;
  problemId?: string;
  solutionId?: string;
  resourceId?: string;
}) {
  const entityType = postId
    ? "post"
    : problemId
    ? "problem"
    : solutionId
    ? "solution"
    : resourceId
    ? "resource"
    : "lesson";

  const entityId =
    postId || problemId || solutionId || resourceId || lessonId || "";

  return (
    <SaveButton
      entityType={entityType}
      entityId={entityId}
      variant="secondary"
      size="sm"
      showLabel
      label="Save to session"
    />
  );
}

