import { useState } from "react";
import { CaseCover } from "../components/CaseCover";
import { CaseModal } from "../components/CaseModal";
import { FreeCaseCard } from "../components/FreeCaseCard";
import { CaseView, GameState, RankUp } from "../lib/gameApi";
import { GoldAmount } from "../components/GoldAmount";

const HERO_IMAGE = "https://images.pexels.com/photos/4874342/pexels-photo-4874342.jpeg?auto=compress&cs=tinysrgb&h=650&w=940";

type CasesScreenProps = {
  state: GameState;
  onUpdate: (state: GameState) => void;
  onRankUp: (rankUp: RankUp) => void;
};

function CaseGroup({
  title,
  hint,
  cases,
  onSelect,
}: {
  title: string;
  hint: string;
  cases: CaseView[];
  onSelect: (caseView: CaseView) => void;
}) {
  return (
    <section className="case-category">
      <div className="section-head">
        <div>
          <h2 className="section-title">{title}</h2>
          <p className="hint">{hint}</p>
        </div>
        <span className="case-category-count">{cases.length}</span>
      </div>
      <ul className="case-grid">
        {cases.map((caseView) => (
          <li key={caseView.key}>
            <button
              type="button"
              className={`case-tile${caseView.available ? "" : " case-tile-unavailable"}`}
              onClick={() => onSelect(caseView)}
              disabled={!caseView.available}
            >
          <CaseCover caseKey={caseView.key} />
              <span className="case-tile-name">{caseView.name}</span>
              <span className="case-tile-price">
                <GoldAmount amount={caseView.price} />
                {!caseView.available && <span className="case-coming-soon">Скоро</span>}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function CasesScreen({ state, onUpdate, onRankUp }: CasesScreenProps) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const openCaseView: CaseView | undefined = state.cases.find((caseView) => caseView.key === openKey);
  const mainCases = state.cases.filter((caseView) => caseView.category === "main");
  const namedCases = state.cases.filter((caseView) => caseView.category === "named");

  return (
    <section className="cases-screen">
      <div className="hero" style={{ backgroundImage: `url(${HERO_IMAGE})` }}>
        <div className="hero-overlay">
          <span className="eyebrow">Zombix</span>
          <h1 className="hero-title">Кейсы</h1>
          <p className="hero-subtitle">Открывайте кейсы за голду и выбивайте редкие награды</p>
        </div>
      </div>

      <section className="case-category case-category-free">
        <div className="section-head">
          <div>
            <h2 className="section-title">Бесплатные</h2>
            <p className="hint">Один бесплатный кейс каждые 24 часа</p>
          </div>
          <span className="case-category-count">1</span>
        </div>
        <FreeCaseCard
          freeCase={state.freeCase}
          lastFreeCaseAt={state.lastFreeCaseAt}
          serverTime={state.serverTime}
          onUpdate={onUpdate}
          onRankUp={onRankUp}
        />
      </section>

      <CaseGroup
        title="Основные"
        hint="Все стандартные кейсы для открытия за голду"
        cases={mainCases}
        onSelect={(caseView) => setOpenKey(caseView.key)}
      />

      <CaseGroup
        title="Именные"
        hint="Особенные кейсы с отдельной историей"
        cases={namedCases}
        onSelect={(caseView) => setOpenKey(caseView.key)}
      />

      <p className="hint cases-opened-count">Всего открыто кейсов: {state.searches}</p>

      {openCaseView && openCaseView.available && (
        <CaseModal
          key={openCaseView.key}
          caseView={openCaseView}
          gold={state.gold}
          onClose={() => setOpenKey(null)}
          onUpdate={onUpdate}
          onRankUp={onRankUp}
        />
      )}
    </section>
  );
}
