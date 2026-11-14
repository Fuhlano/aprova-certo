# Aprova — Gestão de Estudos para Concursos

Aplicação web completa para quem estuda para concursos públicos no Brasil: transforma o edital em disciplinas e assuntos, gera um ciclo de estudos automático, cronometra sessões (cronômetro livre ou Pomodoro), agenda revisões com repetição espaçada e mostra estatísticas de desempenho.

## A dor escolhida — e por que vale um negócio

Quem estuda para concurso enfrenta um problema de **gestão, não de conteúdo**: o edital tem centenas de tópicos, a prova tem data marcada e o candidato não sabe responder três perguntas simples — *o que estudar hoje, o que revisar amanhã e onde estou fraco*. O resultado é estudo desorganizado, revisão esquecida e sensação permanente de atraso.

Vale um negócio porque:

- **Mercado enorme e recorrente**: milhões de brasileiros prestam concursos todos os anos, e o ciclo de preparação dura meses a anos — retenção natural alta.
- **Dor comprovada**: ferramentas como Gran, Guru da Aprovação e LS Concursos cobram assinatura justamente por organizar ciclo de estudos, revisões e desempenho.
- **Diferenciação possível por nicho**: bancas específicas, carreiras (policiais, fiscais, tribunais) e integração com questões abrem espaço para produtos verticais.

## Tamanho de mercado

- **TAM**: ~12 milhões de candidatos a concursos públicos por ano no Brasil.
- **SAM**: candidatos de concursos federais/estaduais de média e alta remuneração que já pagam por cursos e ferramentas online (~3 milhões).
- **SOM (ano 1)**: 5–10 mil assinantes pagantes a ~R$ 19,90/mês ≈ R$ 1,2–2,4 mi/ano de receita recorrente.

## Business Model Canvas

| Bloco | Descrição |
|---|---|
| **Proposta de valor** | Transformar o edital em um plano de estudos executável: ciclo automático, cronômetro, revisões espaçadas e prioridades por desempenho |
| **Segmento de clientes** | Concurseiros de carreiras administrativas, fiscais, policiais e tribunais |
| **Canais** | Conteúdo orgânico (YouTube/Instagram de estudos), indicação, parcerias com cursinhos |
| **Relacionamento** | Self-service com onboarding guiado; notificações de revisão e streak para hábito diário |
| **Fontes de receita** | Assinatura mensal/anual (freemium: 1 concurso grátis, ciclos ilimitados no pago) |
| **Recursos-chave** | Algoritmo de ciclo ponderado, motor de repetição espaçada, base de dados de desempenho |
| **Atividades-chave** | Aquisição de usuários, melhoria dos algoritmos de priorização, conteúdo educacional |
| **Parcerias-chave** | Cursinhos preparatórios, professores/influencers de concursos |
| **Estrutura de custos** | Infraestrutura (Lovable Cloud), marketing de conteúdo, suporte |

## A tese que o MVP testa

> **Candidatos que recebem um ciclo de estudos gerado automaticamente a partir do próprio edital estudam com mais constância (streak e horas/semana) do que com planilhas manuais.**

O MVP mede: cadastro concluído → edital importado → ciclo gerado → sessões cronometradas por semana → revisões feitas no prazo.

### O que ficou manual de propósito

- **Estruturação do edital por IA**: o parser por regras (padrão brasileiro de editais) é o caminho padrão; a revisão humana da árvore de assuntos é obrigatória antes de salvar. IA entra como melhoria depois de validada a tese.
- **Banco de questões**: o usuário registra total/acertos manualmente após cada sessão. Integração com bancos de questões é custosa e só faz sentido com tração.
- **Correção de simulados**: registro manual de notas, sem importação de gabaritos.

## O mega prompt e as correções posteriores

O app foi construído no Lovable a partir de um único mega prompt especificando: modelo de dados completo (11 tabelas com RLS por usuário), design system (paleta rubi, dark mode, shadcn/ui, Inter, números tabulares), 7 módulos funcionais (onboarding com parser de edital, ciclo de estudos ponderado, cronômetro/Pomodoro persistente, revisões com repetição espaçada 1/7/15/30/60 dias, dashboard com heatmap e streak, desempenho com matriz incidência × acerto, simulados e relatórios CSV/PDF) e regras de qualidade (pt-BR integral, react-hook-form + zod, mobile-first, sem dados mockados).

Correções pedidas depois do prompt inicial:

