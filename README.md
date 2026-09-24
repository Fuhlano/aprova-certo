# Aprova Certo

# PROMPT ÚNICO — App de Gestão de Estudos para Concursos (Lovable)

> Cole este prompt inteiro no Lovable como primeira mensagem do projeto.

---

## 1. Visão geral

Crie um **web app completo, responsivo e 100% funcional** chamado **"Aprova"**, para gestão de estudos para concursos públicos no Brasil. O app deve ser construído inteiramente no Lovable (React + Vite + TypeScript + Tailwind + **shadcn/ui** + Supabase como backend/autenticação/banco).

O usuário é um concurseiro que precisa: cadastrar o edital do concurso, transformar o edital em disciplinas e assuntos, gerar um **ciclo de estudos** automático com base nas disciplinas ativas, estudar com **cronômetro/Pomodoro**, registrar desempenho em questões, receber **revisões programadas (repetição espaçada)** e visualizar **estatísticas** sobre o que mais cai e o que está fraco.

Referência de experiência: apps brasileiros de organização de estudos como **Gran/Guru da Aprovação** e **LS Concursos** — foco em ciclo de estudos por horas, cronômetro, histórico de sessões, revisões e relatórios. Não copie marca, logo ou textos; crie identidade própria.

---

## 2. Design System e Identidade Visual

- **Design system obrigatório: shadcn/ui** (Radix + Tailwind). Use os componentes: `button`, `card`, `dialog`, `sheet`, `drawer`, `tabs`, `table`, `form`, `input`, `select`, `combobox`, `checkbox`, `switch`, `slider`, `progress`, `badge`, `avatar`, `tooltip`, `popover`, `dropdown-menu`, `command` (⌘K), `calendar`, `sonner` (toasts), `skeleton`, `alert-dialog`, `accordion`, `scroll-area`, `separator`, `chart` (Recharts).
- **Ícones:** `lucide-react`. **Gráficos:** Recharts via `shadcn/chart`. **Animações:** `framer-motion` discretas.
- **Tipografia:** Inter (UI) + números tabulares para métricas e cronômetro (`font-variant-numeric: tabular-nums`).
- **Estilo:** moderno, limpo, muito espaço em branco, cards com `rounded-2xl`, sombras suaves, bordas sutis. Nada de gradientes berrantes. Dark mode completo via `next-themes`.

### Paleta (vermelho como cor primária)

Vermelho **rubi/carmim** como primária, apoiado por neutros quentes (stone) e cores semânticas dessaturadas para não competir com o vermelho.

| Token | Uso | Light | Dark |
|---|---|---|---|
| `primary` | ações, marca | `#C81E3C` | `#E23E58` |
| `primary-hover` | hover/active | `#A81730` | `#F05A70` |
| `primary-foreground` | texto sobre primária | `#FFF7F7` | `#1A0F11` |
| `accent-soft` | fundos de destaque | `#FDECEE` | `#2A1418` |
| `background` | fundo geral | `#FAF9F8` | `#121011` |
| `card` | superfícies | `#FFFFFF` | `#1B1819` |
| `border` | bordas/divisores | `#E7E3E1` | `#302B2C` |
| `foreground` | texto principal | `#1C1917` | `#F5F3F2` |
| `muted-foreground` | texto secundário | `#78716C` | `#A8A29E` |
| `success` | metas batidas / acertos | `#2E7D5B` | `#4CAF87` |
| `warning` | revisão atrasada | `#B7791F` | `#E0A536` |
| `destructive` | erros / excluir | `#B02A2A` | `#EF5350` |
| `info` | neutros informativos | `#3A6EA5` | `#6FA3DB` |

Implemente **todas** essas cores como variáveis HSL em `index.css` (`--primary`, `--accent`, etc.) e mapeie no `tailwind.config.ts`, para que os componentes shadcn herdem automaticamente. Gráficos usam `--chart-1..5` derivados do vermelho + neutros.

---

## 3. Modelo de dados (Supabase / Postgres)

Crie as tabelas com RLS por `user_id` (todo registro pertence ao usuário autenticado):

