"use client";
import { useEffect, useState } from "react";
import { usePreferences } from "@/hooks/usePreferences";
import s from "./AppStyles.module.css";

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};
export function AppLifecycle() {
  const [offline, setOffline] = useState(false);
  const [install, setInstall] = useState<InstallEvent>();
  const [swError, setSwError] = useState(false);
  const { t } = usePreferences();
  useEffect(() => {
    if ("serviceWorker" in navigator)
      void navigator.serviceWorker
        .register("/sw.js")
        .catch(() => setSwError(true));
    function update() {
      setOffline(!navigator.onLine);
    }
    function prompt(event: Event) {
      event.preventDefault();
      setInstall(event as InstallEvent);
    }
    update();
    addEventListener("online", update);
    addEventListener("offline", update);
    addEventListener("beforeinstallprompt", prompt);
    return () => {
      removeEventListener("online", update);
      removeEventListener("offline", update);
      removeEventListener("beforeinstallprompt", prompt);
    };
  }, []);
  return (
    <>
      {offline && <output className={s.error}>{t.offline}</output>}
      {swError && <output className={s.small}>PWA: {t.failed}</output>}
      {install && (
        <button
          type="button"
          className={s.button}
          onClick={async () => {
            await install.prompt();
            await install.userChoice;
            setInstall(undefined);
          }}
        >
          {t.install} ↓
        </button>
      )}
    </>
  );
}
