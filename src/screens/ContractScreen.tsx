import { useEffect, useState } from "react";
import { ItemThumb } from "../components/ItemThumb";
import { GoldAmount } from "../components/GoldAmount";
import { TARGET_TIERS } from "../lib/items";
import { ContractOutcome, GameState, previewContract, runContract } from "../lib/gameApi";
import { sounds } from "../lib/sound";

const MAX_EXTRA_ITEMS = 5;
const PREVIEW_DEBOUNCE_MS = 250;
const CONTRACT_MIN_DURATION_MS = 2000;

type ContractScreenProps = {
  state: GameState;
  onUpdate: (state: GameState) => void;
};

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function ContractScreen({ state, onUpdate }: ContractScreenProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [extraIds, setExtraIds] = useState<string[]>([]);
  const [goldAmount, setGoldAmount] = useState(0);
  const [target, setTarget] = useState<number | null>(null);
  const [chance, setChance] = useState<number | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [outcome, setOutcome] = useState<ContractOutcome | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedItem = state.loot.find((item) => item.id === selectedId) ?? null;
  const otherItems = state.loot.filter((item) => item.id !== selectedId);
  const extrasValue = state.loot
    .filter((item) => extraIds.includes(item.id))
    .reduce((total, item) => total + item.value, 0);
  const inputTotal = selectedItem ? selectedItem.value + extrasValue + goldAmount : 0;
  const targetValid = target !== null && target > inputTotal;

  useEffect(() => {
    const ownedIds = new Set(state.loot.map((item) => item.id));
    if (selectedId && !ownedIds.has(selectedId)) setSelectedId(null);
    setExtraIds((prev) => prev.filter((id) => ownedIds.has(id) && id !== selectedId));
    setGoldAmount((prev) => Math.min(prev, state.gold));
  }, [state, selectedId]);

  useEffect(() => {
    if (!selectedId || target === null || !targetValid) {
      setChance(null);
      setPreviewError(null);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      previewContract({ itemId: selectedId, extraItemIds: extraIds, goldAmount, targetValue: target })
        .then((result) => {
          if (cancelled) return;
          setChance(result.chance);
          setPreviewError(null);
        })
        .catch((err: unknown) => {
          if (cancelled) return;
          setChance(null);
          setPreviewError(err instanceof Error ? err.message : "Не удалось рассчитать контракт.");
        });
    }, PREVIEW_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [selectedId, extraIds, goldAmount, target, targetValid]);

  const toggleExtra = (id: string) => {
    setExtraIds((prev) => {
      if (prev.includes(id)) return prev.filter((itemId) => itemId !== id);
      if (prev.length >= MAX_EXTRA_ITEMS) return prev;
      return [...prev, id];
    });
  };

  const resetForm = () => {
    setSelectedId(null);
    setExtraIds([]);
    setGoldAmount(0);
    setTarget(null);
    setChance(null);
  };

  const handleSubmit = async () => {
    if (!selectedId || target === null) return;
    setSubmitting(true);
    setError(null);
    try {
      const [result] = await Promise.all([
        runContract({ itemId: selectedId, extraItemIds: extraIds, goldAmount, targetValue: target }),
        wait(CONTRACT_MIN_DURATION_MS),
      ]);
      onUpdate(result.state);
      setOutcome(result.outcome);
      if (result.outcome.won) sounds.win();
      else sounds.lose();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось выполнить контракт.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitting) {
    return (
      <section className="panel contract-status" role="status">
        <div className="contract-ring" aria-hidden="true" />
        <p className="loading-text">Контракт выполняется...</p>
        <div className="progress-bar">
          <div className="progress-bar-fill" />
        </div>
      </section>
    );
  }

  if (outcome) {
    return (
      <section className={`panel outcome-card ${outcome.won ? "outcome-won" : "outcome-lost"}`}>
        <h2 className="section-title">{outcome.won ? "Контракт выполнен" : "Контракт провален"}</h2>
        <p>
          {outcome.won
            ? `Предмет поднят до стоимости ${outcome.target} и возвращен в инвентарь.`
            : "Предмет и вложенная голда утеряны."}
        </p>
        <button type="button" className="btn btn-primary" onClick={() => setOutcome(null)}>
          Новый контракт
        </button>
      </section>
    );
  }

  if (state.loot.length === 0) {
    return (
      <section className="panel empty-state">
        <h2 className="section-title">Контракт недоступен</h2>
        <p className="hint">В инвентаре нет предметов. Откройте кейс, чтобы получить их.</p>
      </section>
    );
  }

  return (
    <section className="contract-screen">
      <div>
        <h1 className="page-title">Контракт</h1>
        <p className="page-subtitle">Улучшите предмет с риском его потерять</p>
      </div>

      <div className="contract-grid">
        <div className="panel">
          <h2 className="section-title">Предмет</h2>
          <ul className="item-grid">
            {state.loot.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className={`item-card ${selectedId === item.id ? "item-card-active" : ""}`}
                  onClick={() => setSelectedId(item.id)}
                >
                  <ItemThumb imageKey={item.image_key} name={item.name} rarity={item.rarity} />
                  <span className="item-name">{item.name}</span>
                  <GoldAmount amount={item.value} />
                </button>
              </li>
            ))}
          </ul>

          {selectedItem && (
            <>
              <h2 className="section-title">Добавить предметы (повышают шанс)</h2>
              <p className="hint">Выбрано: {extraIds.length} из {MAX_EXTRA_ITEMS}</p>
              {otherItems.length === 0 ? (
                <p className="hint">Других предметов нет.</p>
              ) : (
                <ul className="item-grid">
                  {otherItems.map((item) => {
                    const checked = extraIds.includes(item.id);
                    const disabled = !checked && extraIds.length >= MAX_EXTRA_ITEMS;
                    return (
                      <li key={item.id}>
                        <label className={`item-card item-card-check ${checked ? "item-card-active" : ""} ${disabled ? "item-card-disabled" : ""}`}>
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={disabled}
                            onChange={() => toggleExtra(item.id)}
                          />
                          <ItemThumb imageKey={item.image_key} name={item.name} rarity={item.rarity} />
                          <span className="item-name">{item.name}</span>
                          <GoldAmount amount={item.value} />
                        </label>
                      </li>
                    );
                  })}
                </ul>
              )}

              <h2 className="section-title">Добавить голду с баланса</h2>
              <div className="gold-control">
                <input
                  type="range"
                  min={0}
                  max={state.gold}
                  step={0.01}
                  value={goldAmount}
                  disabled={state.gold === 0}
                  onChange={(event) => setGoldAmount(Number(event.target.value))}
                  aria-label="Количество голды"
                />
                <span className="gold-value">
                  <GoldAmount amount={goldAmount} /> из {state.gold}
                </span>
              </div>

              <h2 className="section-title">Стоимость улучшения</h2>
              <p className="hint">Вложено: {inputTotal}. Выберите стоимость выше этой суммы.</p>
              <ul className="tier-list">
                {TARGET_TIERS.map((tier) => {
                  const tooLow = tier <= inputTotal;
                  return (
                    <li key={tier}>
                      <button
                        type="button"
                        className={`tier ${target === tier ? "tier-active" : ""}`}
                        disabled={tooLow}
                        onClick={() => setTarget(tier)}
                      >
                        <GoldAmount amount={tier} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>

        <aside className="panel summary-card">
          <h2 className="section-title">Итог</h2>
          <div className="summary-row">
            <span>Вложено</span>
            <strong>{selectedItem ? inputTotal : "—"}</strong>
          </div>
          <div className="summary-row">
            <span>Новая стоимость</span>
            <strong>{targetValid && target !== null ? target : "—"}</strong>
          </div>
          <div className="summary-row">
            <span>Шанс успеха</span>
            <strong>{chance !== null ? `${chance}%` : "—"}</strong>
          </div>
          <p className="hint">Шанс не может быть выше 80%.</p>
          {previewError && <p className="error-text">{previewError}</p>}
          {error && (
            <p className="error-text" role="alert">
              {error}
            </p>
          )}
          <button
            type="button"
            className="btn btn-primary btn-block"
            disabled={!selectedItem || !targetValid || chance === null || submitting}
            onClick={handleSubmit}
          >
            Запустить контракт
          </button>
        </aside>
      </div>
    </section>
  );
}
