/**
 * Parser do conteúdo programático de editais brasileiros.
 * Puro e testável: recebe texto, devolve árvore Disciplina -> Assunto -> Subassunto.
 */

export type AssuntoParseado = {
  nome: string;
  incluir: boolean;
  filhos: AssuntoParseado[];
};

export type DisciplinaParseada = {
  nome: string;
  peso: number;
  ativa: boolean;
  assuntos: AssuntoParseado[];
};

const BLOCOS = /^(conhecimentos\s+(b[áa]sicos|gerais|espec[íi]ficos)|conte[úu]do\s+program[áa]tico)/i;

const RUIDO =
  /^(anexo|edital|p[áa]gina|\d+\s*$|sum[áa]rio|observa[çc][õo]es?:?$|bibliografia)/i;

function limpar(linha: string) {
  return linha
    .replace(/\s+/g, " ")
    .replace(/^[-–—•*]\s*/, "")
    .trim();
}

function ehTituloDisciplina(linha: string) {
  const l = limpar(linha);
  if (l.length < 3 || l.length > 70) return false;
  if (/^\d/.test(l)) return false;
  const letras = l.replace(/[^A-Za-zÀ-ÿ]/g, "");
  if (!letras) return false;
  const maiusculas = letras.replace(/[^A-ZÀ-Þ]/g, "").length;
  const proporcao = maiusculas / letras.length;
  if (proporcao > 0.85) return true;
  // Títulos como "Língua Portuguesa:" ou "Direito Constitucional -"
  return /^[A-ZÀ-Þ][\wÀ-ÿ\s/()]+[:–-]\s*$/.test(l);
}

function nivelNumerado(linha: string): { nivel: number; texto: string } | null {
  const m = limpar(linha).match(/^(\d+(?:\.\d+)*)[.)\-–\s]+(.*)$/);
  if (!m) return null;
  const partes = m[1].split(".").filter(Boolean);
  return { nivel: partes.length - 1, texto: m[2].trim() };
}

function quebrarPorPontoEVirgula(texto: string): string[] {
  if (!texto.includes(";")) return [texto];
  return texto
    .split(";")
    .map((t) => t.trim().replace(/\.$/, ""))
    .filter((t) => t.length > 2);
}

function novoAssunto(nome: string): AssuntoParseado {
  return { nome: nome.replace(/[.;:]$/, "").trim(), incluir: true, filhos: [] };
}

export function parseEdital(texto: string): DisciplinaParseada[] {
  const linhas = (texto ?? "")
    .split(/\r?\n/)
    .map(limpar)
    .filter((l) => l.length > 0 && !RUIDO.test(l));

  const disciplinas: DisciplinaParseada[] = [];
  let atual: DisciplinaParseada | null = null;

  const garantirDisciplina = (nome: string) => {
    const existente = disciplinas.find(
      (d) => d.nome.toLowerCase() === nome.toLowerCase(),
    );
    if (existente) {
      atual = existente;
      return existente;
    }
    const nova: DisciplinaParseada = {
      nome: nome.replace(/[:–-]\s*$/, "").trim(),
      peso: 3,
      ativa: true,
      assuntos: [],
    };
    disciplinas.push(nova);
    atual = nova;
    return nova;
  };

  for (const linha of linhas) {
    if (BLOCOS.test(linha)) continue;

    const numerado = nivelNumerado(linha);

    if (!numerado && ehTituloDisciplina(linha)) {
      garantirDisciplina(linha);
      continue;
    }

    if (!atual) garantirDisciplina("Disciplina não identificada");
    const disciplina = atual as unknown as DisciplinaParseada;

    const conteudo = numerado ? numerado.texto : linha;
    if (!conteudo || conteudo.length < 2) continue;

    const partes = quebrarPorPontoEVirgula(conteudo);
    const nivel = numerado ? Math.min(numerado.nivel, 1) : 0;

    if (nivel === 1 && disciplina.assuntos.length > 0) {
      const pai = disciplina.assuntos[disciplina.assuntos.length - 1];
      partes.forEach((p) => pai.filhos.push(novoAssunto(p)));
    } else {
      partes.forEach((p) => disciplina.assuntos.push(novoAssunto(p)));
    }
  }

  return disciplinas.filter((d) => d.assuntos.length > 0 || d.nome !== "Disciplina não identificada");
}

export async function extrairTextoDePdf(arquivo: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  const buffer = await arquivo.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buffer }).promise;
  const paginas: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const linhas = new Map<number, string[]>();
    for (const item of content.items as Array<{ str: string; transform: number[] }>) {
      if (!item.str?.trim()) continue;
      const y = Math.round(item.transform[5]);
      const atual = linhas.get(y) ?? [];
      atual.push(item.str);
      linhas.set(y, atual);
    }
    const ordenadas = [...linhas.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([, partes]) => partes.join(" ").trim());
    paginas.push(ordenadas.join("\n"));
  }
  return paginas.join("\n");
}
