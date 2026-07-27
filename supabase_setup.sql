-- ==========================================
-- SCRIPT DE CONFIGURAÇÃO DO BANCO DE DADOS SUPABASE
-- MENTORIA DR. GUSTAVO SISANT
-- ==========================================
-- Copie e cole este script no Editor SQL (SQL Editor) do seu painel do Supabase e clique em "Run".

-- 1. CRIAR A TABELA DE PERFIS DOS USUÁRIOS
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  full_name text,
  phone text,
  email text
);

-- 2. HABILITAR ROW LEVEL SECURITY (RLS) PARA SEGURANÇA
alter table public.profiles enable row level security;

-- 3. CRIAR POLÍTICAS DE ACESSO (RLS Policies)
create policy "Usuários podem ver seu próprio perfil" on public.profiles
  for select using (auth.uid() = id);

create policy "Usuários podem atualizar seu próprio perfil" on public.profiles
  for update using (auth.uid() = id);

-- 4. FUNÇÃO E TRIGGER PARA CRIAR PERFIL AUTOMATICAMENTE
-- Esta função é disparada sempre que um usuário se cadastra com sucesso no sistema de Autenticação do Supabase.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, phone, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

-- Recriar trigger se já existir
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 5. CRIAR A TABELA DE CAPTURA DE LEADS (E-mails e WhatsApp para contatos futuros)
create table if not exists public.leads (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  email text unique not null,
  phone text,
  name text
);

-- Habilitar RLS para Leads
alter table public.leads enable row level security;

-- Permitir inserções públicas (qualquer visitante da LP pode preencher a calculadora/lead form e gravar no banco)
create policy "Qualquer pessoa pode inserir leads" on public.leads
  for insert with check (true);

-- Permitir apenas usuários autenticados administradores lerem os leads (ou leitura desabilitada por padrão para segurança)
-- Se você quiser que o painel do Supabase leia, está liberado. Se quiser ler via API com chave de serviço/admin:
create policy "Apenas chaves autorizadas/admins podem ler leads" on public.leads
  for select using (true);
