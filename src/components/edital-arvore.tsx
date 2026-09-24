import { ChevronDown, ChevronRight, Trash2 } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DisciplinaParseada } from "@/lib/edital-parser";

export function EditalArvore({
  disciplinas,
  onChange,
}: {
  disciplinas: DisciplinaParseada[];
  onChange: (novas: DisciplinaParseada[]) => void;
}) {
  const [abertas, setAbertas] = useState<Record<number, boolean>>({ 0: true });

  const atualizar = (indice: number, patch: Partial<DisciplinaParseada>) => {
    const copia = [...disciplinas];
    copia[indice] = { ...copia[indice], ...patch };
    onChange(copia);
  };

  return (
    <div className="space-y-3">
      {disciplinas.map((disciplina, i) => {
        const aberta = abertas[i] ?? false;
        const marcados = disciplina.assuntos.filter((a) => a.incluir).length;
        return (
          <div key={`${disciplina.nome}-${i}`} className="rounded-2xl border bg-card p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setAbertas((a) => ({ ...a, [i]: !aberta }))}
                aria-label={aberta ? "Recolher" : "Expandir"}
              >
                {aberta ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
              </Button>
              <Input
                value={disciplina.nome}
                onChange={(e) => atualizar(i, { nome: e.target.value })}
                className="h-9 max-w-xs font-medium"
                aria-label="Nome da disciplina"
              />
              <Badge variant="secondary">{marcados} assuntos</Badge>
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground">Peso</Label>
                <Select
                  value={String(disciplina.peso)}
                  onValueChange={(v) => atualizar(i, { peso: Number(v) })}
                >
                  <SelectTrigger className="h-9 w-16">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((p) => (
                      <SelectItem key={p} value={String(p)}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id={`ativa-${i}`}
                  checked={disciplina.ativa}
                  onCheckedChange={(v) => atualizar(i, { ativa: v })}
                />
                <Label htmlFor={`ativa-${i}`} className="text-xs text-muted-foreground">
                  Ativa no ciclo
                </Label>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="ml-auto text-muted-foreground"
                aria-label="Remover disciplina"
                onClick={() => onChange(disciplinas.filter((_, idx) => idx !== i))}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>

            {aberta && (
              <ul className="mt-3 space-y-2 border-t pt-3">
                {disciplina.assuntos.map((assunto, j) => (
                  <li key={`${assunto.nome}-${j}`} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={assunto.incluir}
                        onCheckedChange={(v) => {
                          const assuntos = [...disciplina.assuntos];
                          assuntos[j] = { ...assuntos[j], incluir: Boolean(v) };
                          atualizar(i, { assuntos });
                        }}
                        aria-label={`Incluir ${assunto.nome}`}
                      />
                      <Input
                        value={assunto.nome}
                        onChange={(e) => {
                          const assuntos = [...disciplina.assuntos];
                          assuntos[j] = { ...assuntos[j], nome: e.target.value };
                          atualizar(i, { assuntos });
                        }}
                        className="h-8 text-sm"
                        aria-label="Nome do assunto"
                      />
                    </div>
                    {assunto.filhos.length > 0 && (
                      <ul className="ml-7 space-y-1.5">
                        {assunto.filhos.map((filho, k) => (
                          <li key={`${filho.nome}-${k}`} className="flex items-center gap-2">
                            <Checkbox
                              checked={filho.incluir}
                              onCheckedChange={(v) => {
                                const assuntos = [...disciplina.assuntos];
                                const filhos = [...assuntos[j].filhos];
                                filhos[k] = { ...filhos[k], incluir: Boolean(v) };
                                assuntos[j] = { ...assuntos[j], filhos };
                                atualizar(i, { assuntos });
                              }}
                              aria-label={`Incluir ${filho.nome}`}
                            />
                            <Input
                              value={filho.nome}
                              onChange={(e) => {
                                const assuntos = [...disciplina.assuntos];
                                const filhos = [...assuntos[j].filhos];
                                filhos[k] = { ...filhos[k], nome: e.target.value };
                                assuntos[j] = { ...assuntos[j], filhos };
                                atualizar(i, { assuntos });
                              }}
                              className="h-8 text-sm"
                              aria-label="Nome do subassunto"
                            />
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
