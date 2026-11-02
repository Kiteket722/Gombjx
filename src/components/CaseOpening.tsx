import { useEffect, useRef } from "react";
import { ItemThumb } from "./ItemThumb";

export type CasePhase = "idle" | "spinning" | "landing";
export type ReelOrientation = "horizontal" | "vertical";

const CARD_SIZE: Record<ReelOrientation, number> = { horizontal: 120, vertical: 96 };
const TRANSFORM_FN: Record<ReelOrientation, "translateX" | "translateY"> = {
  horizontal: "translateX",
  vertical: "translateY",
};
const CARD_GAP = 8;
const LOOP_CARDS = 5;
export const RIBBON_LENGTH = 50;
export const WIN_INDEX = 40;
const SPIN_SPEED_PX = 12;
const LANDING_MS = 4500;
const LANDING_EASING = "cubic-bezier(0.12, 0.8, 0.1, 1)";

export function createRibbon(keys: string[]): string[] {
  const cycle = Array.from({ length: LOOP_CARDS }, () => keys[Math.floor(Math.random() * keys.length)]);
  return Array.from({ length: RIBBON_LENGTH }, (_, index) => cycle[index % LOOP_CARDS]);
}

function trackTransform(orientation: ReelOrientation, offsetPx: number) {
  return `${TRANSFORM_FN[orientation]}(${-(CARD_SIZE[orientation] / 2 + offsetPx)}px)`;
}

type CaseOpeningProps = {
  orientation: ReelOrientation;
  ribbon: string[];
  winnerKey: string | null;
  phase: CasePhase;
  onLanded: () => void;
};

export function CaseOpening({ orientation, ribbon, winnerKey, phase, onLanded }: CaseOpeningProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const step = CARD_SIZE[orientation] + CARD_GAP;
  const loopPx = LOOP_CARDS * step;

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    if (phase === "spinning") {
      track.style.transition = "none";
      offsetRef.current = 0;
      let frame = 0;
      const tick = () => {
        offsetRef.current = (offsetRef.current + SPIN_SPEED_PX) % loopPx;
        track.style.transform = trackTransform(orientation, offsetRef.current);
        frame = requestAnimationFrame(tick);
      };
      tick();
      return () => cancelAnimationFrame(frame);
    }

    if (phase === "landing") {
      void track.offsetWidth;
      track.style.transition = `transform ${LANDING_MS}ms ${LANDING_EASING}`;
      track.style.transform = trackTransform(orientation, WIN_INDEX * step);
    }
  }, [phase, orientation, loopPx, step]);

  const cards = ribbon.map((key, index) => (index === WIN_INDEX && winnerKey ? winnerKey : key));

  return (
    <div className={`case-viewport case-viewport-${orientation}`}>
      <div className="case-indicator" aria-hidden="true" />
      <div
        ref={trackRef}
        className={`case-track case-track-${orientation}`}
        style={{ transform: trackTransform(orientation, 0) }}
        onTransitionEnd={(event) => {
          if (event.target === event.currentTarget && event.propertyName === "transform" && phase === "landing") {
            onLanded();
          }
        }}
      >
        {cards.map((key, index) => (
          <div key={index} className={`case-card case-card-${orientation}`}>
            <ItemThumb imageKey={key} name="" size="sm" />
          </div>
        ))}
      </div>
    </div>
  );
}