1. **Cadastro por e-mail desativado no backend** — o primeiro teste de signup retornava "Email signups are disabled"; foi ativado o provedor de e-mail/senha no Lovable Cloud.
2. **Senhas fracas rejeitadas** — a proteção contra senhas vazadas (HIBP) bloqueava senhas de teste óbvias; comportamento mantido por segurança.
3. **Domínios reservados rejeitados** — e-mails de teste em `example.com` são bloqueados pelo backend; testes passaram a usar endereços reais.
4. **Atualização de segurança dos pacotes TanStack** — exigiu ajuste de tipagem no componente de erro da rota raiz.

### PROMPT ÚNICO — App de Gestão de Estudos para Concursos (Lovable)

> Cole este prompt inteiro no Lovable como primeira mensagem do projeto.

---

1. Visão geral

Crie um web app completo, responsivo e 100% funcional chamado "Aprova", para gestão de estudos para concursos públicos no Brasil. O app deve ser construído inteiramente no Lovable (React + Vite + TypeScript + Tailwind + shadcn/ui + Supabase como backend/autenticação/banco).

O usuário é um concurseiro que precisa: cadastrar o edital do concurso, transformar o edital em disciplinas e assuntos, gerar um ciclo de estudos automático com base nas disciplinas ativas, estudar com cronômetro/Pomodoro, registrar desempenho em questões, receber revisões programadas (repetição espaçada) e visualizar estatísticas sobre o que mais cai e o que está fraco.

Referência de experiência: apps brasileiros de organização de estudos como Gran/Guru da Aprovação e LS Concursos — foco em ciclo de estudos por horas, cronômetro, histórico de sessões, revisões e relatórios. Não copie marca, logo ou textos; crie identidade própria.

---

2. Design System e Identidade Visual

- Design system obrigatório: shadcn/ui (Radix + Tailwind). Use os componentes: `button`, `card`, `dialog`, `sheet`, `drawer`, `tabs`, `table`, `form`, `input`, `select`, `combobox`, `checkbox`, `switch`, `slider`, `progress`, `badge`, `avatar`, `tooltip`, `popover`, `dropdown-menu`, `command` (⌘K), `calendar`, `sonner` (toasts), `skeleton`, `alert-dialog`, `accordion`, `scroll-area`, `separator`, `chart` (Recharts).
- Ícones: `lucide-react`. Gráficos: Recharts via `shadcn/chart`. Animações: `framer-motion` discretas.
- Tipografia: Inter (UI) + números tabulares para métricas e cronômetro (`font-variant-numeric: tabular-nums`).
- Estilo: moderno, limpo, muito espaço em branco, cards com `rounded-2xl`, sombras suaves, bordas sutis. Nada de gradientes berrantes. Dark mode completo via `next-themes`.

Paleta (vermelho como cor primária)

Vermelho rubi/carmim como primária, apoiado por neutros quentes (stone) e cores semânticas dessaturadas para não competir com o vermelho.

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

Implemente todas essas cores como variáveis HSL em `index.css` (`--primary`, `--accent`, etc.) e mapeie no `tailwind.config.ts`, para que os componentes shadcn herdem automaticamente. Gráficos usam `--chart-1..5` derivados do vermelho + neutros.

---

3. Modelo de dados (Supabase / Postgres)

Crie as tabelas com RLS por `user_id` (todo registro pertence ao usuário autenticado):

- profiles — id, nome, avatar_url, meta_horas_semanais, timezone.
- concursos — id, user_id, nome, banca, orgao, cargo, data_prova, status (`planejado|ativo|concluido`), edital_texto, edital_arquivo_url.
- disciplinas — id, concurso_id, nome, peso (1–5), ativa (bool), cor, ordem.
- assuntos — id, disciplina_id, nome, nivel (subtópico via `parent_id`), status (`nao_iniciado|estudando|revisar|dominado`), incidencia (0–5, "quanto cai"), confianca (0–5), ordem.
- ciclos — id, concurso_id, nome, carga_semanal_horas, duracao_bloco_min, ativo, criado_em.
- ciclo_itens — id, ciclo_id, disciplina_id, blocos_previstos, blocos_concluidos, ordem.
- sessoes — id, user_id, assunto_id, disciplina_id, ciclo_item_id, inicio, fim, duracao_seg, tipo (`teoria|questoes|revisao|lei_seca|videoaula|simulado`), pomodoros, anotacoes.
- questoes_log — id, sessao_id, assunto_id, total, acertos, erros, em_branco.
- revisoes — id, user_id, assunto_id, origem_sessao_id, data_prevista, data_concluida, indice_intervalo, status (`pendente|feita|atrasada`).
- metas — id, user_id, tipo (`horas_dia|horas_semana|questoes_dia`), valor.
- simulados — id, user_id, concurso_id, nome, data, total, acertos, tempo_min, observacoes.

