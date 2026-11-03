import { useCallback, useEffect, useState } from "react";
import { clearAdminSession, getAdminSession } from "./lib/adminApi";
import { fetchState, GameState, RankUp, BannedError } from "./lib/gameApi";
import { isSoundMuted, setSoundMuted, sounds } from "./lib/sound";
import { CasesScreen } from "./screens/CasesScreen";
import { InventoryScreen } from "./screens/InventoryScreen";
import { ContractScreen } from "./screens/ContractScreen";
import { LeaderboardScreen } from "./screens/LeaderboardScreen";
import { NicknameScreen } from "./screens/NicknameScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { GoldAmount } from "./components/GoldAmount";
import { RankUpOverlay } from "./components/RankUpOverlay";
import { Menu, X } from "lucide-react";

type Tab = "cases" | "inventory" | "contract" | "leaderboard" | "profile";

const TABS: { id: Tab; label: string }[] = [
  { id: "cases", label: "Кейсы" },
  { id: "inventory", label: "Инвентарь" },
  { id: "contract", label: "Контракт" },
  { id: "leaderboard", label: "Лучшие" },
  { id: "profile", label: "Профиль" },
];

export default function App() {
  const [tab, setTab] = useState<Tab>("cases");
  const [state, setState] = useState<GameState | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [adminToken, setAdminToken] = useState<string | null>(getAdminSession);
  const [muted, setMuted] = useState<boolean>(isSoundMuted);
  const [rankUp, setRankUp] = useState<RankUp | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const [banned, setBanned] = useState(false);

  const load = () => {
    setLoadError(null);
    fetchState()
      .then(setState)
      .catch((err: unknown) => {
        if (err instanceof BannedError) {
          setBanned(true);
          return;
        }
        setLoadError(err instanceof Error ? err.message : "Не удалось загрузить игру.");
      });
  };

  useEffect(load, []);

  const handleAdminAuthLost = useCallback(() => {
    clearAdminSession();
    setAdminToken(null);
  }, []);

  const selectTab = (next: Tab) => {
    setTab(next);
    setMenuOpen(false);
    if (next === "profile") load();
  };

  const toggleMuted = () => {
    const next = !muted;
    setSoundMuted(next);
    setMuted(next);
    if (!next) sounds.click();
  };

  if (banned) {
    return (
      <div className="app">
        <div className="banned-screen">
          <div className="banned-icon" aria-hidden="true">⛔</div>
          <h1 className="banned-title">Вы заблокированы</h1>
          <p className="banned-message">
            Ваш аккаунт заблокирован администратором. Доступ к сайту закрыт.
          </p>
        </div>
      </div>
    );
  }

  if (state && !state.nickname) {
    return <NicknameScreen onSaved={setState} />;
  }

  return (
    <div className="app">
      <header className="site-header">
        <div className="container header-inner">
          <button
            type="button"
            className="menu-toggle icon-button"
            aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
          </button>
          <span className="brand pixel-brand">GGZOMBIX</span>
          <div className="header-end">
            {state && (
              <span className="gold-badge">
                <GoldAmount amount={state.gold} />
              </span>
            )}
            <button
              type="button"
              className="icon-button sound-toggle"
              aria-label={muted ? "Включить звуки" : "Выключить звуки"}
              aria-pressed={!muted}
              onClick={toggleMuted}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 5 6 9H2v6h4l5 4V5z" />
                {muted ? (
                  <path d="m22 9-6 6m0-6 6 6" />
                ) : (
                  <path d="M15.5 8.5a5 5 0 0 1 0 7m3.5-10.5a10 10 0 0 1 0 14" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <>
          <button
            type="button"
            className="menu-backdrop"
            aria-label="Закрыть меню"
            onClick={() => setMenuOpen(false)}
          />
          <aside className="side-menu" aria-label="Навигация">
            <div className="side-menu-header">
              <span className="side-menu-title">Разделы</span>
              <button type="button" className="icon-button" aria-label="Закрыть меню" onClick={() => setMenuOpen(false)}>
                <X size={20} aria-hidden="true" />
              </button>
            </div>
            <nav className="side-menu-nav">
              {TABS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`side-menu-item ${tab === item.id ? "side-menu-item-active" : ""}`}
                  aria-current={tab === item.id ? "page" : undefined}
                  onClick={() => selectTab(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </aside>
        </>
      )}

      <main className="container main">
        {loadError && (
          <div className="panel panel-error">
            <p>{loadError}</p>
            <button type="button" className="btn btn-secondary" onClick={load}>
              Попробовать снова
            </button>
          </div>
        )}
        {!loadError && !state && <p className="loading-text">Загрузка тайников...</p>}
        {state && tab === "cases" && <CasesScreen state={state} onUpdate={setState} onRankUp={setRankUp} />}
        {state && tab === "inventory" && <InventoryScreen state={state} onUpdate={setState} />}
        {state && tab === "contract" && <ContractScreen state={state} onUpdate={setState} />}
        {tab === "leaderboard" && <LeaderboardScreen />}
        {state && tab === "profile" && (
          <ProfileScreen
            state={state}
            onUpdate={setState}
            adminToken={adminToken}
            onAdminAuthLost={handleAdminAuthLost}
          />
        )}
      </main>

      {rankUp && (
        <RankUpOverlay
          fromIndex={rankUp.fromIndex}
          toIndex={rankUp.toIndex}
          reward={rankUp.reward}
          onClose={() => setRankUp(null)}
        />
      )}
    </div>
  );
}
