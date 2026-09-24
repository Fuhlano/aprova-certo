import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const CHAVE = "aprova:concurso";

export type Concurso = {
  id: string;
  nome: string;
  banca: string | null;
  orgao: string | null;
  cargo: string | null;
  data_prova: string | null;
  status: string;
};

export function useConcursos() {
  return useQuery({
    queryKey: ["concursos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("concursos")
        .select("id, nome, banca, orgao, cargo, data_prova, status")
        .order("criado_em", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Concurso[];
    },
  });
}

export function useConcursoAtivo() {
  const { data: concursos, isLoading } = useConcursos();
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    if (!concursos || concursos.length === 0) return;
    const salvo = localStorage.getItem(CHAVE);
    const valido = salvo && concursos.some((c) => c.id === salvo) ? salvo : concursos[0].id;
    setId(valido);
  }, [concursos]);

  const selecionar = useCallback((novo: string) => {
    localStorage.setItem(CHAVE, novo);
    setId(novo);
  }, []);

  const concurso = concursos?.find((c) => c.id === id) ?? null;
  return { concursos: concursos ?? [], concurso, concursoId: id, selecionar, isLoading };
}
