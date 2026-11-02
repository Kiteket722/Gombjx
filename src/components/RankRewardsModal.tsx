import { RANK_META } from "../lib/ranks";
import { GoldAmount } from "./GoldAmount";

type RankRewardsModalProps = {
  currentIndex: number;
  onClose: () => void;
};

const TIER_NAMES = [
  "Бронза", "Бронза", "Бронза",
  "Серебро", "Серебро", "Серебро",
  "Золото", "Золото", "Золото",
  "Элит Gold", "Элит Gold", "Элит Gold",
  "Алмаз", "Алмаз", "Алмаз",
  "Платинум", "Платинум", "Платинум",
  "Титан", "Титан", "Титан",
  "Мастер", "Элита", "Абсолют",
];

export function RankRewardsModal({ currentIndex, onClose }: RankRewardsModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
        <div className="rank-rewards-header">
          <h2 className="section-title">Ранги и награды</h2>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Закрыть">✕</button>
        </div>
        <p className="hint" style={{ marginBottom: 16 }}>
          Открывайте кейсы, получайте опыт и повышайте ранг. Награда выдаётся в конце сезона.
        </p>
        <ul className="rank-rewards-list">
          {RANK_META.map((rank, index) => {
            const isCurrent = index === currentIndex;
            return (
              <li
                key={rank.name}
                className={`rank-reward-row${isCurrent ? " rank-reward-current" : ""}`}
                style={{ borderColor: isCurrent ? rank.color : undefined }}
              >
                <div className="rank-reward-info">
                  <span
                    className="rank-reward-badge"
                    style={{ color: rank.color, borderColor: rank.color }}
                  >
                    {rank.name}
                  </span>
                  <span className="rank-reward-tier">{TIER_NAMES[index]}</span>
                </div>
                <div className="rank-reward-right">
                  {rank.reward > 0 ? <GoldAmount amount={rank.reward} /> : <span className="hint">Старт</span>}
                </div>
              </li>
            );
          })}
        </ul>
        <div className="rank-rewards-footer">
          <span className="rank-rewards-footer-label">Награда в конце сезона</span>
        </div>
      </div>
    </div>
  );
}
