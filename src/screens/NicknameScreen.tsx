import { FormEvent, useState } from "react";
import { GameState, setNickname } from "../lib/gameApi";

type NicknameScreenProps = {
  onSaved: (state: GameState) => void;
};

export function NicknameScreen({ onSaved }: NicknameScreenProps) {
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmed = value.trim();
  const canSubmit = trimmed.length > 0 && !submitting;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    setNickname(trimmed)
      .then(onSaved)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Не удалось сохранить ник.");
        setSubmitting(false);
      });
  };

  return (
    <div className="nickname-screen">
      <form className="panel nickname-card" onSubmit={handleSubmit}>
        <h1 className="page-title">Добро пожаловать в Zombix</h1>
        <p className="page-subtitle">
          Придумайте ник. Он будет виден в таблице лидеров. Изменить его потом нельзя.
        </p>
        <div className="field">
          <label htmlFor="nickname-input">Ник</label>
          <input
            id="nickname-input"
            type="text"
            maxLength={24}
            autoFocus
            autoComplete="off"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Например, Zombie_King"
          />
          <span className="hint">От 1 до 24 символов: буквы, цифры, пробел, _ и -.</span>
        </div>
        {error && <p className="error-text">{error}</p>}
        <button type="submit" className="btn btn-primary btn-block" disabled={!canSubmit}>
          {submitting ? "Сохраняем..." : "Начать игру"}
        </button>
      </form>
    </div>
  );
}
