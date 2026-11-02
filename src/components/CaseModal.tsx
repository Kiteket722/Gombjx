import { useEffect, useState } from "react";
import { CaseCover } from "./CaseCover";
import { CaseOpening, CasePhase, createRibbon, ReelOrientation } from "./CaseOpening";
import { GoldAmount } from "./GoldAmount";
import { ItemLevelsPopover } from "./ItemLevelsPopover";
import { ItemThumb } from "./ItemThumb";
import { formatChance } from "../lib/items";
import { CaseFind, CaseView, GameState, openCase, RankUp } from "../lib/gameApi";
import { RARITY_INFO } from "../lib/rarity";
import { sounds } from "../lib/sound";

const CASE_COUNT_OPTIONS = [1, 2, 3] as const;
const DEFAULT_CASE_COUNT_OPTIONS = [1, 2, 3];
const PUMPKIN_CASE_COUNT_OPTIONS = [1, 5, 10];
const CASE_COUNT_LABELS: Record<number, string> = {
  1: "1 кейс",
  2: "2 кейса",
  3: "3 кейса",
  5: "5 кейсов",
  10: "10 кейсов",
};

type CaseModalProps = {
  caseView: CaseView;
  gold: number;
  onClose: () => void;
  onUpdate: (state: GameState) => void;
  onRankUp: (rankUp: RankUp) => void;
};

export function CaseModal({ caseView, gold, onClose, onUpdate, onRankUp }: CaseModalProps) {
  const [phase, setPhase] = useState<CasePhase>("idle");
  const countOptions = caseView.key === "farm-tykvy" ? PUMPKIN_CASE_COUNT_OPTIONS : DEFAULT_CASE_COUNT_OPTIONS;
  const [count, setCount] = useState<number>(1);
  const [ribbons, setRibbons] = useState<string[][]>(() => [createRibbon(caseView.items.map((item) => item.imageKey))]);
  const [finds, setFinds] = useState<CaseFind[]>([]);
  const [landedCount, setLandedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [openItemKey, setOpenItemKey] = useState<string | null>(null);

  const busy = phase !== "idle";
  const reelsVisible = busy || finds.length > 0;
  const totalPrice = caseView.price * count;
  const canAfford = gold >= totalPrice;
  const orientation: ReelOrientation = ribbons.length > 1 ? "vertical" : "horizontal";

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, busy]);

  useEffect(() => {
    if (phase === "landing" && landedCount >= ribbons.length) setPhase("idle");
  }, [phase, landedCount, ribbons.length]);

  const handleOpen = async () => {
    const opening = count;
    const keys = caseView.items.map((item) => item.imageKey);
    setError(null);
    setFinds([]);
    setLandedCount(0);
    setRibbons(Array.from({ length: opening }, () => createRibbon(keys)));
    setPhase("spinning");
    sounds.open();
    try {
      const result = await openCase(caseView.key, opening);
      onUpdate(result.state);
      if (result.rankUp) onRankUp(result.rankUp);
      setFinds(result.finds);
      setPhase("landing");
      sounds.win();
    } catch (err) {
      setPhase("idle");
      sounds.error();
      setError(err instanceof Error ? err.message : "Не удалось открыть кейс.");
    }
  };

  return (
    <div className="modal-overlay" onClick={() => !busy && onClose()}>
      <div
        className="modal modal-wide panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="case-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="case-modal-header">
          <CaseCover caseKey={caseView.key} />
          <div className="case-modal-title">
            <h2 id="case-modal-title" className="case-name">{caseView.name}</h2>
            <span className="hint">Цена одного открытия</span>
            <GoldAmount amount={caseView.price} />
          </div>
          <button type="button" className="icon-button" onClick={onClose} disabled={busy} aria-label="Закрыть">
            ×
          </button>
        </header>

        <div className={`case-reel${reelsVisible ? " case-reel-open" : ""}`}>
          <div className="case-reel-inner">
            <div className="case-reel-row" style={{ gridTemplateColumns: `repeat(${ribbons.length}, minmax(0, 1fr))` }}>
              {ribbons.map((ribbon, index) => (
                <CaseOpening
                  key={`${orientation}-${index}`}
                  orientation={orientation}
                  ribbon={ribbon}
                  winnerKey={finds[index]?.image_key ?? null}
                  phase={phase}
                  onLanded={() => setLandedCount((current) => current + 1)}
                />
              ))}
            </div>
          </div>
        </div>

        {finds.length > 0 && phase === "idle" && (
          <div className="find-grid" style={{ gridTemplateColumns: `repeat(${finds.length}, minmax(0, 1fr))` }}>
            {finds.map((winner, index) => (
              <div className="find-card" role="status" key={`${winner.id}-${index}`}>
                <p className="find-label">{winner.autoSold ? "Продано автоматически" : "Вы получили"}</p>
                <ItemThumb imageKey={winner.image_key} name={winner.name} rarity={winner.rarity} size="sm" />
                <p className="find-value">{winner.name}</p>
                <span className="rarity-label" style={{ color: RARITY_INFO[winner.rarity].color }}>
                  {RARITY_INFO[winner.rarity].label} · Ур. {winner.level}
                </span>
                <GoldAmount amount={winner.value} />
              </div>
            ))}
          </div>
        )}

        <div className="case-actions">
          <div className="case-picker" role="group" aria-label="Количество кейсов">
            {countOptions.map((option) => (
              <button
                key={option}
                type="button"
                className={`count-button${count === option ? " count-button-active" : ""}`}
                aria-pressed={count === option}
                onClick={() => setCount(option)}
                disabled={busy}
              >
                {CASE_COUNT_LABELS[option]}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleOpen}
            disabled={busy || !canAfford}
          >
            {busy ? "Открываем..." : `Открыть за ${totalPrice}`}
          </button>
        </div>
        {!canAfford && <p className="hint">Не хватает голды на открытие.</p>}

        {error && (
          <p className="error-text" role="alert">
            {error}
          </p>
        )}

        <section className="case-contents">
          <h3 className="section-title">Содержимое кейса</h3>
          <p className="hint">Нажмите на предмет, чтобы увидеть его уровни и цены.</p>
          <ul className="contents-grid">
            {caseView.items.map((item) => (
              <li
                key={item.imageKey}
                className="content-card"
                style={{ borderColor: RARITY_INFO[item.rarity].color }}
              >
                <button
                  type="button"
                  className="content-card-trigger"
                  aria-expanded={openItemKey === item.imageKey}
                  onClick={() => setOpenItemKey(openItemKey === item.imageKey ? null : item.imageKey)}
                >
                  <ItemThumb imageKey={item.imageKey} name={item.name} rarity={item.rarity} size="sm" />
                  <span className="item-name">{item.name}</span>
                  <span className="rarity-label" style={{ color: RARITY_INFO[item.rarity].color }}>
                    {RARITY_INFO[item.rarity].label}
                  </span>
                  <span className="content-chance">{formatChance(item.chance)}</span>
                </button>
                {openItemKey === item.imageKey && (
                  <ItemLevelsPopover item={item} onClose={() => setOpenItemKey(null)} />
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
