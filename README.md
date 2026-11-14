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

## Endereço da aplicação publicada

🔗 **https://141847ac-146c-4943-9c61-cdfc6c95e62b.lovable.app**

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