- **profiles** — id, nome, avatar_url, meta_horas_semanais, timezone.
- **concursos** — id, user_id, nome, banca, orgao, cargo, data_prova, status (`planejado|ativo|concluido`), edital_texto, edital_arquivo_url.
- **disciplinas** — id, concurso_id, nome, peso (1–5), ativa (bool), cor, ordem.
- **assuntos** — id, disciplina_id, nome, nivel (subtópico via `parent_id`), status (`nao_iniciado|estudando|revisar|dominado`), incidencia (0–5, "quanto cai"), confianca (0–5), ordem.
- **ciclos** — id, concurso_id, nome, carga_semanal_horas, duracao_bloco_min, ativo, criado_em.
- **ciclo_itens** — id, ciclo_id, disciplina_id, blocos_previstos, blocos_concluidos, ordem.
- **sessoes** — id, user_id, assunto_id, disciplina_id, ciclo_item_id, inicio, fim, duracao_seg, tipo (`teoria|questoes|revisao|lei_seca|videoaula|simulado`), pomodoros, anotacoes.
- **questoes_log** — id, sessao_id, assunto_id, total, acertos, erros, em_branco.
- **revisoes** — id, user_id, assunto_id, origem_sessao_id, data_prevista, data_concluida, indice_intervalo, status (`pendente|feita|atrasada`).
- **metas** — id, user_id, tipo (`horas_dia|horas_semana|questoes_dia`), valor.
- **simulados** — id, user_id, concurso_id, nome, data, total, acertos, tempo_min, observacoes.

---

## 4. Funcionalidades (todas obrigatórias)

### 4.1 Onboarding e Edital
- Login/cadastro por e-mail+senha e magic link (Supabase Auth).
- Wizard de 4 passos: dados do concurso → **importar edital** → revisar disciplinas/assuntos → definir carga horária semanal.
- **Leitura do edital:** o usuário pode **colar o texto** do edital, **enviar um PDF** (extrair texto no cliente com `pdfjs-dist`) ou **digitar manualmente**.
  - Um parser reconhece o padrão típico de conteúdo programático brasileiro: `CONHECIMENTOS BÁSICOS / ESPECÍFICOS`, títulos de disciplina em caixa alta, itens numerados (`1.`, `1.1`, `2 –`) e listas separadas por ponto e vírgula.
  - Resultado: árvore editável **Disciplina → Assunto → Subassunto**, com checkbox para incluir/excluir, edição inline, arrastar para reordenar, definir peso da disciplina e marcar **ativa/inativa**.
  - Tela de revisão obrigatória antes de salvar ("confira o que identificamos no edital").
  - Se houver integração de IA disponível no Lovable, use-a como opção "Estruturar com IA"; caso contrário, o parser por regex é o caminho padrão e deve funcionar sozinho.

### 4.2 Ciclo de Estudos
- Gera automaticamente um ciclo baseado **apenas nas disciplinas marcadas como ativas**, distribuindo blocos proporcionalmente a: `peso da disciplina × incidência média dos assuntos × (1 − desempenho atual)`.
- Configurações: carga semanal (h), duração do bloco (30/45/50/60/90 min), evitar duas disciplinas iguais em sequência, priorizar pontos fracos.
- Visualização do ciclo como **lista sequencial de blocos** com barra de progresso circular (% do ciclo concluído), "bloco atual" destacado e botão **Estudar agora**.
- Ações: marcar bloco concluído, pular, adiar, reordenar (drag & drop), reiniciar ciclo ao completar 100% (com histórico das voltas).
- Permitir ciclo manual e múltiplos ciclos por concurso, com apenas um ativo.

### 4.3 Cronômetro / Pomodoro
- Página dedicada com **dois modos**: **Cronômetro livre** (conta progressiva) e **Pomodoro** (foco/pausa curta/pausa longa configuráveis: padrão 25/5/15, ciclo de 4).
- Seleção de disciplina + assunto + tipo de estudo antes de iniciar; pré-preenchido quando vem do bloco do ciclo.
- Timer preciso baseado em timestamp (não em `setInterval` acumulado), **persistente**: continua correto após refresh, troca de aba ou fechar o navegador (estado no `localStorage` + Supabase).
- Controles: iniciar, pausar, retomar, finalizar, descartar. Alerta sonoro opcional, notificação do navegador, modo tela cheia/foco, título da aba mostrando o tempo restante.
- Ao finalizar: modal para registrar **questões resolvidas (total/acertos/erros)**, anotações, marcar assunto como `dominado/revisar` e **agendar revisão automaticamente**.

