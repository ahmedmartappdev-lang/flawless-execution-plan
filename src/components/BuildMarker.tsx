import React from 'react';

/**
 * Diagnostic-only marker pinned to the bottom-right of every page.
 * Renders the build's git SHA so screenshots from clients can be matched
 * to a deployed bundle. Deliberately subtle: gray 9px text, no border,
 * no background, no interaction. If the client sees blank screens we
 * can ask for a screenshot and confirm which build they're on without
 * any guessing.
 */
export const BuildMarker: React.FC = () => {
  const sha = (typeof __BUILD_SHA__ !== 'undefined' ? __BUILD_SHA__ : 'dev') as string;
  const built = (typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : '') as string;
  // Show only date part of ISO timestamp (YYYY-MM-DD) to keep it tiny.
  const datePart = built ? built.slice(0, 10) : '';

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        bottom: 2,
        right: 4,
        fontSize: 9,
        lineHeight: 1,
        color: 'rgba(0,0,0,0.35)',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        pointerEvents: 'none',
        zIndex: 1,
        userSelect: 'none',
      }}
    >
      build {sha}{datePart ? ` · ${datePart}` : ''}
    </div>
  );
};
