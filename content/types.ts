/**
 * Content types. Every page reads its copy from /content/*.ts.
 *
 * Convention: any string that contains "[EDIT" is a placeholder or a draft that
 * Het must confirm, replace or delete. Run `npm run content:check` to list them all.
 */

export type SignalLayout =
  | 'noise'
  | 'thread'
  | 'lattice'
  | 'merge'
  | 'grid'
  | 'bars'
  | 'dots'
  | 'caret'
  | 'tiles'
  | 'combed'
  | 'pipeline'
  | 'point'
  | 'broken';

/** A "signal state": how the persistent particle thread behaves on a route or in a scene. */
export type SignalPreset = {
  layout: SignalLayout;
  /** Hex colour of the thread. */
  color: string;
  /** 0 = thread colour, 1 = decision amber. */
  accent?: number;
  /** Curl-noise strength. 0 calm, 1 stormy. */
  turbulence?: number;
  /** Speed of the travelling wave. */
  flow?: number;
  /** Thickness of the thread / jitter around the layout. */
  spread?: number;
  /** Layout-specific parameter (tangle amount, gap size, bloom amount). 0..1 */
  param?: number;
  /** Offset in screen units (x: -aspect..aspect, y: -1..1). */
  x?: number;
  y?: number;
  scale?: number;
  /** How strongly the cursor fluid pushes particles. */
  fluid?: number;
  /** Overall brightness. */
  intensity?: number;
};

export type ModuleId =
  | 'build-the-report'
  | 'kpi-tree'
  | 'manual-vs-automated'
  | 'follow-the-data'
  | 'ten-thousand-sales'
  | 'ask-your-data'
  | 'clean-the-file';

export type GlyphId = 'layers' | 'tree' | 'clock' | 'pipeline' | 'dots' | 'prompt' | 'table';

export type DiagramNode = {
  id: string;
  label: string;
  sub?: string;
  /** Grid position. Columns flow left to right. */
  col: number;
  row: number;
  /** Marks the node where a decision is made (amber). */
  decision?: boolean;
};

export type Snippet = {
  lang: 'sql' | 'python' | 'json';
  title: string;
  caption: string;
  code: string;
  /** Notes that appear when the given 1-based line has been typed. */
  notes: { line: number; text: string }[];
};

export type Stat = {
  value: number;
  prefix?: string;
  suffix?: string;
  label: string;
};

export type CaseStudy = {
  slug: string;
  /** Two-digit index shown in lists. */
  no: string;
  /** Full title (client wordmark exactly as in the CV, or project name). */
  title: string;
  /** Short title for tight spaces. */
  short: string;
  kind: 'client' | 'built' | 'internship';
  kindLabel: string;
  /** The one-line claim, taken from the CV. */
  kicker: string;
  summary: string;
  /** Short period for index rows. */
  when: string;
  facts: { role: string; type: string; period: string; stack: string[]; /** Defaults to "Stack". */ stackLabel?: string };
  theme: 'ink' | 'paper';
  /** Page tint (hex). */
  tint: string;
  signal: SignalPreset;
  signalCaption: string;
  seo: { title: string; description: string };
  brief: { body: string; caption: string; glyph: GlyphId };
  challenge: {
    heading: string;
    body: string;
    caption: string;
    mess: {
      /** Fragments scattered in the "mess" state. */
      fragments: string[];
      /** What the fragments become once resolved (same length or shorter). */
      resolved: string[];
      chaosLabel: string;
      orderLabel: string;
    };
  };
  approach: {
    heading: string;
    intro: string;
    module: ModuleId;
    moduleTitle: string;
    /** Text alternative: what the module demonstrates. */
    alt: string;
    caption: string;
    chapters: { title: string; body: string }[];
  };
  build: {
    heading: string;
    body: string;
    diagram: { caption: string; nodes: DiagramNode[]; edges: [string, string][] };
    snippet: Snippet;
  };
  outcome: { heading: string; body: string; stats: Stat[]; edit?: string };
  learned: { body: string };
  extras?: {
    howItWorks?: { heading: string; steps: { title: string; body: string }[] };
    decisions?: { heading: string; items: string[] };
  };
};
