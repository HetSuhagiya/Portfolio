import { cn } from '@/lib/utils';

/** Chapter heading shared by the Connect / Own / Act scenes: oversized numeral, title, one short paragraph. */
export function SceneHead({
  id,
  no,
  title,
  body,
  flip = false,
}: {
  id: string;
  no: string;
  title: string;
  body: string;
  /** Mirror the composition (numeral and title on the right). */
  flip?: boolean;
}) {
  return (
    <header className="wrap grid-12 items-end gap-y-4">
      <div className={cn('col-span-12 flex items-baseline gap-[2vw] md:col-span-7', flip && 'md:order-2 md:col-start-7 md:justify-end')}>
        <span aria-hidden="true" className="text-display-lg tnum text-line-strong">
          {no}
        </span>
        <h2 id={id} className="text-display-lg">{title}</h2>
      </div>
      <p className={cn('text-lead col-span-12 max-w-[44ch] md:col-span-5', flip ? 'md:order-1 md:col-start-1' : 'md:col-start-8')}>
        {body}
      </p>
    </header>
  );
}
