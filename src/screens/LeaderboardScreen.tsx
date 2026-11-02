import { useEffect, useState } from "react";
import { fetchTopSpenders, SpendingEntry, subscribeToSpending } from "../lib/leaderboardApi";
import { supabase } from "../lib/supabaseClient";
import { GoldAmount } from "../components/GoldAmount";
import { RANK_META, computeRankIndex } from "../lib/ranks";

export function LeaderboardScreen() {
  const [entries, setEntries] = useState<SpendingEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setError(null);
    fetchTopSpenders()
      .then(setEntries)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Не удалось загрузить таблицу лидеров."));
  };

  useEffect(() => {
    load();
    const channel = subscribeToSpending(load);
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <section className="leaderboard-screen">
      <div className="section-head">
        <div>
          <h1 className="page-title">Таблица лидеров</h1>
          <p className="page-subtitle">Самые большие траты игроков в золоте. Обновляется в реальном времени.</p>
        </div>
        <span className="live-badge">
          <span className="live-dot" aria-hidden="true" />
          Онлайн
        </span>
      </div>

      {error && (
        <div className="panel panel-error">
          <p>{error}</p>
          <button type="button" className="btn btn-secondary" onClick={load}>
            Попробовать снова
          </button>
        </div>
      )}

      {!error && !entries && <p className="loading-text">Загрузка таблицы лидеров...</p>}

      {entries && entries.length === 0 && (
        <div className="empty-state">
          <p>Пока никто не тратил золото. Откройте первый кейс, и вы появитесь здесь.</p>
        </div>
      )}

      {entries && entries.length > 0 && (
        <ol className="leaderboard-list">
          {entries.map((entry, index) => {
            const rankIdx = computeRankIndex(entry.xp);
            const rank = RANK_META[rankIdx];
            return (
              <li key={entry.player_id} className={`leaderboard-row ${index < 3 ? `leaderboard-top-${index + 1}` : ""}`}>
                <span className="leaderboard-rank">{index + 1}</span>
                <div className="leaderboard-player">
                  <span className="leaderboard-name">{entry.display_name}</span>
                  <span
                    className="leaderboard-rank-badge"
                    style={{ color: rank.color, borderColor: rank.color }}
                  >
                    {rank.name}
                  </span>
                </div>
                <span className="leaderboard-total">
                  <GoldAmount amount={entry.total_spent} />
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
