import type { ReactNode } from 'react';
import { Reveal } from '@/components/motion/Reveal';
import { Caption } from '@/components/ui/Copy';

export function PageHeading({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <header className="wrap page-heading" data-chapter="Intro">
      <Caption>{eyebrow}</Caption>
      <h1 className="text-display-lg mt-5">{title}</h1>
      <Reveal hero as="p" className="text-lead text-mute mt-8 max-w-[42ch]">
        {description}
      </Reveal>
      {children && <div className="mt-8 flex flex-wrap gap-3">{children}</div>}
    </header>
  );
}
