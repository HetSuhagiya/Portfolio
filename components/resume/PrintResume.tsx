'use client';
export function PrintResume() {
  return (
    <button type="button" className="btn no-print" onClick={() => window.print()}>
      Print résumé
    </button>
  );
}
