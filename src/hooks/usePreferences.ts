"use client";
import { useEffect, useState } from "react";
import { dictionaries, languages } from "@/lib/i18n";
import type { Language } from "@/lib/models/types";
export function usePreferences() {
  const [language, setLanguage] = useState<Language>("en");
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const value = localStorage.getItem("oldif-language");
    if (languages.some((l) => l.id === value)) setLanguage(value as Language);
    setDark(
      localStorage.getItem("oldif-theme") === "dark" ||
        (!localStorage.getItem("oldif-theme") &&
          matchMedia("(prefers-color-scheme: dark)").matches),
    );
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    document.documentElement.lang = language;
  }, [dark, language]);
  function chooseLanguage(value: Language) {
    setLanguage(value);
    localStorage.setItem("oldif-language", value);
  }
  function toggleTheme() {
    setDark((v) => {
      localStorage.setItem("oldif-theme", v ? "light" : "dark");
      return !v;
    });
  }
  return {
    language,
    setLanguage: chooseLanguage,
    dark,
    toggleTheme,
    t: dictionaries[language],
  };
}
