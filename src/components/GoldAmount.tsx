import { useState } from "react";
import { GOLD_ICON } from "../lib/items";

export function GoldAmount({ amount }: { amount: number }) {
  const [coinFailed, setCoinFailed] = useState(false);
  return (
    <span className="gold-amount">
      {!coinFailed && (
        <img
          className="gold-coin"
          src={GOLD_ICON}
          alt=""
          aria-hidden="true"
          draggable={false}
          onError={() => setCoinFailed(true)}
        />
      )}
      {amount}
    </span>
  );
}
