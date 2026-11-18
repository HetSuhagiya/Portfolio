import type { ReactElement } from 'react';
import { prng } from '@/lib/utils';
import { POSTER_VARIANTS } from '@/lib/posters';

const INK = '#07080B';
const PAPER = '#EDEAE3';
const W = 400;
const H = 500;
/** Round to 2 decimals: trig results differ in the last digits between Node and browsers (hydration). */
const q = (v: number): number => Math.round(v * 100) / 100;

/**
 * Static SVG version of each generative poster: basic shapes only.
 * It is the server-rendered fallback under the WebGL poster (touch devices, no WebGL, first paint)
 * and it is also what the Open Graph images are built from.
 */
export function PosterArt({
  slug,
  tint,
  className,
  title,
}: {
  slug: string;
  tint: string;
  className?: string;
  title?: string;
}) {
  const v = POSTER_VARIANTS[slug] ?? 0;
  const r = prng(1000 + v * 97);
  const els: ReactElement[] = [];
  let bg = INK;

  if (v === 0) {
    // lattice
    for (let i = 0; i <= 8; i++) {
      const x = (i / 8) * W;
      els.push(<line key={`v${i}`} x1={x} y1={0} x2={x + 40} y2={H} stroke={tint} strokeOpacity={0.4} strokeWidth={1} />);
    }
    for (let j = 0; j <= 10; j++) {
      const y = (j / 10) * H;
      els.push(<line key={`h${j}`} x1={0} y1={y} x2={W} y2={y + 12} stroke={tint} strokeOpacity={0.4} strokeWidth={1} />);
    }
    for (let k = 0; k < 14; k++) {
      const i = Math.floor(r() * 8) + 0.5;
      const j = Math.floor(r() * 10) + 0.5;
      els.push(<circle key={`n${k}`} cx={(i / 8) * W + j * 4} cy={(j / 10) * H + i * 1.5} r={3 + r() * 3} fill={tint} fillOpacity={0.9} />);
    }
  } else if (v === 1) {
    // weave
    for (let i = 0; i < 44; i++) {
      const x = (i / 44) * W + 4;
      els.push(
        <line key={i} x1={x} y1={0} x2={q(x + Math.sin(i * 0.4) * 10)} y2={H} stroke={tint} strokeOpacity={0.12 + 0.5 * r()} strokeWidth={3} />,
      );
    }
    els.push(<path key="t" d={`M0 ${H * 0.52} C ${W * 0.3} ${H * 0.42}, ${W * 0.6} ${H * 0.64}, ${W} ${H * 0.5}`} stroke="#FFEBD6" strokeWidth={2} fill="none" />);
  } else if (v === 2) {
    // dial
    bg = PAPER;
    const cx = W / 2;
    const cy = H / 2;
    for (let i = 1; i <= 6; i++) els.push(<circle key={`c${i}`} cx={cx} cy={cy} r={i * 26} stroke={tint} strokeOpacity={0.35} strokeWidth={1} fill="none" />);
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * Math.PI * 2;
      const r1 = i % 5 === 0 ? 150 : 162;
      els.push(
        <line key={`t${i}`} x1={q(cx + Math.cos(a) * r1)} y1={q(cy + Math.sin(a) * r1)} x2={q(cx + Math.cos(a) * 172)} y2={q(cy + Math.sin(a) * 172)} stroke={tint} strokeWidth={i % 5 === 0 ? 2.5 : 1} />,
      );
    }
    els.push(<line key="h1" x1={cx} y1={cy} x2={cx + 70} y2={cy - 70} stroke={tint} strokeWidth={4} />);
    els.push(<line key="h2" x1={cx} y1={cy} x2={cx - 40} y2={cy - 140} stroke="#B85C00" strokeWidth={2} />);
    els.push(<circle key="hub" cx={cx} cy={cy} r={6} fill={tint} />);
  } else if (v === 3) {
    // pipeline
    for (let i = 0; i < 9; i++) {
      const y0 = (i / 8) * H * 0.8 + H * 0.1;
      const ym = H / 2 + (i - 4) * 9;
      els.push(
        <path key={i} d={`M0 ${y0} C ${W * 0.3} ${y0}, ${W * 0.3} ${ym}, ${W * 0.5} ${ym} S ${W * 0.7} ${y0}, ${W} ${y0}`} stroke={tint} strokeOpacity={0.3 + 0.5 * r()} strokeWidth={1.5} fill="none" />,
      );
    }
    [0.18, 0.5, 0.82].forEach((x, i) => {
      els.push(<circle key={`n${i}`} cx={W * x} cy={H / 2} r={26} fill={INK} stroke={i === 2 ? '#FFB547' : tint} strokeWidth={2} />);
      els.push(<circle key={`d${i}`} cx={W * x} cy={H / 2} r={7} fill={i === 2 ? '#FFB547' : tint} />);
    });
  } else if (v === 4) {
    // dots
    for (let j = 0; j < 12; j++) {
      for (let i = 0; i < 10; i++) {
        const f = 0.5 + 0.5 * Math.sin(i * 0.7 + j * 0.45);
        const hot = r() > 0.97;
        els.push(
          <circle key={`${i}-${j}`} cx={20 + i * 40} cy={24 + j * 41} r={q(3 + f * 11)} fill={hot ? '#FFB547' : tint} fillOpacity={hot ? 1 : q(0.25 + f * 0.7)} />,
        );
      }
    }
  } else if (v === 5) {
    // tiles
    for (let j = 0; j < 3; j++) {
      for (let i = 0; i < 3; i++) {
        const x = 16 + i * 126;
        const y = 22 + j * 156;
        els.push(<rect key={`r${i}${j}`} x={x} y={y} width={116} height={144} fill="none" stroke={tint} strokeOpacity={0.5} strokeWidth={1} />);
        if ((i + j) % 2 === 0) {
          for (let b = 0; b < 5; b++) {
            const h = 20 + r() * 90;
            els.push(<rect key={`b${i}${j}${b}`} x={x + 12 + b * 19} y={y + 132 - h} width={12} height={h} fill={tint} fillOpacity={0.85} />);
          }
        } else {
          const pts = Array.from({ length: 7 }, (_, k) => `${x + 8 + k * 16.6},${y + 100 - r() * 70}`).join(' ');
          els.push(<polyline key={`l${i}${j}`} points={pts} fill="none" stroke={tint} strokeWidth={2} />);
        }
      }
    }
  } else {
    // combed
    for (let i = 0; i < 16; i++) {
      const y = 20 + i * 30.5;
      const a = (r() - 0.5) * 160;
      const b = (r() - 0.5) * 160;
      els.push(
        <path key={i} d={`M0 ${y + a} C ${W * 0.2} ${y + b}, ${W * 0.35} ${y - a * 0.6}, ${W * 0.55} ${y} L ${W} ${y}`} stroke={tint} strokeOpacity={0.35 + r() * 0.6} strokeWidth={1.5} fill="none" />,
      );
    }
    els.push(<line key="comb" x1={W * 0.55} y1={0} x2={W * 0.55} y2={H} stroke="#FFFFFF" strokeOpacity={0.6} strokeWidth={1} />);
  }

  return (
    <svg
      className={className}
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid slice"
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      <rect x={0} y={0} width={W} height={H} fill={bg} />
      {els}
    </svg>
  );
}