---

4. Funcionalidades (todas obrigatórias)

4.1 Onboarding e Edital
- Login/cadastro por e-mail+senha e magic link (Supabase Auth).
- Wizard de 4 passos: dados do concurso → importar edital → revisar disciplinas/assuntos → definir carga horária semanal.
- Leitura do edital: o usuário pode colar o texto do edital, enviar um PDF (extrair texto no cliente com `pdfjs-dist`) ou digitar manualmente.
  - Um parser reconhece o padrão típico de conteúdo programático brasileiro: `CONHECIMENTOS BÁSICOS / ESPECÍFICOS`, títulos de disciplina em caixa alta, itens numerados (`1.`, `1.1`, `2 –`) e listas separadas por ponto e vírgula.
  - Resultado: árvore editável Disciplina → Assunto → Subassunto, com checkbox para incluir/excluir, edição inline, arrastar para reordenar, definir peso da disciplina e marcar ativa/inativa.
  - Tela de revisão obrigatória antes de salvar ("confira o que identificamos no edital").
  - Se houver integração de IA disponível no Lovable, use-a como opção "Estruturar com IA"; caso contrário, o parser por regex é o caminho padrão e deve funcionar sozinho.

4.2 Ciclo de Estudos
- Gera automaticamente um ciclo baseado apenas nas disciplinas marcadas como ativas, distribuindo blocos proporcionalmente a: `peso da disciplina × incidência média dos assuntos × (1 − desempenho atual)`.
- Configurações: carga semanal (h), duração do bloco (30/45/50/60/90 min), evitar duas disciplinas iguais em sequência, priorizar pontos fracos.
- Visualização do ciclo como lista sequencial de blocos com barra de progresso circular (% do ciclo concluído), "bloco atual" destacado e botão Estudar agora.
- Ações: marcar bloco concluído, pular, adiar, reordenar (drag & drop), reiniciar ciclo ao completar 100% (com histórico das voltas).
- Permitir ciclo manual e múltiplos ciclos por concurso, com apenas um ativo.

4.3 Cronômetro / Pomodoro
- Página dedicada com dois modos: Cronômetro livre (conta progressiva) e Pomodoro (foco/pausa curta/pausa longa configuráveis: padrão 25/5/15, ciclo de 4).
- Seleção de disciplina + assunto + tipo de estudo antes de iniciar; pré-preenchido quando vem do bloco do ciclo.
- Timer preciso baseado em timestamp (não em `setInterval` acumulado), persistente: continua correto após refresh, troca de aba ou fechar o navegador (estado no `localStorage` + Supabase).
- Controles: iniciar, pausar, retomar, finalizar, descartar. Alerta sonoro opcional, notificação do navegador, modo tela cheia/foco, título da aba mostrando o tempo restante.
- Ao finalizar: modal para registrar questões resolvidas (total/acertos/erros), anotações, marcar assunto como `dominado/revisar` e agendar revisão automaticamente.

4.4 Revisões (repetição espaçada)
- Ao concluir uma sessão de teoria, criar revisões nos intervalos 1, 7, 15, 30 e 60 dias (intervalos editáveis nas configurações).
- Página Revisões com abas: Atrasadas, Hoje, Próximos 7 dias, Todas. Cada item mostra assunto, disciplina, data prevista, quantas vezes já foi revisado.
- Ações: Revisar agora (abre o timer em modo revisão), marcar como feita, adiar 1 dia, cancelar.
- Se o desempenho em questões do assunto for < 60%, encurtar o próximo intervalo automaticamente; se > 85%, alongar.

4.5 Desempenho, "o que mais cai" e pontos fracos
- Campo incidência por assunto (0–5) preenchido manualmente, em massa pela tela de edital, ou inferido pela frequência com que o assunto aparece em simulados/questões registradas.
- Painel Prioridades com uma matriz visual: eixo X = incidência, eixo Y = desempenho. Quadrante vermelho = "cai muito e você vai mal" (estudar primeiro). Lista ordenada por `score = incidência × (1 − % de acerto) × dias desde o último estudo`.
- Lista "Precisa revisar": assuntos com revisão atrasada, acerto < 60% ou sem estudo há mais de 30 dias.

