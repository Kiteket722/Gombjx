import { useEffect, useState } from "react";
import { CASE_COVER } from "../lib/items";
import { CaseView, GameState, openFreeCase, RankUp } from "../lib/gameApi";
import { CaseOpening, CasePhase, createRibbon } from "./CaseOpening";
import { ItemThumb } from "./ItemThumb";
import { GoldAmount } from "./GoldAmount";
import { RARITY_INFO } from "../lib/rarity";
import { sounds } from "../lib/sound";

const COOLDOWN_MS = 24 * 60 * 60 * 1000;

type FreeCaseCardProps = {
  freeCase: CaseView;
  lastFreeCaseAt: string | null;
  serverTime: string;
  onUpdate: (state: GameState) => void;
  onRankUp: (rankUp: RankUp) => void;
};

function formatRemaining(ms: number): string {
  if (ms <= 0) return "Доступно!";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${h}ч ${m}м ${s}с`;
}

export function FreeCaseCard({ freeCase, lastFreeCaseAt, serverTime, onUpdate, onRankUp }: FreeCaseCardProps) {
  const [phase, setPhase] = useState<CasePhase>("idle");
  const [ribbon, setRibbon] = useState<string[]>(() => [createRibbon(freeCase.items.map((item) => item.imageKey))[0]]);
  const [find, setFind] = useState<GameState["loot"][number] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  // Local stopwatch: counts seconds elapsed since the component mounted.
  // Does NOT use Date.now() — only increments a counter, so changing the
  // device clock has no effect on the displayed timer.
  const [localTick, setLocalTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setLocalTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Calculate remaining time based on server time + local tick.
  // lastFreeCaseAt and serverTime both come from the server, so the
  // device clock is never used to compute the cooldown.
  const serverMs = new Date(serverTime).getTime();
  const lastMs = lastFreeCaseAt ? new Date(lastFreeCaseAt).getTime() : 0;
  const elapsedMs = serverMs + localTick * 1000 - lastMs;
  const onCooldown = lastMs > 0 && elapsedMs < COOLDOWN_MS;
  const remaining = COOLDOWN_MS - elapsedMs;

  const busy = phase !== "idle";
  const canOpen = !busy && !onCooldown;
  const reelsVisible = busy || (find !== null && phase === "idle");

  const handleOpen = async () => {
    setError(null);
    setFind(null);
    setRibbon(createRibbon(freeCase.items.map((item) => item.imageKey)));
    setPhase("spinning");
    sounds.open();
    try {
      const result = await openFreeCase();
      onUpdate(result.state);
      if (result.rankUp) onRankUp(result.rankUp);
      setFind(result.finds[0]);
      setPhase("landing");
      sounds.win();
    } catch (err) {
      setPhase("idle");
      sounds.error();
      setError(err instanceof Error ? err.message : "Не удалось открыть кейс.");
    }
  };

  // Collapsed mode: when on cooldown and not busy/expanded, show compact card
  const collapsed = onCooldown && !busy && !expanded;

  if (collapsed) {
    return (
      <div className="panel free-case-card free-case-collapsed">
        <button
          type="button"
          className="free-case-collapsed-row"
          onClick={() => setExpanded(true)}
        >
          <img className="case-cover" src={CASE_COVER} alt="" draggable={false} />
          <div className="free-case-collapsed-info">
            <span className="case-tile-name">{freeCase.name}</span>
            <span className="free-case-timer">
              Следующее открытие через: {formatRemaining(remaining)}
            </span>
          </div>
          <span className="free-case-chevron" aria-hidden="true">▾</span>
        </button>
        {error && (
          <p className="error-text" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="panel free-case-card">
      <div className="free-case-header">
        <img className="case-cover" src={CASE_COVER} alt="" draggable={false} />
        <div className="free-case-info">
          <h2 className="case-name">{freeCase.name}</h2>
          <span className="hint">Бесплатно · раз в 24 часа</span>
        </div>
        {onCooldown && (
          <button
            type="button"
            className="icon-button"
            onClick={() => setExpanded(false)}
            aria-label="Свернуть"
          >
            ▴
          </button>
        )}
      </div>

      <div className={`case-reel${reelsVisible ? " case-reel-open" : ""}`}>
        <div className="case-reel-inner">
          <div className="case-reel-row" style={{ gridTemplateColumns: "1fr" }}>
            <CaseOpening
              key="free-horizontal"
              orientation="horizontal"
              ribbon={ribbon}
              winnerKey={find?.image_key ?? null}
              phase={phase}
              onLanded={() => setPhase("idle")}
            />
          </div>
        </div>
      </div>

      {find && phase === "idle" && (
        <div className="find-grid" style={{ gridTemplateColumns: "1fr" }}>
          <div className="find-card" role="status">
            <p className="find-label">Вы получили</p>
            <ItemThumb imageKey={find.image_key} name={find.name} rarity={find.rarity} size="sm" />
            <p className="find-value">{find.name}</p>
            <span className="rarity-label" style={{ color: RARITY_INFO[find.rarity].color }}>
              {RARITY_INFO[find.rarity].label} · Ур. {find.level}
            </span>
            <GoldAmount amount={find.value} />
          </div>
        </div>
      )}

      <div className="case-actions">
        <span className="free-case-timer">
          {onCooldown ? `Следующее открытие через: ${formatRemaining(remaining)}` : "Кейс доступен для открытия!"}
        </span>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleOpen}
          disabled={!canOpen}
        >
          {busy ? "Открываем..." : "Открыть бесплатно"}
        </button>
      </div>

      {error && (
        <p className="error-text" role="alert">
          {error}
        </p>
      )}

      <section className="case-contents">
        <h3 className="section-title">Содержимое кейса</h3>
        <ul className="contents-grid">
          {freeCase.items.map((item) => (
            <li
              key={item.imageKey}
              className="content-card"
              style={{ borderColor: RARITY_INFO[item.rarity].color }}
            >
              <div className="content-card-trigger" style={{ cursor: "default" }}>
                <ItemThumb imageKey={item.imageKey} name={item.name} rarity={item.rarity} size="sm" />
                <span className="item-name">{item.name}</span>
                <span className="rarity-label" style={{ color: RARITY_INFO[item.rarity].color }}>
                  {RARITY_INFO[item.rarity].label}
                </span>
                <span className="content-chance">{item.chance}%</span>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
