import { CSSProperties, useMemo } from "react";

const BACKDROP_IMAGE =
  "https://images.pexels.com/photos/773594/pexels-photo-773594.jpeg?auto=compress&cs=tinysrgb&h=650&w=940";
const FLAKE_COUNT = 70;
const DRIFT_ROWS = 4;
const DRIFT_HEIGHTS = Array.from({ length: 64 }, (_, index) =>
  Math.min(DRIFT_ROWS, Math.max(1, Math.round(2 + 1.5 * Math.sin(index / 4) + 0.8 * Math.sin(index / 1.7)))),
);

function createFlakes(count: number) {
  return Array.from({ length: count }, () => {
    const size = 2 + Math.floor(Math.random() * 4);
    return {
      left: Math.random() * 100,
      size,
      opacity: 0.45 + Math.random() * 0.5,
      duration: 9 + Math.random() * 13,
      delay: -Math.random() * 22,
      drift: Math.round((Math.random() - 0.5) * 120),
    };
  });
}

export function WinterBackdrop() {
  const flakes = useMemo(() => createFlakes(FLAKE_COUNT), []);

  return (
    <div aria-hidden="true">
      <div className="winter-backdrop">
        <div className="winter-photo" style={{ backgroundImage: `url(${BACKDROP_IMAGE})` }} />
        <div className="winter-tint" />
        <div className="winter-pixel-grid" />
        <svg
          className="winter-drift"
          viewBox={`0 0 ${DRIFT_HEIGHTS.length} ${DRIFT_ROWS}`}
          preserveAspectRatio="none"
          shapeRendering="crispEdges"
        >
          {DRIFT_HEIGHTS.map((height, x) => (
            <rect key={x} x={x} y={DRIFT_ROWS - height} width={1} height={height} />
          ))}
        </svg>
      </div>
      <div className="snowfall">
        {flakes.map((flake, index) => (
          <span
            key={index}
            className="snowflake"
            style={
              {
                left: `${flake.left}%`,
                width: flake.size,
                height: flake.size,
                opacity: flake.opacity,
                animationDuration: `${flake.duration}s`,
                animationDelay: `${flake.delay}s`,
                "--drift": `${flake.drift}px`,
              } as CSSProperties
            }
          />
        ))}
      </div>
    </div>
  );
}
