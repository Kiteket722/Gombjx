import { FormEvent, useState } from "react";
import { signIn, signUp } from "../lib/adminApi";

type AdminLoginProps = {
  onSignedIn: (accessToken: string) => void;
};

export function AdminLogin({ onSignedIn }: AdminLoginProps) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (!email.trim() || password.length < 6) {
      setError("Введите email и пароль (не менее 6 символов).");
      return;
    }

    setSubmitting(true);
    try {
      const token = mode === "signin" ? await signIn(email.trim(), password) : await signUp(email.trim(), password);
      onSignedIn(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось войти.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-page">
      <form className="panel admin-login" onSubmit={handleSubmit}>
        <h1 className="page-title">Админ-панель</h1>
        <p className="page-subtitle">{mode === "signin" ? "Вход для администратора" : "Создание аккаунта"}</p>
        <label className="field">
          <span>Email</span>
          <input type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <label className="field">
          <span>Пароль</span>
          <input
            type="password"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        {error && (
          <p className="error-text" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? "Подождите..." : mode === "signin" ? "Войти" : "Создать аккаунт"}
        </button>
        <button
          type="button"
          className="btn btn-secondary btn-block"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          disabled={submitting}
        >
          {mode === "signin" ? "Создать аккаунт" : "Уже есть аккаунт"}
        </button>
      </form>
    </div>
  );
}
