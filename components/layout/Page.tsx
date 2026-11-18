import type { ComponentProps, ReactNode } from 'react';
import { NextFooter } from '@/components/chrome/NextFooter';

/** Every page: one <main> landmark, then the giant "next" footer. */
export function Page({ children, next }: { children: ReactNode; next: ComponentProps<typeof NextFooter> }) {
  return (
    <>
      <main id="main" tabIndex={-1} className="outline-none">
        {children}
      </main>
      <NextFooter {...next} />
    </>
  );
}
