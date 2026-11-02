import { useState } from "react";
import { ITEM_IMAGES } from "../lib/items";
import { RARITY_INFO, Rarity } from "../lib/rarity";

type ItemThumbProps = {
  imageKey: string | null;
  name: string;
  rarity?: Rarity;
  size?: "sm" | "md" | "lg";
};

export function ItemThumb({ imageKey, name, rarity, size = "md" }: ItemThumbProps) {
  const src = imageKey ? ITEM_IMAGES[imageKey] : undefined;
  const [failed, setFailed] = useState(false);
  const style = rarity ? { borderColor: RARITY_INFO[rarity].color } : undefined;
  const imageClass = imageKey ? `item-image-${imageKey}` : "";
  return (
    <div className={`item-thumb item-thumb-${size}`} style={style}>
      {src && !failed && (
        <img className={imageClass} src={src} alt={name} loading="lazy" draggable={false} onError={() => setFailed(true)} />
      )}
    </div>
  );
}
