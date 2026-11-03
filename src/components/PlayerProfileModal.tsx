import { useEffect, useState } from "react";
import { SpendingEntry } from "../lib/leaderboardApi";
import { fetchPlayerStats, PlayerStats } from "../lib/playerProfileApi";
import { computeRankIndex, RANK_META, RANK_THRESHOLDS } from "../lib/ranks";
import { RARITY_INFO } from "../lib/rarity";
import { GoldAmount } from "./GoldAmount";
import { ItemThumb } from "./ItemThumb";

type PlayerProfileModalProps = {
  entry: SpendingEntry;
  onClose: () => void;
};

export function PlayerProfileModal({ entry, onClose }: PlayerProfileModalProps) {
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const rankIndex = computeRankIndex(entry.xp);
  const rank = RANK_META[rankIndex];
  const isMaxRank = rankIndex === RANK_META.length - 1;
  const currentThreshold = RANK_THRESHOLDS[rankIndex];
  const nextThreshold = RANK_THRESHOLDS[rankIndex + 1];
  const progressPct = isMaxRank ? 100 : ((entry.xp - currentThreshold) / (nextThreshold - currentThreshold)) * 100;

  const load = () => {
    setLoading(true);
    setError(null);
    fetchPlayerStats(entry.player_id)
      .then(setStats)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Не удалось загрузить профиль игрока."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [entry.player_id]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="player-profile-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="profile-modal-head">
          <h2 id="player-profile-title" className="section-title">{entry.display_name}</h2>
          <span className="leaderboard-rank-badge" style={{ color: rank.color, borderColor: rank.color }}>
            {rank.name}
          </span>
        </div>
        <div className="profile-xp">
          <div className="rank-progress-bar">
            <div className="rank-progress-fill" style={{ width: `${progressPct}%`, background: rank.gradient }} />
          </div>
          <span className="rank-xp-text">
            {isMaxRank ? `${entry.xp} XP` : `${entry.xp} / ${nextThreshold} XP`}
          </span>
        </div>

        {loading && <p className="loading-text">Загрузка профиля...</p>}

        {error && (
          <div className="panel panel-error">
            <p>{error}</p>
            <button type="button" className="btn btn-secondary" onClick={load}>
              Попробовать снова
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="profile-stats-grid">
              <div className="profile-stat">
                <span className="stat-label">Потрачено голды</span>
                <GoldAmount amount={entry.total_spent} />
              </div>
              <div className="profile-stat">
                <span className="stat-label">Пополнено голды</span>
                <GoldAmount amount={stats?.total_deposited ?? 0} />
              </div>
            </div>

            <div className="profile-best-drop">
              <span className="stat-label">Самый дорогой дроп</span>
              {stats?.best_drop_name && stats.best_drop_value !== null ? (
                <div className="profile-best-drop-body">
                  <ItemThumb
                    imageKey={stats.best_drop_image_key}
                    name={stats.best_drop_name}
                    rarity={stats.best_drop_rarity ?? undefined}
                    size="md"
                  />
                  <div className="profile-best-drop-info">
                    <span className="item-name">{stats.best_drop_name}</span>
                    {stats.best_drop_rarity && (
                      <span className="rarity-label" style={{ color: RARITY_INFO[stats.best_drop_rarity].color }}>
                        {RARITY_INFO[stats.best_drop_rarity].label}
                      </span>
                    )}
                    <GoldAmount amount={stats.best_drop_value} />
                  </div>
                </div>
              ) : (
                <p className="hint">Пока ничего не выпадало.</p>
              )}
            </div>
          </>
        )}

        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
