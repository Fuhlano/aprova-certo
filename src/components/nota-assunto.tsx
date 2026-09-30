import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { NotebookPen } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

export function NotaAssunto({ assuntoId, nome }: { assuntoId: string; nome: string }) {
  const [aberto, setAberto] = useState(false);
  const [conteudo, setConteudo] = useState("");
  const qc = useQueryClient();

  const { data: nota } = useQuery({
    queryKey: ["notas", assuntoId],
    enabled: aberto,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notas")
        .select("*")
        .eq("assunto_id", assuntoId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (aberto) setConteudo(nota?.conteudo ?? "");
  }, [aberto, nota]);

  const salvar = useMutation({
    mutationFn: async () => {
      if (nota?.id) {
        const { error } = await supabase
          .from("notas")
          .update({ conteudo, atualizado_em: new Date().toISOString() })
          .eq("id", nota.id);
        if (error) throw error;
        return;
      }
      const { error } = await supabase.from("notas").insert({ assunto_id: assuntoId, conteudo });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Nota salva");
      qc.invalidateQueries({ queryKey: ["notas", assuntoId] });
      setAberto(false);
    },
    onError: (e) => toast.error("Não foi possível salvar", { description: e.message }),
  });

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Anotações de ${nome}`}>
          <NotebookPen className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Anotações — {nome}</DialogTitle>
          <DialogDescription>
            Texto simples com marcação leve (use - para listas e ** para destaque).
          </DialogDescription>
        </DialogHeader>
        <Textarea
          rows={10}
          value={conteudo}
          onChange={(e) => setConteudo(e.target.value)}
          placeholder="Resumo, pegadinhas da banca, artigos de lei..."
        />
        <DialogFooter>
          <Button variant="ghost" onClick={() => setAberto(false)}>
            Cancelar
          </Button>
          <Button onClick={() => salvar.mutate()} disabled={salvar.isPending}>
            Salvar nota
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
