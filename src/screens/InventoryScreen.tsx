import { useState } from "react";
import { GoldAmount } from "../components/GoldAmount";
import { ItemThumb } from "../components/ItemThumb";
import { GameState, sellAllItems, sellItem } from "../lib/gameApi";
import { RARITY_INFO } from "../lib/rarity";

type InventoryScreenProps = {
  state: GameState;
  onUpdate: (state: GameState) => void;
};

export function InventoryScreen({ state, onUpdate }: InventoryScreenProps) {
  const [sellingId, setSellingId] = useState<string | null>(null);
  const [sellingAll, setSellingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inventoryTotal = state.loot.reduce((total, item) => total + item.value, 0);

  const handleSellAll = async () => {
    setError(null);
    setSellingAll(true);
    try {
      onUpdate(await sellAllItems());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось продать предметы.");
    } finally {
      setSellingAll(false);
    }
  };

  const handleSell = async (itemId: string) => {
    setError(null);
    setSellingId(itemId);
    try {
      onUpdate(await sellItem(itemId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось продать предмет.");
    } finally {
      setSellingId(null);
    }
  };

  return (
    <section className="inventory-screen">
      <div className="section-head">
        <div>
          <h1 className="page-title">Инвентарь</h1>
          <p className="page-subtitle">Продайте предмет за голду или выведите его стоимость</p>
        </div>
        <div className="inventory-total">
          <span className="stat-label">Общая стоимость</span>
          <GoldAmount amount={inventoryTotal} />
          <button
            type="button"
            className="btn btn-primary btn-small"
            onClick={handleSellAll}
            disabled={sellingAll || sellingId !== null || state.loot.length === 0}
          >
            {sellingAll ? "Продаем..." : "Продать все"}
          </button>
        </div>
      </div>

      {error && (
        <p className="error-text" role="alert">
          {error}
        </p>
      )}

      {state.loot.length === 0 ? (
        <section className="panel empty-state">
          <h2 className="section-title">Инвентарь пуст</h2>
          <p className="hint">Откройте кейс, чтобы получить первый предмет.</p>
        </section>
      ) : (
        <ul className="inventory-grid">
          {state.loot.map((item) => (
              <li key={item.id} className="inventory-card" style={{ borderColor: RARITY_INFO[item.rarity].color }}>
                <ItemThumb imageKey={item.image_key} name={item.name} rarity={item.rarity} />
                <span className="item-name">{item.name}</span>
                <span className="rarity-label" style={{ color: RARITY_INFO[item.rarity].color }}>
                  {RARITY_INFO[item.rarity].label} · Ур. {item.level}
                </span>
                <GoldAmount amount={item.value} />
                <div className="inventory-actions">
                  <button
                    type="button"
                    className="btn btn-secondary btn-small"
                    onClick={() => handleSell(item.id)}
                    disabled={sellingId !== null}
                  >
                    {sellingId === item.id ? "Продаем..." : "Продать"}
                  </button>
                </div>
              </li>
          ))}
        </ul>
      )}
    </section>
  );
}
