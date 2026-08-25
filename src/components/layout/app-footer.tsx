/**
 * App footer rendered at the bottom of the authenticated layout.
 * Matches prototype structure: border-t, centered text, muted styling.
 */
export function AppFooter() {
  return (
    <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
      E2E · Creator-led learning · Posts expire after 30 days
    </footer>
  );
}
