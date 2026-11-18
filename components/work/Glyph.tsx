import type { ReactElement } from 'react';
import type { GlyphId } from '@/content/types';

const S = 'var(--tint)';
const F = 'var(--fg)';

/** Small illustrative line drawings for "The brief". Abstract by design: no client material. */
export function Glyph({ id, className }: { id: GlyphId; className?: string }) {
  let els: ReactElement;

  if (id === 'layers') {
    els = (
      <>
        {[0, 1, 2, 3].map((i) => (
          <path
            key={i}
            d={`M40 ${128 - i * 26} L120 ${148 - i * 26} L200 ${128 - i * 26} L120 ${108 - i * 26} Z`}
            fill={i === 3 ? S : 'none'}
            fillOpacity={0.18}
            stroke={i === 3 ? S : F}
            strokeOpacity={i === 3 ? 1 : 0.3 + i * 0.15}
            strokeWidth={1.25}
          />
        ))}
      </>
    );
  } else if (id === 'tree') {
    const leaves = [40, 80, 120, 160, 200];
    els = (
      <>
        <path d="M120 28 L60 80 M120 28 L120 80 M120 28 L180 80" stroke={F} strokeOpacity={0.4} fill="none" />
        <path d="M60 80 L40 132 M60 80 L80 132 M120 80 L120 132 M180 80 L160 132 M180 80 L200 132" stroke={F} strokeOpacity={0.25} fill="none" />
        <circle cx={120} cy={28} r={9} fill={S} />
        {[60, 120, 180].map((x) => (
          <circle key={x} cx={x} cy={80} r={6} fill="var(--bg)" stroke={S} strokeWidth={1.5} />
        ))}
        {leaves.map((x) => (
          <circle key={x} cx={x} cy={132} r={4} fill={F} fillOpacity={0.5} />
        ))}
      </>
    );
  } else if (id === 'clock') {
    els = (
      <>
        <circle cx={120} cy={80} r={56} fill="none" stroke={F} strokeOpacity={0.35} />
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => (
          <line key={i} x1={120} y1={30} x2={120} y2={i % 3 === 0 ? 40 : 35} stroke={F} strokeOpacity={0.6} transform={`rotate(${i * 30} 120 80)`} />
        ))}
        <line x1={120} y1={80} x2={120} y2={44} stroke={S} strokeWidth={2} />
        <line x1={120} y1={80} x2={148} y2={92} stroke={F} strokeWidth={1.5} />
        <circle cx={120} cy={80} r={3.5} fill={S} />
      </>
    );
  } else if (id === 'pipeline') {
    els = (
      <>
        {[40, 68, 96, 124].map((y) => (
          <path key={y} d={`M24 ${y} C 60 ${y}, 60 80, 92 80`} fill="none" stroke={F} strokeOpacity={0.35} />
        ))}
        <line x1={92} y1={80} x2={216} y2={80} stroke={S} strokeWidth={1.5} />
        {[40, 68, 96, 124].map((y) => (
          <circle key={y} cx={24} cy={y} r={4} fill={F} fillOpacity={0.6} />
        ))}
        {[92, 154].map((x) => (
          <circle key={x} cx={x} cy={80} r={9} fill="var(--bg)" stroke={S} strokeWidth={1.5} />
        ))}
        <circle cx={216} cy={80} r={9} fill="var(--decide)" />
      </>
    );
  } else if (id === 'dots') {
    const dots: ReactElement[] = [];
    for (let j = 0; j < 7; j++) {
      for (let i = 0; i < 12; i++) {
        const on = (i * 7 + j * 13) % 5 < 2;
        dots.push(<circle key={`${i}-${j}`} cx={32 + i * 16} cy={32 + j * 16} r={3} fill={on ? S : F} fillOpacity={on ? 0.95 : 0.22} />);
      }
    }
    els = <>{dots}</>;
  } else if (id === 'prompt') {
    els = (
      <>
        <rect x={24} y={24} width={192} height={34} rx={17} fill="none" stroke={S} strokeWidth={1.25} />
        <path d="M40 36 L47 41 L40 46" fill="none" stroke={S} strokeWidth={1.5} />
        <line x1={56} y1={41} x2={132} y2={41} stroke={F} strokeOpacity={0.5} strokeDasharray="2 4" />
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <rect x={24 + i * 66} y={76} width={60} height={60} rx={6} fill="none" stroke={F} strokeOpacity={0.35} />
            {[0, 1, 2, 3].map((b) => (
              <rect key={b} x={32 + i * 66 + b * 12} y={126 - (10 + ((i + 2) * (b + 3) * 7) % 30)} width={7} height={10 + ((i + 2) * (b + 3) * 7) % 30} fill={S} fillOpacity={0.8} />
            ))}
          </g>
        ))}
      </>
    );
  } else {
    // table
    const cells: ReactElement[] = [];
    for (let j = 0; j < 5; j++) {
      for (let i = 0; i < 4; i++) {
        const flag = (i === 1 && j === 2) || (i === 3 && j === 1) || (i === 2 && j === 4);
        cells.push(
          <rect key={`${i}-${j}`} x={28 + i * 47} y={26 + j * 23} width={43} height={19} fill={flag ? 'var(--bad)' : j === 0 ? S : F} fillOpacity={flag ? 0.75 : j === 0 ? 0.5 : 0.1} />,
        );
      }
    }
    els = <>{cells}</>;
  }

  return (
    <svg viewBox="0 0 240 160" className={className} aria-hidden="true" focusable="false" fill="none">
      {els}
    </svg>
  );
}
