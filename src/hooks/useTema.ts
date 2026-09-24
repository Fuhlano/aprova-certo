import { useCallback, useEffect, useState } from "react";

const CHAVE = "aprova:tema";

export function useTema() {
  const [tema, setTema] = useState<"light" | "dark">("light");

  useEffect(() => {
    const salvo = localStorage.getItem(CHAVE) as "light" | "dark" | null;
    const inicial =
      salvo ??
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    setTema(inicial);
    document.documentElement.classList.toggle("dark", inicial === "dark");
  }, []);

  const alternar = useCallback(() => {
    setTema((atual) => {
      const novo = atual === "dark" ? "light" : "dark";
      localStorage.setItem(CHAVE, novo);
      document.documentElement.classList.toggle("dark", novo === "dark");
      return novo;
    });
  }, []);

  return { tema, alternar };
}
