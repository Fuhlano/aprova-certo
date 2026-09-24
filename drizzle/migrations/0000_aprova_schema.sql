-- PROFILES
create table public.profiles (
  id uuid primary key,
  nome text,
  avatar_url text,
  meta_horas_semanais numeric not null default 20,
  timezone text not null default 'America/Sao_Paulo',
  intervalos_revisao int[] not null default '{1,7,15,30,60}',
  criado_em timestamptz not null default now()
);
grant select, insert, update, delete on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "profiles_own" on public.profiles for all to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, nome)
  values (new.id, coalesce(new.raw_user_meta_data->>'nome', new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)))
  on conflict (id) do nothing;
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- CONCURSOS
create table public.concursos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  nome text not null,
  banca text,
  orgao text,
  cargo text,
  data_prova date,
  status text not null default 'ativo' check (status in ('planejado','ativo','concluido')),
  edital_texto text,
  edital_arquivo_url text,
  criado_em timestamptz not null default now()
);
grant select, insert, update, delete on public.concursos to authenticated;
grant all on public.concursos to service_role;
alter table public.concursos enable row level security;
create policy "concursos_own" on public.concursos for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- DISCIPLINAS
create table public.disciplinas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  concurso_id uuid not null references public.concursos(id) on delete cascade,
  nome text not null,
  peso int not null default 3 check (peso between 1 and 5),
  ativa boolean not null default true,
  cor text,
  ordem int not null default 0
);
grant select, insert, update, delete on public.disciplinas to authenticated;
grant all on public.disciplinas to service_role;
alter table public.disciplinas enable row level security;
create policy "disciplinas_own" on public.disciplinas for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ASSUNTOS
create table public.assuntos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  disciplina_id uuid not null references public.disciplinas(id) on delete cascade,
  parent_id uuid references public.assuntos(id) on delete cascade,
  nome text not null,
  status text not null default 'nao_iniciado' check (status in ('nao_iniciado','estudando','revisar','dominado')),
  incidencia int not null default 3 check (incidencia between 0 and 5),
  confianca int not null default 0 check (confianca between 0 and 5),
  ordem int not null default 0
);
grant select, insert, update, delete on public.assuntos to authenticated;
grant all on public.assuntos to service_role;
alter table public.assuntos enable row level security;
create policy "assuntos_own" on public.assuntos for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- CICLOS
create table public.ciclos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  concurso_id uuid not null references public.concursos(id) on delete cascade,
  nome text not null default 'Ciclo 1',
  carga_semanal_horas numeric not null default 20,
  duracao_bloco_min int not null default 50,
  voltas int not null default 0,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);
grant select, insert, update, delete on public.ciclos to authenticated;
grant all on public.ciclos to service_role;
alter table public.ciclos enable row level security;
create policy "ciclos_own" on public.ciclos for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- CICLO ITENS
create table public.ciclo_itens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  ciclo_id uuid not null references public.ciclos(id) on delete cascade,
  disciplina_id uuid not null references public.disciplinas(id) on delete cascade,
  blocos_previstos int not null default 1,
  blocos_concluidos int not null default 0,
  ordem int not null default 0
);
grant select, insert, update, delete on public.ciclo_itens to authenticated;
grant all on public.ciclo_itens to service_role;
alter table public.ciclo_itens enable row level security;
create policy "ciclo_itens_own" on public.ciclo_itens for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- SESSOES
create table public.sessoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  concurso_id uuid references public.concursos(id) on delete set null,
  assunto_id uuid references public.assuntos(id) on delete set null,
  disciplina_id uuid references public.disciplinas(id) on delete set null,
  ciclo_item_id uuid references public.ciclo_itens(id) on delete set null,
  inicio timestamptz not null default now(),
  fim timestamptz,
  duracao_seg int not null default 0,
  tipo text not null default 'teoria' check (tipo in ('teoria','questoes','revisao','lei_seca','videoaula','simulado')),
  pomodoros int not null default 0,
  anotacoes text
);
grant select, insert, update, delete on public.sessoes to authenticated;
grant all on public.sessoes to service_role;
alter table public.sessoes enable row level security;
create policy "sessoes_own" on public.sessoes for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- QUESTOES LOG
create table public.questoes_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  sessao_id uuid references public.sessoes(id) on delete cascade,
  assunto_id uuid references public.assuntos(id) on delete set null,
  total int not null default 0,
  acertos int not null default 0,
  erros int not null default 0,
  em_branco int not null default 0,
  criado_em timestamptz not null default now()
);
grant select, insert, update, delete on public.questoes_log to authenticated;
grant all on public.questoes_log to service_role;
alter table public.questoes_log enable row level security;
create policy "questoes_log_own" on public.questoes_log for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- REVISOES
create table public.revisoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  assunto_id uuid not null references public.assuntos(id) on delete cascade,
  origem_sessao_id uuid references public.sessoes(id) on delete set null,
  data_prevista date not null,
  data_concluida date,
  indice_intervalo int not null default 0,
  status text not null default 'pendente' check (status in ('pendente','feita','cancelada'))
);
grant select, insert, update, delete on public.revisoes to authenticated;
grant all on public.revisoes to service_role;
alter table public.revisoes enable row level security;
create policy "revisoes_own" on public.revisoes for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- METAS
create table public.metas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  tipo text not null check (tipo in ('horas_dia','horas_semana','questoes_dia')),
  valor numeric not null default 0,
  unique (user_id, tipo)
);
grant select, insert, update, delete on public.metas to authenticated;
grant all on public.metas to service_role;
alter table public.metas enable row level security;
create policy "metas_own" on public.metas for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- SIMULADOS
create table public.simulados (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  concurso_id uuid references public.concursos(id) on delete cascade,
  nome text not null,
  data date not null default current_date,
  total int not null default 0,
  acertos int not null default 0,
  tempo_min int not null default 0,
  observacoes text
);
grant select, insert, update, delete on public.simulados to authenticated;
grant all on public.simulados to service_role;
alter table public.simulados enable row level security;
create policy "simulados_own" on public.simulados for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- NOTAS
create table public.notas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  assunto_id uuid not null references public.assuntos(id) on delete cascade,
  conteudo text not null default '',
  atualizado_em timestamptz not null default now()
);
grant select, insert, update, delete on public.notas to authenticated;
grant all on public.notas to service_role;
alter table public.notas enable row level security;
create policy "notas_own" on public.notas for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index on public.disciplinas (concurso_id);
create index on public.assuntos (disciplina_id);
create index on public.sessoes (user_id, inicio);
create index on public.revisoes (user_id, data_prevista);
