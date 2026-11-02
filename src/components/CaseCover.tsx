import { getCaseCover, getCaseCoverOverlay } from "../lib/items";

export function CaseCover({ caseKey }: { caseKey: string }) {
  const overlay = getCaseCoverOverlay(caseKey);
  return (
    <span className="case-cover">
      <img className="case-cover-base" src={getCaseCover(caseKey)} alt="" draggable={false} />
      {overlay && <img className="case-cover-overlay" src={overlay} alt="" draggable={false} />}
    </span>
  );
}