### 4.4 Revisões (repetição espaçada)
- Ao concluir uma sessão de teoria, criar revisões nos intervalos **1, 7, 15, 30 e 60 dias** (intervalos editáveis nas configurações).
- Página **Revisões** com abas: *Atrasadas*, *Hoje*, *Próximos 7 dias*, *Todas*. Cada item mostra assunto, disciplina, data prevista, quantas vezes já foi revisado.
- Ações: **Revisar agora** (abre o timer em modo revisão), marcar como feita, adiar 1 dia, cancelar.
- Se o desempenho em questões do assunto for < 60%, encurtar o próximo intervalo automaticamente; se > 85%, alongar.

### 4.5 Desempenho, "o que mais cai" e pontos fracos
- Campo **incidência** por assunto (0–5) preenchido manualmente, em massa pela tela de edital, ou inferido pela frequência com que o assunto aparece em simulados/questões registradas.
- Painel **Prioridades** com uma matriz visual: eixo X = incidência, eixo Y = desempenho. Quadrante vermelho = **"cai muito e você vai mal"** (estudar primeiro). Lista ordenada por `score = incidência × (1 − % de acerto) × dias desde o último estudo`.
- Lista **"Precisa revisar"**: assuntos com revisão atrasada, acerto < 60% ou sem estudo há mais de 30 dias.

### 4.6 Dashboard
Cards e gráficos: horas hoje / semana / total; progresso da meta semanal (anel); progresso do ciclo atual; **heatmap de constância** (estilo GitHub, 12 meses); gráfico de barras de horas por disciplina; linha de evolução do % de acerto; contagem regressiva para a data da prova; revisões pendentes; streak de dias estudados; top 5 assuntos prioritários.

### 4.7 Extras
- **Simulados:** registrar nome, data, total, acertos, tempo, observações; gráfico de evolução.
- **Relatórios:** filtro por período/disciplina, exportar CSV e imprimir/PDF.
- **Edital verticalizado:** tabela com disciplina, assunto, status, horas estudadas, questões, % de acerto, última revisão — com filtros e busca.
- **Notas rápidas** por assunto (markdown simples).
- **Command palette (⌘K)** para navegar e iniciar timer.
- **PWA** instalável, com ícone e splash na cor primária.
- Estados vazios ilustrados, skeletons em todo carregamento, toasts de confirmação, confirmação antes de excluir.

---

## 5. Navegação

Sidebar recolhível (shadcn `sidebar`) no desktop e bottom tab bar no mobile:

`Dashboard` · `Ciclo de Estudos` · `Cronômetro` · `Revisões` · `Edital` · `Desempenho` · `Simulados` · `Configurações`

Header com seletor de concurso ativo, toggle de tema, busca ⌘K e avatar.

---

## 6. Regras de qualidade

1. **Nada de mock/placeholder**: todos os dados vêm do Supabase e persistem.
2. Todo formulário com `react-hook-form` + `zod`, mensagens de erro em português.
3. **Idioma: português do Brasil** em toda a interface. Datas `dd/MM/yyyy`, horas no formato `12h30`, decimais com vírgula. Use `date-fns` com locale `ptBR`.
4. Mobile-first e totalmente responsivo; o cronômetro precisa ser confortável no celular.
5. Acessibilidade: foco visível, labels, contraste AA, navegação por teclado.
6. Código organizado: `components/`, `pages/`, `hooks/`, `lib/`, `types/`; lógica de ciclo, pomodoro e repetição espaçada isolada em hooks/utilitários puros e testáveis.
7. Seed opcional com 1 concurso de exemplo para o usuário ver o app preenchido.

---

## 7. Ordem de construção

1. Setup do design system (tokens da paleta vermelha, dark mode, layout com sidebar).
2. Auth + schema do Supabase com RLS.
3. Cadastro de concurso + importação e parsing do edital.
4. Disciplinas/assuntos + edital verticalizado.
5. Gerador de ciclo de estudos.
6. Cronômetro/Pomodoro + registro de sessões.
7. Revisões com repetição espaçada.
8. Dashboard, desempenho e prioridades.
9. Simulados, relatórios, PWA e polimento.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/141847ac-146c-4943-9c61-cdfc6c95e62b).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
