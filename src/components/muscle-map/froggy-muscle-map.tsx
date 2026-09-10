"use client";

import { useId, useState } from "react";
import regions from "@/lib/froggy-muscle-regions.json";
import {
  directSetColor,
  muscleLabel,
  type MuscleCoverage,
} from "@/lib/muscle-coverage";
import styles from "./muscle-map.module.css";

/** Shared artwork/interaction surface. Pass one day's aggregate for a day-only view. */
export function FroggyMuscleMap({
  coverage,
  selected = new Set<string>(),
  onToggle,
}: {
  coverage: Record<string, MuscleCoverage>;
  selected?: ReadonlySet<string>;
  onToggle?: (muscle: string) => void;
}) {
  const id = useId();
  const [hover, setHover] = useState<string | null>(null);
  return (
    <div className={styles.figures}>
      {(["front", "back"] as const).map((view) => {
        const x = view === "front" ? 40 : 1380;
        const shapes = regions[view].flatMap((region) =>
          (region.path.match(/M[^M]+/g) ?? []).map((path) => ({
            ...region,
            path,
          })),
        );
        return (
          <figure key={view}>
            <svg
              viewBox={`${x} 65 345 725`}
              aria-label={`${view === "front" ? "Front" : "Back"} muscle map`}
              role="group"
            >
              <defs>
                <clipPath id={`${id}-${view}`}>
                  <rect x={x} y={65} width={345} height={725} />
                </clipPath>
              </defs>
              <g clipPath={`url(#${id}-${view})`}>
                <image
                  href="/muscle-map/froggy-mannequin-v1.jpg"
                  width={1774}
                  height={887}
                  aria-hidden="true"
                />
                {regions[view].map((region) => {
                  const count = coverage[region.muscle]?.direct ?? 0;
                  return (
                    <path
                      key={region.muscle}
                      d={region.path}
                      className={onToggle ? styles.region : undefined}
                      data-muscle={region.muscle}
                      data-direct-sets={count}
                      role={onToggle ? "button" : undefined}
                      tabIndex={onToggle ? 0 : undefined}
                      aria-label={`${muscleLabel(region.muscle)}, ${count} planned direct sets, ${view}`}
                      aria-pressed={
                        onToggle ? selected.has(region.muscle) : undefined
                      }
                      onClick={
                        onToggle ? () => onToggle(region.muscle) : undefined
                      }
                      onKeyDown={
                        onToggle
                          ? (e) => {
                              if (e.key === " " || e.key === "Enter") {
                                e.preventDefault();
                                onToggle(region.muscle);
                              }
                            }
                          : undefined
                      }
                      onPointerEnter={(e) => {
                        if (e.pointerType === "mouse") setHover(region.muscle);
                      }}
                      onPointerLeave={() => setHover(null)}
                      onFocus={() => setHover(region.muscle)}
                      onBlur={() => setHover(null)}
                      fill={
                        count > 0
                          ? directSetColor(count)
                          : selected.has(region.muscle) ||
                              hover === region.muscle
                            ? "#008da8"
                            : "transparent"
                      }
                      fillOpacity={count > 0 ? 0.68 : 0.3}
                      style={{ mixBlendMode: "multiply" }}
                    />
                  );
                })}
                <g
                  aria-hidden="true"
                  pointerEvents="none"
                  fill="none"
                  strokeLinejoin="round"
                >
                  {shapes
                    .filter((s) => selected.has(s.muscle) || hover === s.muscle)
                    .map((s, index) => (
                      <g key={index}>
                        <path
                          d={s.path}
                          stroke="white"
                          strokeWidth={6}
                          vectorEffect="non-scaling-stroke"
                        />
                        <path
                          d={s.path}
                          stroke="#008da8"
                          strokeWidth={3}
                          vectorEffect="non-scaling-stroke"
                        />
                      </g>
                    ))}
                </g>
              </g>
            </svg>
            <figcaption>{view === "front" ? "Front" : "Back"}</figcaption>
          </figure>
        );
      })}
    </div>
  );
}
