import { contourPaths, contourViewBox } from "@/lib/contour-paths";

const HIGHLIGHT_LEVEL = 4;

export function GrowthContours({ className }: { className?: string }) {
  return (
    <svg viewBox={contourViewBox} className={className} aria-hidden="true">
      {contourPaths.map((path, index) => {
        const isHighlight = path.level === HIGHLIGHT_LEVEL;
        return (
          <path
            key={index}
            d={path.d}
            fill="none"
            stroke={isHighlight ? "var(--brand-spark)" : "var(--foreground)"}
            strokeOpacity={isHighlight ? 0.55 : 0.14}
            strokeWidth={isHighlight ? 1.6 : 1.1}
            strokeLinejoin="round"
          />
        );
      })}
    </svg>
  );
}
