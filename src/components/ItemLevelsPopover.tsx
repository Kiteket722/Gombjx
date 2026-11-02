import { useEffect, useRef } from "react";
import { GoldAmount } from "./GoldAmount";
import { CaseItem } from "../lib/gameApi";
import { formatChance } from "../lib/items";

type ItemLevelsPopoverProps = {
  item: CaseItem;
  onClose: () => void;
};

export function ItemLevelsPopover({ item, onClose }: ItemLevelsPopoverProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const owner = ref.current?.parentElement;
      if (owner && !owner.contains(event.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [onClose]);

  return (
    <div ref={ref} className="levels-popover" role="dialog" aria-label={`Уровни: ${item.name}`}>
      <p className="levels-title">Уровни предмета</p>
      {item.priceRange ? (
        <p className="levels-range">
          Случайная цена от <GoldAmount amount={item.priceRange.min} /> до <GoldAmount amount={item.priceRange.max} />
        </p>
      ) : (
        <ul className="levels-list">
          {item.levels.map((level) => (
            <li key={level.level} className="levels-row">
              <span className="levels-name">Ур. {level.level}</span>
              <GoldAmount amount={level.value} />
              <span className="levels-chance">{formatChance(level.chance)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