4.6 Dashboard
Cards e gráficos: horas hoje / semana / total; progresso da meta semanal (anel); progresso do ciclo atual; heatmap de constância (estilo GitHub, 12 meses); gráfico de barras de horas por disciplina; linha de evolução do % de acerto; contagem regressiva para a data da prova; revisões pendentes; streak de dias estudados; top 5 assuntos prioritários.

4.7 Extras
- Simulados: registrar nome, data, total, acertos, tempo, observações; gráfico de evolução.
- Relatórios: filtro por período/disciplina, exportar CSV e imprimir/PDF.
- Edital verticalizado: tabela com disciplina, assunto, status, horas estudadas, questões, % de acerto, última revisão — com filtros e busca.
- Notas rápidas por assunto (markdown simples).
- Command palette (⌘K) para navegar e iniciar timer.
- PWA instalável, com ícone e splash na cor primária.
- Estados vazios ilustrados, skeletons em todo carregamento, toasts de confirmação, confirmação antes de excluir.

---

5. Navegação

Sidebar recolhível (shadcn `sidebar`) no desktop e bottom tab bar no mobile:

`Dashboard` · `Ciclo de Estudos` · `Cronômetro` · `Revisões` · `Edital` · `Desempenho` · `Simulados` · `Configurações`

Header com seletor de concurso ativo, toggle de tema, busca ⌘K e avatar.

---

6. Regras de qualidade

1. Nada de mock/placeholder: todos os dados vêm do Supabase e persistem.
2. Todo formulário com `react-hook-form` + `zod`, mensagens de erro em português.
3. Idioma: português do Brasil em toda a interface. Datas `dd/MM/yyyy`, horas no formato `12h30`, decimais com vírgula. Use `date-fns` com locale `ptBR`.
4. Mobile-first e totalmente responsivo; o cronômetro precisa ser confortável no celular.
5. Acessibilidade: foco visível, labels, contraste AA, navegação por teclado.
6. Código organizado: `components/`, `pages/`, `hooks/`, `lib/`, `types/`; lógica de ciclo, pomodoro e repetição espaçada isolada em hooks/utilitários puros e testáveis.
7. Seed opcional com 1 concurso de exemplo para o usuário ver o app preenchido.

---

7. Ordem de construção

1. Setup do design system (tokens da paleta vermelha, dark mode, layout com sidebar).
2. Auth + schema do Supabase com RLS.
3. Cadastro de concurso + importação e parsing do edital.
4. Disciplinas/assuntos + edital verticalizado.
5. Gerador de ciclo de estudos.
6. Cronômetro/Pomodoro + registro de sessões.
7. Revisões com repetição espaçada.
8. Dashboard, desempenho e prioridades.
9. Simulados, relatórios, PWA e polimento.


## Endereço da aplicação publicada

🔗 **https://aprova-study-cycle.lovable.app**

## Telas

- **Dashboard**: horas hoje/semana/total, anel de meta semanal, streak, contagem regressiva para a prova, heatmap de constância (12 meses), horas por disciplina, evolução do % de acerto, top 5 prioridades.
- **Ciclo de Estudos**: blocos gerados por `peso × incidência × (1 − desempenho)`, progresso circular, bloco atual destacado, reordenar/pular/adiar, reinício automático com histórico de voltas.
- **Cronômetro**: modo livre e Pomodoro (25/5/15 configurável), persistente entre abas e refresh, título da aba com o tempo, registro de questões e anotações ao finalizar.
- **Revisões**: abas Atrasadas/Hoje/7 dias/Todas, intervalos encurtados quando o acerto é < 60% e alongados quando > 85%.
- **Edital verticalizado**: tabela com status, horas, questões, % de acerto e última revisão por assunto, com busca, filtros e anotações em markdown.
- **Desempenho**: matriz incidência × desempenho com quadrante "cai muito e você vai mal" e lista "Precisa revisar".
- **Simulados e Relatórios**: evolução em gráfico, filtros por período/disciplina, exportação CSV e impressão.

## Stack

React 19 · TanStack Start · TypeScript · Tailwind CSS v4 · shadcn/ui · Recharts · framer-motion · Lovable Cloud (Postgres + Auth com RLS) · pdfjs-dist · date-fns (pt-BR)

## Segurança

- Nenhuma chave, token ou senha versionada: apenas a chave **pública** (publishable) do backend aparece no código, o que é seguro por design — o acesso aos dados é controlado por Row Level Security por usuário.
- Senhas verificadas contra base de vazamentos (HIBP) no cadastro.
