"use client";

import { useEffect } from "react";

interface UseFeedKeyboardNavigationOptions {
  containerRef: React.RefObject<HTMLElement | null>;
  enabled?: boolean;
}

function isEditableOrOverlayTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT" ||
    target.isContentEditable
  ) {
    return true;
  }
  return Boolean(
    target.closest(
      '[role="dialog"], [role="menu"], [role="listbox"], [data-slot="dialog-content"], [data-slot="popover-content"]'
    )
  );
}

/**
 * Enables power-user feed navigation with `j` (next card), `k` (previous card),
 * `Enter` (open active card), and `Escape` (clear selection).
 */
export function useFeedKeyboardNavigation({
  containerRef,
  enabled = true,
}: UseFeedKeyboardNavigationOptions) {
  useEffect(() => {
    if (!enabled) return;

    const getCards = (): HTMLElement[] => {
      const container = containerRef.current;
      if (!container) return [];
      return Array.from(
        container.querySelectorAll<HTMLElement>('[data-slot="base-feed-card"]')
      );
    };

    const clearSelection = (cards: HTMLElement[]) => {
      for (const card of cards) {
        delete card.dataset.keyboardActive;
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) {
        return;
      }
      if (
        isEditableOrOverlayTarget(e.target) ||
        isEditableOrOverlayTarget(document.activeElement)
      ) {
        return;
      }
      if (document.querySelector('[role="dialog"]')) {
        return;
      }

      const cards = getCards();
      if (cards.length === 0) return;

      if (e.key === "j" || e.key === "k") {
        const activeIdx = cards.findIndex(
          (card) =>
            card.dataset.keyboardActive === "true" ||
            (document.activeElement instanceof Node &&
              card.contains(document.activeElement))
        );

        const nextIdx =
          e.key === "j"
            ? activeIdx < 0
              ? 0
              : Math.min(activeIdx + 1, cards.length - 1)
            : activeIdx < 0
              ? 0
              : Math.max(activeIdx - 1, 0);

        clearSelection(cards);
        const nextCard = cards[nextIdx];
        nextCard.dataset.keyboardActive = "true";

        const reducedMotion = window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches;
        nextCard.scrollIntoView({
          block: "nearest",
          behavior: reducedMotion ? "auto" : "smooth",
        });

        const primaryLink = nextCard.querySelector<HTMLAnchorElement>(
          'a[data-feed-primary-link="true"]'
        );
        primaryLink?.focus({ preventScroll: true });
        return;
      }

      if (e.key === "Enter") {
        const activeCard = cards.find(
          (card) => card.dataset.keyboardActive === "true"
        );
        if (!activeCard) return;

        const primaryLink = activeCard.querySelector<HTMLAnchorElement>(
          'a[data-feed-primary-link="true"]'
        );
        if (!primaryLink) return;

        // If primaryLink itself has focus, let the browser handle native Enter navigation.
        if (document.activeElement === primaryLink) return;

        // Do not hijack Enter when focused on another interactive child control.
        if (
          document.activeElement instanceof HTMLElement &&
          document.activeElement.closest(
            'a, button, input, select, textarea, [role="button"]'
          )
        ) {
          return;
        }

        e.preventDefault();
        primaryLink.click();
        return;
      }

      if (e.key === "Escape") {
        clearSelection(cards);
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      const cards = getCards();
      if (cards.length === 0) return;
      if (
        !(e.target instanceof Node) ||
        !containerRef.current?.contains(e.target)
      ) {
        clearSelection(cards);
      } else {
        clearSelection(cards);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("pointerdown", handlePointerDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [containerRef, enabled]);
}

