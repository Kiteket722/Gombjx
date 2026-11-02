import { useEffect, useState } from "react";
import { RANK_META } from "../lib/ranks";
import { GoldAmount } from "./GoldAmount";

type RankUpOverlayProps = {
  fromIndex: number;
  toIndex: number;
  reward: number;
  onClose: () => void;
};

export function RankUpOverlay({ fromIndex, toIndex, reward, onClose }: RankUpOverlayProps) {
  const [phase, setPhase] = useState<"show-old" | "descend" | "idle" | "exit">("show-old");
  const oldRank = RANK_META[fromIndex];
  const newRank = RANK_META[toIndex];

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase("descend"), 1000),
      setTimeout(() => setPhase("idle"), 2100),
      setTimeout(() => setPhase("exit"), 3800),
      setTimeout(() => onClose(), 4400),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onClose]);

  const showOld = phase === "show-old";
  const showNew = phase === "descend" || phase === "idle" || phase === "exit";
  const showInfo = phase === "idle" || phase === "exit";

  return (
    <div className={`rank-up-overlay rank-up-${phase}`} onClick={onClose}>
      <div className="rank-up-card" style={{ borderColor: newRank.color }}>
        <div className="rank-up-transition-stage">
          <div
            className={`rank-up-old-rank${showOld ? " visible" : ""}`}
            style={{ color: oldRank.color, textShadow: `0 0 20px ${oldRank.color}60` }}
          >
            {oldRank.name}
          </div>

          <div
            className={`rank-up-new-rank${showNew ? " visible" : ""}`}
            style={{ color: newRank.color, textShadow: `0 0 28px ${newRank.color}90` }}
          >
            {newRank.name}
          </div>
        </div>

        <p className={`rank-up-label${showInfo ? " visible" : ""}`}>Новый ранг!</p>

        {reward > 0 && (
          <div className={`rank-up-reward${showInfo ? " visible" : ""}`}>
            <span className="rank-up-reward-label">Награда:</span>
            <GoldAmount amount={reward} />
          </div>
        )}

        <div className="rank-up-glow" style={{ background: `radial-gradient(circle, ${newRank.color}30, transparent 70%)` }} />
      </div>
    </div>
  );
}
