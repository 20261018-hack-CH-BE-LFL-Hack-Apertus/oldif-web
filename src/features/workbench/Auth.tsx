"use client";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { usePreferences } from "@/hooks/usePreferences";
import { post } from "@/lib/api/client";
import s from "./AppStyles.module.css";
import { Header } from "./Header";
export function Auth() {
  const prefs = usePreferences();
  const { t } = prefs;
  const router = useRouter();
  const [register, setRegister] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function login(path: string, body: unknown) {
    setBusy(true);
    setError("");
    try {
      await post(path, body);
      router.push("/app");
    } catch (e) {
      setError(e instanceof Error ? e.message : t.failed);
    } finally {
      setBusy(false);
    }
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    void login(
      register ? "/auth/register" : "/auth/login",
      Object.fromEntries(f),
    );
  }
  return (
    <div className={s.shell}>
      <Header prefs={prefs} />
      <main className={s.auth}>
        <span className={s.eyebrow}>{t.signedIn}</span>
        <h1>{register ? t.signUp : t.login}</h1>
        <form onSubmit={submit}>
          {register && (
            <label className={s.field}>
              {t.name}
              <input
                name="name"
                autoComplete="name"
                className={s.input}
                required
                maxLength={120}
              />
            </label>
          )}
          <label className={s.field}>
            {t.email}
            <input
              name="email"
              type="email"
              autoComplete="email"
              className={s.input}
              required
            />
          </label>
          <label className={s.field}>
            {t.password}
            <input
              name="password"
              type="password"
              minLength={12}
              autoComplete={register ? "new-password" : "current-password"}
              className={s.input}
              required
            />
          </label>
          <button type="submit" className={s.primary} disabled={busy}>
            {busy ? t.loading : register ? t.signUp : t.signIn} ↗
          </button>
        </form>
        <button
          type="button"
          className={s.button}
          onClick={() => setRegister(!register)}
        >
          {register ? t.signIn : t.signUp}
        </button>
        <div className={s.divider}>
          <button
            type="button"
            className={s.button}
            onClick={() => login("/auth/demo", {})}
            disabled={busy}
          >
            {t.demo} ↗
          </button>
          <p className={`${s.small} ${s.muted}`}>{t.demoNote}</p>
        </div>
        {error && (
          <p role="alert" className={s.error}>
            {error}
          </p>
        )}
      </main>
    </div>
  );
}
