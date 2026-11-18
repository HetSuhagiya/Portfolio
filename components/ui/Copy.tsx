import { Fragment, type ReactNode } from 'react';
import { site } from '@/content/site';

const EDIT = /(\[EDIT[^\]]*\])/g;

/**
 * Renders a content string. "[EDIT …]" markers become small dashed badges while
 * site.showEditMarkers is true, and disappear entirely once it is switched off.
 */
export function Copy({ children }: { children: string }): ReactNode {
  const parts = children.split(EDIT).filter((p) => p !== '');
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('[EDIT')) {
          if (!site.showEditMarkers) return null;
          return (
            <span key={i} className="edit-flag" title="Placeholder for Het to confirm, replace or delete">
              {part}
            </span>
          );
        }
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}

/** True when the whole string is only a placeholder note (so the block can be hidden when markers are off). */
export function isOnlyEdit(text: string): boolean {
  return text.replace(EDIT, '').trim() === '';
}

/** Mono caption that states what the visual next to it means. */
export function Caption({ children, className = '' }: { children: string; className?: string }) {
  return (
    <p className={`text-caption ${className}`}>
      <Copy>{children}</Copy>
    </p>
  );
}

/** The honest label carried by every interactive demo. */
export function DemoLabel({ className = '' }: { className?: string }) {
  return (
    <p className={`text-caption inline-flex items-center gap-2 ${className}`}>
      <span aria-hidden="true" className="inline-block h-1.5 w-1.5 rounded-full bg-mute" />
      {site.demoLabel}
    </p>
  );
}
