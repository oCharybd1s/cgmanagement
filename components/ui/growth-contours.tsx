import { contourPaths, contourViewBox } from "@/lib/contour-paths";

export function GrowthContours({ className }: { className?: string }) {
  return (
    <svg
      viewBox={contourViewBox}
      preserveAspectRatio="xMidYMid slice"
      className={className}
      aria-hidden="true"
    >
      {contourPaths.map((path, index) => (
        <path
          key={index}
          d={path.d}
          fill="none"
          stroke="var(--contour-line)"
          strokeOpacity={0.01}
          strokeWidth={1.3}
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
}
