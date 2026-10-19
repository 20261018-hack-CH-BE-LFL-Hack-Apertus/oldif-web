import Link from "next/link";
import type { RefObject } from "react";
import type { useResearch } from "@/hooks/useResearch";
import type { useVoice } from "@/hooks/useVoice";
import type { Copy } from "@/lib/i18n";
import s from "./AppStyles.module.css";
export function Composer({
  research,
  voice,
  t,
  input,
  setInput,
  inputRef,
  send,
}: {
  research: ReturnType<typeof useResearch>;
  voice: ReturnType<typeof useVoice>;
  t: Copy;
  input: string;
  setInput: (value: string) => void;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  send: () => void;
}) {
  return (
    <div className={s.composerWrap}>
      {research.error && (
        <p role="alert" className={s.error}>
          {research.error}{" "}
          {!research.ready && <Link href="/login">{t.signIn} ↗</Link>}
        </p>
      )}
      {voice.status !== "idle" && (
        <section className={s.voice}>
          <div className={s.controls}>
            <strong>
              ◉{" "}
              {voice.status === "connecting"
                ? t.loading
                : voice.status === "connected"
                  ? t.connected
                  : t.failed}
            </strong>
            <button
              type="button"
              className={s.button}
              onClick={voice.toggleMute}
              aria-pressed={voice.muted}
            >
              {voice.muted ? t.unmute : t.mute}
            </button>
            <button
              type="button"
              className={s.button}
              onClick={() => {
                voice.stop();
                research.cancel();
              }}
            >
              {t.stopVoice}
            </button>
          </div>
          <p className={s.small}>{t.voiceNote}</p>
          {research.transcript && (
            <p aria-live="polite">{research.transcript}</p>
          )}
          {voice.error && <p role="alert">{voice.error}</p>}
        </section>
      )}
      <div className={s.composer}>
        <textarea
          ref={inputRef}
          className={s.textarea}
          placeholder={t.prompt}
          aria-label={t.question}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={16000}
          onKeyDown={(e) => {
            if (
              e.key === "Enter" &&
              !e.shiftKey &&
              !e.nativeEvent.isComposing
            ) {
              e.preventDefault();
              send();
            }
          }}
        />
        {input.startsWith("@") && (
          <div className={s.commands}>
            {research.datasets
              .filter((d) =>
                (d.name ?? d.title ?? d.id)
                  .toLowerCase()
                  .includes(input.slice(1).toLowerCase()),
              )
              .map((d) => (
                <button
                  type="button"
                  className={s.button}
                  key={d.id}
                  onClick={() => {
                    research.setSelected((prev) =>
                      Array.from(new Set([...prev, d.id])),
                    );
                    setInput("");
                    inputRef.current?.focus();
                  }}
                >
                  {d.name ?? d.title ?? d.id}
                </button>
              ))}
          </div>
        )}
        {input.startsWith("/") && (
          <div className={s.commands}>
            {["/sources", "/clear", "/export"]
              .filter((c) => c.startsWith(input))
              .map((c) => (
                <button
                  type="button"
                  key={c}
                  className={s.button}
                  onClick={() => setInput(c)}
                >
                  {c}
                </button>
              ))}
          </div>
        )}
        <div className={s.composerControls}>
          <select
            className={s.select}
            aria-label={t.model}
            title={t.model}
            value={research.model}
            onChange={(e) => research.setModel(e.target.value)}
          >
            {!research.models.length && <option value="">Apertus</option>}
            {research.models
              .filter((m) => !m.id.includes("realtime"))
              .map((m) => (
                <option key={m.id} value={m.id} disabled={!m.available}>
                  {m.name}
                  {m.id.includes("astra") ? ` · ${t.backup}` : ""}
                  {m.available ? "" : ` · ${t.unavailable}`}
                </option>
              ))}
          </select>
          <div className={s.controls}>
            <button
              type="button"
              className={s.iconButton}
              onClick={() => voice.start()}
              disabled={
                voice.status === "connecting" ||
                voice.status === "connected" ||
                !research.ready
              }
              aria-label={t.voice}
              title={t.voice}
            >
              ◉
            </button>
            {research.running && (
              <button
                type="button"
                className={s.button}
                onClick={research.cancel}
                title={t.cancel}
              >
                ■ {t.cancel}
              </button>
            )}
            <button
              type="button"
              className={s.primary}
              disabled={
                !input.trim() ||
                !research.ready ||
                !research.models.find((m) => m.id === research.model)?.available
              }
              onClick={send}
              title={research.running ? t.steer : t.send}
            >
              {research.running ? t.steer : t.send} ↑
            </button>
          </div>
        </div>
      </div>
      <p className={s.composerHint}>{t.commandHint}</p>
    </div>
  );
}
