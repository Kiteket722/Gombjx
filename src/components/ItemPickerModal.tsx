import { useEffect } from "react";
import { GoldAmount } from "./GoldAmount";
import { ItemThumb } from "./ItemThumb";
import { LootItem } from "../lib/gameApi";
import { RARITY_INFO } from "../lib/rarity";
import { MIN_WITHDRAW_ITEM_VALUE } from "../lib/items";

type ItemPickerModalProps = {
  items: LootItem[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onDone: () => void;
};

export function ItemPickerModal({ items, selectedIds, onToggle, onDone }: ItemPickerModalProps) {
  const selectedTotal = items
    .filter((item) => selectedIds.has(item.id))
    .reduce((total, item) => total + item.value, 0);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onDone();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onDone]);

  return (
    <div className="modal-overlay" onClick={onDone}>
      <div
        className="modal modal-wide panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="item-picker-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="item-picker-title" className="section-title">Предметы на вывод</h2>
        <p className="hint">Нажмите на предметы, которые хотите вывести. Предметы дешевле {MIN_WITHDRAW_ITEM_VALUE} голды вывести нельзя.</p>

        {items.length === 0 ? (
          <p className="hint">В инвентаре нет предметов.</p>
        ) : (
          <ul className="pick-list">
            {items.map((item) => {
              const checked = selectedIds.has(item.id);
              const locked = item.value < MIN_WITHDRAW_ITEM_VALUE;
              return (
                <li key={item.id}>
                  <label
                    className={`pick-item${checked ? " pick-item-checked" : ""}${locked ? " pick-item-locked" : ""}`}
                    style={{ borderColor: RARITY_INFO[item.rarity].color }}
                  >
                    <input type="checkbox" checked={checked} disabled={locked} onChange={() => onToggle(item.id)} />
                    <ItemThumb imageKey={item.image_key} name={item.name} rarity={item.rarity} size="sm" />
                    <span className="item-name">{item.name}</span>
                    <span className="rarity-label" style={{ color: RARITY_INFO[item.rarity].color }}>
                      Ур. {item.level}
                    </span>
                    <GoldAmount amount={item.value} />
                  </label>
                </li>
              );
            })}
          </ul>
        )}

        <div className="pick-total">
          <span className="stat-label">Сумма вывода</span>
          <GoldAmount amount={selectedTotal} />
        </div>

        <div className="modal-actions">
          <button type="button" className="btn btn-primary" onClick={onDone}>
            Готово
          </button>
        </div>
      </div>
    </div>
  );
}
