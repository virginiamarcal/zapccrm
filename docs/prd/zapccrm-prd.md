# ZapCRM Product Requirements Document (PRD)

## Goals and Background Context

### Goals

- Criar uma plataforma SaaS multi-tenant que unifique WhatsApp + CRM em um único painel
- Permitir automação bidirecional entre conversas WhatsApp e deals do CRM
- Fornecer inbox unificado onde agentes visualizam WhatsApp + contexto CRM simultaneamente
- Implementar AI-driven automation para qualificação de leads, sugestões de resposta e decisões de vendas
- Monetizar via planos diferenciados (Starter, Growth, Business) com metering por mensagem
- Atingir 10k organizações e 1M mensagens/mês em 12 meses

### Background Context

O mercado brasileiro de PMEs carece de uma solução integrada que conecte o principal canal de comunicação (WhatsApp) ao gerenciamento de vendas. Empresas usam planilhas, WhatsApp Business isolado e CRMs desconectados, perdendo contexto e eficiência.

Duas plataformas existentes resolvem partes do problema:
- **SmartZap**: Automação WhatsApp robusta (Meta Cloud API, flow builder, campanhas, AI agents)
- **NossoCRM**: CRM moderno com pipeline Kanban, AI-first, webhooks, API pública

**Solução:** Unificar ambas em um SaaS único (ZapCRM) que oferece:
1. Comunicação WhatsApp nativa integrada ao CRM
2. Sincronização bidirecional (contato ↔ deal, mensagem ↔ atividade)
3. Automações cross-platform (pipeline stage → WhatsApp action)
4. Inbox unificado com contexto completo do cliente
5. Billing SaaS com crescimento previsível

### Change Log

| Data | Versão | Descrição | Autor |
|------|--------|-----------|-------|
| 2026-02-28 | 1.0 | PRD inicial unificado (SmartZap + NossoCRM) | Morgan (@pm) |

---

## Requirements

### Functional Requirements

**FR1:** Criar organização multi-tenant com isolamento total via `organization_id` e RLS policies

**FR2:** Integração completa com Meta WhatsApp Cloud API v24.0 para envio/recebimento de mensagens

**FR3:** Auto-sincronização de contatos WhatsApp → CRM (criação automática, merge de duplicados)

**FR4:** Conversão de conversa WhatsApp em Activity timeline unificada no CRM

**FR5:** Criação automática de Lead/Deal a partir de mensagem WhatsApp com keyword matching

**FR6:** Bridge layer de sincronização bidirecional com event-driven architecture (Supabase Realtime)

**FR7:** Inbox unificado mostrando WhatsApp + contexto CRM (deal, contato, histórico) na mesma tela

**FR8:** Quick actions (responder, transferir, criar tarefa) direto do card de conversa

**FR9:** Flow builder do SmartZap integrado ao pipeline do CRM (disparar automações ao mudar stage)

**FR10:** AI reply suggestion baseada em contexto do deal (Anthropic, OpenAI, Gemini)

**FR11:** Pipeline Kanban com stages configuráveis, metas por board, KPIs agregados

**FR12:** Templates de mensagem WhatsApp (aprovados Meta) com parâmetros por deal

**FR13:** Relatórios de performance (taxa de resposta, tempo médio, taxa de conversão)

**FR14:** API pública versionada (`/api/public/v1/`) com autenticação por API Key

**FR15:** Webhooks outbound para notificar sistemas externos em mudanças de stage/contato

**FR16:** Sistema de planos Stripe com metering (mensagens enviadas, contatos ativos, flows)

**FR17:** Trial gratuito de 14 dias com cancelamento automático

**FR18:** Onboarding wizard: setup Meta token, importação de contatos, templates pré-configurados

**FR19:** Audit logs completo (quem, o quê, quando, de onde) com alertas de segurança

**FR20:** RLS policies garantindo isolamento 100% por organização

### Non-Functional Requirements

**NFR1:** Latência webhook WhatsApp → CRM: < 2 segundos

**NFR2:** Disponibilidade: 99.9% (máximo 43 minutos/mês de downtime)

**NFR3:** Segurança: OWASP Top 10 compliance, LGPD data protection, HTTPS only

**NFR4:** Escalabilidade: 10k organizações simultâneas, 1M mensagens/mês, 100k conversas em paralelo

**NFR5:** Isolamento de dados: 100% via RLS + validação em camada de aplicação

**NFR6:** Performance: Dashboard carrega em < 3 segundos, inbox realtime < 500ms

**NFR7:** Redundância de filas: Upstash QStash com retry automático (max 3 tentativas, backoff exponencial)

**NFR8:** Backup diário do Supabase com retenção mínima de 30 dias

**NFR9:** Compatibilidade: Web Responsive (desktop + mobile), Safari/Chrome/Firefox/Edge suportados

**NFR10:** Conformidade: GDPR, LGPD, PCI-DSS (se processando pagamentos via Stripe)

---

## User Interface Design Goals

### Overall UX Vision

Interface clean e intuitiva focada em produtividade da equipe de vendas/suporte. Painel unificado onde o agente acessa WhatsApp, contexto do cliente, pipeline e atividades sem alternar abas. Design mobile-first para atendentes em movimento. Dark mode opcional.

### Key Interaction Paradigms

- **Inbox-centric:** Lista de conversas com status (novo, respondido, aguardando, fechado)
- **Contextual sidebar:** Card do contato + deal + histórico de atividades ao lado da conversa
- **Drag-and-drop Kanban:** Pipeline visual com stages, mover deal entre colunas
- **Quick actions:** Botões flutuantes para responder, transferir, criar tarefa
- **Real-time updates:** Conversas, deals e atividades atualizando sem refresh
- **Smart search:** Busca por contato, deal, conversa com autocomplete

### Core Screens and Views

1. **Dashboard** — KPIs (mensagens recebidas, taxa de resposta, pipeline value, conversões)
2. **Inbox** — Lista de conversas WhatsApp com sidebar de contexto CRM
3. **Pipeline/Boards** — Kanban com stages, metas, deals e quick-actions
4. **Contacts** — Lista/detalhes de contatos com histórico de conversas + deals
5. **Reports** — Gráficos de performance (tempo resposta, taxa conversão, ROI por campanha)
6. **Flows** — Builder visual de automações (trigger → ações)
7. **Templates** — Gerenciamento de templates de mensagem WhatsApp
8. **Settings** — Configuração de team, organizacão, integrações, billing
9. **Wizard de Setup** — Primeiros passos (Meta token, importação, templates iniciais)

### Accessibility: WCAG AA

Todos os componentes seguem WCAG 2.1 Level AA:
- Contrast ratio >= 4.5:1 para texto
- Teclado navegável (Tab, Enter, Escape)
- Labels explícitas em formulários
- Alt text em imagens
- Aria attributes onde necessário

### Branding

Identidade visual moderna e profissional:
- Paleta: Verde primário (brand color CRM) + cinzas neutros
- Tipografia: Fontes sans-serif (Inter ou Geist para familiaridade com SmartZap)
- Iconografia: Lucide React (consistente com SmartZap)
- Componentes: shadcn/ui + Tailwind CSS (reutilizar padrão existente)

### Target Device and Platforms: Web Responsive

Desktop (1920x1080+) + Tablet (iPad, Samsung Tab) + Mobile (iPhone, Android). Responsivo em todas as breakpoints, com layouts específicos para mobile (stack vertical, botões maiores).

---

## Technical Assumptions

### Repository Structure: Monorepo

Monorepo único Next.js para frontend + backend (API Routes). Vantagens:
- Reutilização de tipos TypeScript entre frontend e API
- Deploy atomático (versão única)
- Menor complexidade operacional vs microservices
- Reduz coordenação entre repos

Estrutura:
```
zapccrm/
├── app/              # Next.js App Router (páginas + API)
├── components/       # Componentes React compartilhados
├── lib/              # Lógica compartilhada (DB, integração, utils)
├── hooks/            # Custom hooks
├── types/            # TypeScript types
├── supabase/         # Migrations e RLS policies
├── public/           # Assets estáticos
└── docs/             # Documentação (PRD, arquitetura, specs)
```

### Service Architecture: Monolith + Async Workers

**Aplicação principal:** Next.js monolítico no Vercel (serverless functions escalando automaticamente).

**Processamento assíncrono:** Upstash QStash para:
- Envio de campanhas (durable steps com retry)
- Sincronização de contatos (batch processing)
- Webhooks outbound (com retry exponencial)
- Processamento de IA (decisões, summarization)

**Justificativa:** Monolith reduz overhead operacional para MVP. QStash fornece garantias de delivery sem gerenciar infraestrutura própria.

### Testing Requirements: Full Testing Pyramid

- **Unit tests:** Todos os services, utils, funções críticas (Vitest)
- **Integration tests:** APIs com mocks de Supabase (Vitest + mocks)
- **E2E tests:** Fluxos críticos (Playwright): login, criar deal, enviar mensagem, onboarding
- **Manual QA:** Cada epic passa por QA gate antes de merge
- **CodeRabbit:** Scans automáticos em PRs (CRITICAL bloqueante, HIGH auto-fix até 2 iterações)

### Additional Technical Assumptions and Requests

**Banco de dados:** Supabase PostgreSQL (managed). Reutilizar schemas de SmartZap + NossoCRM, migrar para multi-tenant.

**Autenticação:** Supabase Auth (email/magic link) com invite flow para equipes.

**Cache:** Upstash Redis (TTL 60s para settings, cache de IA responses).

**WhatsApp:** Meta Cloud API v24.0 somente (não usar Baileys por compliance).

**Billing:** Stripe (subscriptions + usage metering).

**Deploy:** Vercel (git push → auto-deploy, preview branches).

**Observabilidade:** Vercel Analytics + Sentry (error tracking).

**Email:** SendGrid ou Resend para transacionais + marketing.

**Storage:** Supabase Storage (avatares, audio notes, arquivos de deal).

---

## Epic List

Sequência lógica de 6 epics, cada um entregando valor testável:

1. **Epic 1: Fundação Multi-Tenant (2 sprints)** — Migrar schema para multi-tenant, RLS, auth por org, super admin
2. **Epic 2: Integração WhatsApp↔CRM (2 sprints)** — Bridge layer, sincronização de contatos, conversas, deals
3. **Epic 3: Inbox Unificado (2 sprints)** — UI do inbox, quick actions, contexto sidebar, realtime updates
4. **Epic 4: Automações Cross-Platform (2 sprints)** — Flow builder, triggers CRM→WhatsApp, AI suggestions
5. **Epic 5: Billing e Monetização (2 sprints)** — Stripe integration, metering, planos, trial
6. **Epic 6: Onboarding e Self-Service (2 sprints)** — Wizard Meta, importação, templates iniciais, tutoriais

---

## Epic 1: Fundação Multi-Tenant

**Objetivo:** Transformar aplicação single-tenant em multi-tenant SaaS real. Resultado: Múltiplas organizações compartilhando instância com isolamento total via `organization_id` + RLS policies.

### Story 1.1: Schema Multi-Tenant Foundations

**Como um** administrador de sistema,
**Quero** migrar o schema do Supabase para suportar múltiplas organizações,
**Para que** cada empresa tenha seus dados completamente isolados.

**Acceptance Criteria:**

1. Tabela `organizations` criada com campos: `id`, `name`, `slug`, `created_at`, `owner_id`
2. Todas as 38 tabelas atualizadas com coluna `organization_id` (not null)
3. Migration Supabase criada e testada em staging
4. Rollback plan documentado (migration reversa)
5. Dados existentes migrados com `organization_id = uuid nilád` (super admin org)
6. Nenhum erro de constraint durante migration

---

### Story 1.2: RLS Policies Complete

**Como um** desenvolvedor,
**Quero** implementar RLS policies em todas as tabelas,
**Para que** usuários só acessem dados de sua organização.

**Acceptance Criteria:**

1. RLS habilitado em 38 tabelas
2. SELECT policy: `auth.uid() in (select user_id from org_members where org_id = organization_id)`
3. INSERT/UPDATE/DELETE: idem, se usuario é `admin` ou `owner` da org
4. Testes: Tentar acessar dado de outra org retorna erro 403
5. TRUNCATE/DELETE table bloqueado para todos (apenas `service_role`)
6. Funções PL/pgSQL marcadas com `SECURITY DEFINER` e audit logging

---

### Story 1.3: Multi-Org Auth e Invite System

**Como um** owner,
**Quero** convidar membros do team via email,
**Para que** possam acessar os dados da organização com roles específicas.

**Acceptance Criteria:**

1. Endpoint `/api/auth/invite` cria token com expiracao 7 dias
2. Email enviado com link `/join?token={token}`
3. Page `/join` valida token e cria usuário + org_member com role (admin/member/viewer)
4. Supabase Auth cria user, org_members cria relação
5. Usuário logado vê dropdown de organizações (se member de múltiplas)
6. Página `/settings/team` mostra membros, roles, opção de remover

---

### Story 1.4: Tenant Detection Middleware

**Como um** usuário,
**Quero** acessar minha organização automaticamente ao logar,
**Para que** não precise selecionar manualmente.

**Acceptance Criteria:**

1. Middleware em `lib/middleware.ts` detecta `org_id` de:
   - Header `X-Organization-ID` (API calls)
   - Cookie `org_id` (web)
   - Query param `?org={slug}` (URLs)
2. Middleware valida que usuário é membro da org
3. Redirection automática se org_id inválido
4. Teste: API call sem org header retorna 400
5. Teste: User acessando org diferente retorna 403

---

### Story 1.5: Super Admin Dashboard

**Como um** super admin (Thales),
**Quero** visualizar todas as organizações, usuários e métricas,
**Para que** possa debugar problemas e monitorar saúde do SaaS.

**Acceptance Criteria:**

1. Page `/admin/dashboard` mostra:
   - Total de orgs, usuários, mensagens (último mês)
   - Gráfico de atividade (msgs/dia)
   - Lista de orgs com sorting por data, atividade
2. Cada org clicável → dashboard interno (simulando usuário da org)
3. Botão "Impersonate" para logar como membro de uma org (debugging)
4. Audit log de todas as ações super admin
5. Restrito a usuários com `is_super_admin = true`

---

## Epic 2: Integração WhatsApp↔CRM

**Objetivo:** Criar bridge que sincroniza dados entre SmartZap e NossoCRM. Resultado: Contato WhatsApp ↔ Contact CRM, Conversa WhatsApp ↔ Activity CRM, mensagens disparam automações no pipeline.

### Story 2.1: Bridge Service Architecture

**Como um** arquiteto,
**Quero** implementar o bridge layer com event-driven sync,
**Para que** dados fluam automaticamente entre WhatsApp e CRM sem polling.

**Acceptance Criteria:**

1. Novo serviço `lib/bridge/sync-service.ts` com 3 componentes:
   - `WhatsAppEventListener`: escuta webhooks WhatsApp
   - `CRMSyncEngine`: sincroniza dados para CRM
   - `BidirectionalTrigger`: dispara ações reverse (CRM → WhatsApp)
2. Usa Supabase Realtime para subscribers em vez de polling
3. Testes unitários para cada componente
4. Logging detalhado (cada sync operação)
5. Error handling com retry (max 3, backoff exponencial)

---

### Story 2.2: Contato WhatsApp → Contact CRM (Auto-Criação + Merge)

**Como um** agente de vendas,
**Quero** que contatos WhatsApp apareçam automaticamente no CRM,
**Para que** eu tenha histórico completo sem criar manualmente.

**Acceptance Criteria:**

1. Webhook WhatsApp recebe novo contato (`from` field)
2. Verifica se contact existe (phone E.164 match ou email)
3. Se não existe: cria contact com nome (se disponível), phone, inicializa org_id
4. Se existe: merge — atualiza last_contact_date, adiciona tags `whatsapp_active`
5. Contato criado dispara evento `contact.created` para listeners
6. Testes: novo contato da Whatsapp cria contact CRM, contato existente merges corretamente

---

### Story 2.3: Conversa WhatsApp → Activity CRM (Timeline Unificada)

**Como um** gerente,
**Quero** ver todas as interações (WhatsApp, email, ligações) no histórico do contato,
**Para que** tenha visão 360° do cliente.

**Acceptance Criteria:**

1. Cada mensagem WhatsApp cria Activity com:
   - `activity_type = 'whatsapp_message'`
   - `contact_id` (linkeado ao contact CRM)
   - `content` (corpo da mensagem)
   - `direction` (inbound/outbound)
   - `created_at` (timestamp WhatsApp)
2. Activity visível em timeline do contact (ordenado por created_at)
3. Contadores atualizados (total mensagens, status lido/não lido)
4. Testes: 10 mensagens WhatsApp geram 10 activities CRM

---

### Story 2.4: Deal Creation via WhatsApp (Keyword Trigger)

**Como um** SDR,
**Quero** que uma mensagem WhatsApp com keyword específica crie automaticamente um deal,
**Para que** eu não perca leads qualificados.

**Acceptance Criteria:**

1. Admin pode configurar keywords por org (ex: "quero orçamento", "preciso de demo")
2. Função PL/pgSQL `process_inbound_message` verifica keywords
3. Se match: cria Deal com:
   - `contact_id` (do contato WhatsApp)
   - `board_id` (padrão "Web Leads")
   - `stage_id` (primeiro stage "Novo")
   - `name` (auto-gerado: "Lead from WhatsApp - [data]")
   - `deal_value` (default null, preenchem depois)
4. Deal criado dispara notificação para assign (Slack, email)
5. Testes: mensagem com keyword cria deal, sem keyword não cria

---

### Story 2.5: Pipeline Stage → WhatsApp Auto-Action

**Como um** vendedor,
**Quero** que mover um deal para stage "Proposta Enviada" envie automaticamente uma mensagem WhatsApp,
**Para que** o cliente saiba que a proposta chegou.

**Acceptance Criteria:**

1. Admin configura triggers em `/settings/automations`:
   - Evento: "Stage changed to [stage]"
   - Ação: "Send WhatsApp message" ou "Send template"
   - Seletor de template (com preview)
2. Quando deal muda de stage:
   - Funcão PL/pgSQL `on_deal_stage_change()` dispara
   - Lookup trigger configurado
   - Se existe: enqueue em QStash para envio
3. Mensagem sent com status tracking (sent/delivered/read)
4. Testes: move deal → mensagem enviada com 2s de latência

---

## Epic 3: Inbox Unificado

**Objetivo:** Criar UI central onde agente vê WhatsApp + contexto CRM (contact, deal, histórico) simultaneamente. Resultado: Inbox que substitui WhatsApp Business + CRM web.

### Story 3.1: Layout Inbox + Sidebar Contexto

**Como um** atendente,
**Quero** ver conversa WhatsApp + card de contato + card de deal na mesma tela,
**Para que** tenha todo contexto sem trocar de aba.

**Acceptance Criteria:**

1. Layout 3 colunas (60% + 40%):
   - Coluna 1: Lista de conversas (inbox)
   - Coluna 2: Conversa selecionada (mensagens)
   - Coluna 3: Sidebar com contact card + deal card + activity feed
2. Contact card mostra: nome, phone, email, tags, total mensagens
3. Deal card mostra: nome, stage, valor, probability, last update
4. Activity feed: últimas 5 atividades (mensagens, calls, tasks)
5. Sidebar scrollable (overflow: auto)
6. Mobile: stack vertical (inbox → conversa → sidebar em abas)
7. Realtime: nova mensagem adiciona à lista, atividade aparece no feed sem refresh

---

### Story 3.2: Quick Actions na Conversa

**Como um** vendedor em movimento,
**Quero** enviar resposta, transferir conversa ou criar tarefa sem deixar inbox,
**Para que** seja rápido atender.

**Acceptance Criteria:**

1. Botões flutuantes em hover da conversa:
   - "Reply" → input de texto com template suggestions
   - "Assign" → dropdown de team members
   - "Create Task" → modal de task (due date, assignee, description)
   - "Mark as Done" → move para done, envia feedback message
2. Reply auto-insere o saudação (ex: "Oi [nome]")
3. Task criada dispara notificação para assignee
4. Testes: clica Reply, escreve, envia → mensagem em WhatsApp em < 1s

---

### Story 3.3: Histórico Completo: Mensagens + Atividades

**Como um** gerente,
**Quero** ver timeline completa do cliente (WhatsApp + CRM),
**Para que** saiba exatamente o que aconteceu.

**Acceptance Criteria:**

1. Activity feed mostra eventos ordenados por data (descendente):
   - Mensagens WhatsApp (com timestamp, autor, status)
   - Activities CRM (tasks, calls, notes)
   - Deal changes (stage, owner, value updates)
2. Cada item mostra avatar do autor + tipo de atividade + conteúdo + data
3. Hover mostra detalhes (ex: hover em task → descrição completa)
4. Filter por tipo (WhatsApp, Tasks, Deals, All)
5. Paginação (últimas 20, load more)
6. Testes: 30 eventos aparecem em ordem correta

---

### Story 3.4: AI Reply Suggestion Baseado em Contexto

**Como um** atendente,
**Quero** que o sistema sugira respostas baseadas no histórico do deal,
**Para que** responda mais rápido e consistente.

**Acceptance Criteria:**

1. Input de resposta mostra "💡 Suggestions" com 2-3 opções de resposta
2. Suggester usa:
   - Contexto do deal (stage, valor, histórico)
   - Histórico de mensagens recentes
   - Templates pré-configurados da org
   - LLM (Anthropic/OpenAI) para gerar
3. Clica em suggestion → preenchе input (ainda edita antes de enviar)
4. Log de qual suggestion foi usada (metrics)
5. Testes: sugestão relevante ao contexto do deal, está pronta em < 2s

---

## Epic 4: Automações Cross-Platform

**Objetivo:** Permitir automações complexas que combinam triggers CRM com ações WhatsApp. Resultado: Fluxos visuais que reduzem work manual.

### Story 4.1: "Deal Mudou de Stage" → Enviar Template WhatsApp

**Como um** gerente,
**Quero** configurar que quando um deal muda para "Proposta Enviada", uma mensagem automática é enviada,
**Para que** o cliente sempre saiba que recebeu a proposta.

**Acceptance Criteria:**

1. Page `/flows` mostra builder visual com nodes:
   - Node "Start" → Trigger (Deal stage changed)
   - Node "Message" → template selector
   - Node "End"
2. Admin seleciona stage ("Proposta Enviada")
3. Admin seleciona template (com preview)
4. Admin clica "Deploy"
5. Internamente: cria workflow record com JSON
6. Função PL/pgSQL `on_deal_stage_change()` executa workflow se existe
7. Testes: move deal → webhook dispara → template envia em 3s

---

### Story 4.2: "Mensagem com Keyword" → Criar Lead no CRM

**Como um** SDR,
**Quero** que quando cliente escreve "oi", um lead seja criado automaticamente,
**Para que** não perca ninguém.

**Acceptance Criteria:**

1. Flow builder permite node "Trigger" com tipo "Inbound Message"
2. Configura keyword matching (contains, regex)
3. Configura ação "Create Deal" com:
   - Board (padrão ou custom)
   - Stage (padrão "Novo")
   - Name template (ex: "Lead - {contact_name} - {date}")
   - Owner assignment (random, round-robin, fixo)
4. Node "Condition" permite: "If [custom_field] = [value] then..."
5. Testes: inbound message com keyword cria deal automaticamente

---

### Story 4.3: Flow Builder Integrado ao Pipeline

**Como um** dono de PME,
**Quero** desenhar um fluxo completo (trigger → ações encadeadas) visualmente,
**Para que** não precise de código.

**Acceptance Criteria:**

1. Flow builder reutiliza editor Monaco (como SmartZap)
2. Nodes disponíveis:
   - Start, End
   - Delay (wait X minutes)
   - Message (send text/template/interactive)
   - Condition (if/else branching)
   - Create Deal, Create Task, Update Contact
   - Handoff (transfer to human)
   - AI Agent (process com LLM)
3. Conexões entre nodes (drag-to-connect)
4. Deploy button salva como `workflow` record
5. Workflow executado via Upstash QStash (durable steps)
6. Testes: workflow com 5 steps executa sequencialmente sem erros

---

### Story 4.4: AI Decisions do CRM → Auto-Send Mensagem

**Como um** diretor de vendas,
**Quero** que se AI sugere "contato está pronto para upsell", uma oferta seja enviada via WhatsApp automaticamente,
**Para que** maximize conversão.

**Acceptance Criteria:**

1. AI Decisions geradas por análise: recency, value, comportamento
2. Decision tem `status = 'suggested'`, `confidence_score` (0-100)
3. Admin configura ação para cada decision type:
   - Decision: "upsell_ready" → Action: "Send upsell_template"
4. Quando decision criada:
   - Função PL/pgSQL verifica se ação configurada
   - Se sim: enqueue no QStash
   - Mensagem enviada com tracking
5. Dashboard mostra "Decisions Acted" vs "Decisions Ignored" (metrics)
6. Testes: AI decision criada → mensagem enviada em < 5s

---

## Epic 5: Billing e Monetização

**Objetivo:** Implementar sistema de pagamento Stripe com planos e metering. Resultado: SaaS pode cobrar e escalar.

### Story 5.1: Integração Stripe (Subscriptions + Metering)

**Como um** founder,
**Quero** aceitar pagamentos Stripe com subscriptions,
**Para que** monetize o produto.

**Acceptance Criteria:**

1. Stripe account configurado, API keys em env vars
2. Endpoint `/api/billing/create-checkout-session` retorna URL de checkout
3. Checkout redireciona para Stripe Billing Portal
4. Webhook `/api/webhooks/stripe` processa eventos:
   - `customer.subscription.created` → ativa acesso
   - `customer.subscription.deleted` → desativa acesso
   - `invoice.payment_failed` → notifica admin
5. Customer vinculado a `organization_id` em tabela `billing_subscriptions`
6. Testes: criar subscription → success → organization tem `status = 'active'`

---

### Story 5.2: Planos (Starter, Growth, Business)

**Como um** PME,
**Quero** escolher um plano que caiba no meu orçamento,
**Para que** comece pequeno e cresça.

**Acceptance Criteria:**

1. 3 planos com limites:
   - **Starter** (R$ 99/mês): 1,000 msgs, 10 contatos, 1 user
   - **Growth** (R$ 299/mês): 50k msgs, 500 contatos, 5 users
   - **Business** (R$ 999/mês): unlimited (metering por uso)
2. Page `/pricing` mostra comparação com CTA "Start Free Trial"
3. Stripe Price objects criados para cada plano
4. Feature flags em código controlam limites:
   - `getOrgLimits(org_id)` retorna max_messages, max_contacts, max_users
   - Endpoint `/api/usage` retorna consumo atual
   - Se over limit: bloqueado com mensagem de upgrade
5. Testes: org no Starter pode enviar 1,000 msgs, 1,001 é rejeitado

---

### Story 5.3: Usage Metering (Mensagens, Contatos, Flows)

**Como um** gerente,
**Quero** saber exatamente quanto estou usando e o que vou pagar,
**Para que** controle custos.

**Acceptance Criteria:**

1. Tabela `usage_events` registra:
   - `organization_id`, `metric` (message_sent, contact_created, flow_executed), `quantity`, `timestamp`
2. Função PL/pgSQL `increment_usage(org_id, metric, qty)` incrementa
3. Chamado em:
   - `send_message()` → message_sent
   - `create_contact()` → contact_created
   - `execute_workflow()` → flow_executed
4. Dashboard `/dashboard/usage` mostra:
   - Gráfico de consumo (últimas 30 dias)
   - Breakdown por métrica
   - Projeção de custo
   - "Upgrade" CTA se perto do limite
5. Stripe metered billing reporta consumo via `/api/metering/report`
6. Testes: enviar 100 msgs → usage shows 100, Stripe vê 100

---

### Story 5.4: Trial Gratuito 14 Dias

**Como um** PME,
**Quero** testar o produto por 14 dias antes de pagar,
**Para que** tenha confiança na compra.

**Acceptance Criteria:**

1. Novo usuário auto-criado com `trial_status = 'active'`, `trial_end_date = now() + 14 days`
2. Durante trial: todos os limites = plan Growth
3. Dashboard mostra banner: "Free trial ends in X days"
4. 2 dias antes do fim: email lembrando para fazer upgrade
5. No dia da expiração:
   - Trial passa para `trial_status = 'expired'`
   - Acesso bloqueado com mensagem: "Trial expired, choose a plan to continue"
   - Link direto para `/pricing`
6. Se user não escolher plan: dados preservados por 30 dias (GDPR), depois apagado
7. Testes: criar org → tem trial, 14 dias passa → bloqueado, upgrade → acesso restaurado

---

### Story 5.5: Checkout e Onboarding com Upgrade

**Como um** usuario,
**Quero** passar do trial para pagante sem perder dados,
**Para que** a transição seja suave.

**Acceptance Criteria:**

1. Button "Upgrade Now" em `/settings/billing` ou dashboard banner
2. Clica → redireciona para `/api/billing/create-checkout-session`
3. Stripe Checkout carrega (card, email, billing address)
4. Webhook processa `payment_intent.succeeded`
5. Subscription criada em tabela `billing_subscriptions`
6. Organization marcada `trial_status = 'converted'`, `status = 'active'`
7. Página pós-compra: "Welcome! Your subscription is active" + próximos passos
8. Email enviado: "Obrigado! Seu subscription foi ativado"
9. Testes: upgrade trial → Stripe payment → org ativo em 3s

---

## Epic 6: Onboarding e Self-Service

**Objetivo:** Permitir novo usuário setup completo em 10 minutos (Meta token + contatos + templates). Resultado: Produto pronto para usar sem help manual.

### Story 6.1: Wizard Setup Meta WhatsApp Business

**Como um** dono de PME,
**Quero** conectar minha conta Meta em 3 cliques,
**Para que** comece a usar imediatamente.

**Acceptance Criteria:**

1. Page `/setup/whatsapp` mostra wizard com 4 steps:
   - Step 1: "Get your Meta Business Account" (explica o quê é, link para criar)
   - Step 2: "Authorize ZapCRM" (OAuth flow com Meta)
   - Step 3: "Select Phone Number" (dropdown de números vinculados)
   - Step 4: "Verify Setup" (test message, mostra sucesso)
2. OAuth redireciona para Meta Login, autoriza `whatsapp_business_messaging`
3. Token salvo em `organization_integrations` table, encrypto
4. Test message enviado para número confirmar conexão
5. Após sucesso: redireciona para `/setup/contacts` (próximo step)
6. Testes: complete OAuth → token armazenado, test message enviado

---

### Story 6.2: Importação de Contatos (CSV + Manual)

**Como um** vendedor,
**Quero** importar meus contatos existentes do Excel,
**Para que** não comece do zero.

**Acceptance Criteria:**

1. Page `/setup/contacts` com 2 tabs:
   - **Tab 1: CSV Upload**
     - Drag-and-drop ou file picker
     - Parse CSV (name, phone, email)
     - Valida phones (E.164 format)
     - Preview (primeiras 10 rows)
     - Import button → processa em background (Upstash QStash)
     - Toast: "Importing 500 contacts, você receberá email quando terminar"

   - **Tab 2: Manual Add**
     - Form simples: name, phone, email
     - Botão "Add Another"
     - Bulk action depois

2. Background job:
   - Valida cada row
   - Merges com contatos existentes (phone match)
   - Adiciona tags `imported_{timestamp}`
   - Envia email: "Imported 500 contacts successfully"

3. Testes: upload CSV com 10 contatos → todos criados corretamente

---

### Story 6.3: Templates Pré-Configurados por Segmento

**Como um** novo usuário,
**Quero** ter templates prontos para usar,
**Para que** não comece com página em branco.

**Acceptance Criteria:**

1. Page `/setup/templates` mostra 3 templates pré-aprovados Meta:
   - **Saudação**: "Oi {{name}}, bem-vindo! 👋"
   - **Proposta**: "Seguindo nossa conversa, aqui vai a proposta: {{deal_url}}"
   - **Follow-up**: "Oi {{name}}, tudo bem? Gostaria de falar sobre {{topic}}?"
2. Cada template mostra:
   - Preview (como aparecerá no WhatsApp)
   - Variables disponíveis ({{name}}, {{deal_url}}, etc)
   - Status (aprovado, pendente — Meta leva 15 min)
   - Button "Use This" → cria cópia para a org
3. User pode editar/criar custom templates depois em `/templates`
4. Testes: seleciona template → criado na org, pronto para usar

---

### Story 6.4: Tutoriais Interativos In-App

**Como um** novo usuário,
**Quero** aprender como usar o produto sem sair,
**Para que** não fique perdido.

**Acceptance Criteria:**

1. Componente `<Onboarding Tour />` com 5 passos:
   - Step 1: "Aqui está seu Inbox (onde conversa com clientes)"
   - Step 2: "Aqui está o Pipeline (organize seus deals)"
   - Step 3: "Aqui está seu Contatos (veja histórico completo)"
   - Step 4: "Quick actions para responder rápido"
   - Step 5: "Parabéns! Já pode começar"
2. Highlight com semi-transparent overlay
3. Botões "Next" / "Skip" / "Done"
4. Pode reabrir com "?" button no footer
5. Marca como completo em user settings → não mostra novamente
6. Teste: usuário novo vê tour, skip → não mostra, próxima vez não aparece

---

## Checklist Results Report

PRD validado com checklist PM:
- ✅ Goals claros e alinhados
- ✅ Requirements funcionais completos (20 FR)
- ✅ Requirements não-funcionais específicos (10 NFR)
- ✅ User personas definidas
- ✅ Epics sequenciais sem circular dependencies
- ✅ Stories com acceptance criteria testáveis
- ✅ Arquitetura técnica viável (multi-tenant, serverless, Stripe)
- ✅ Roadmap realístico (12 sprints = ~6 meses com squad de 5-7 pessoas)

---

## Next Steps

### Squad Creator Prompt

Usar este PRD para spawnar squad especializado com agentes habilitados:

```
Crie um squad para produto ZapCRM (SaaS WhatsApp+CRM multi-tenant).

PRD: [Este documento]

Agentes necessários:
- @pm (Morgan) - Product strategy, roadmap, epic planning
- @architect (Aria) - Multi-tenant arch, bridge layer, database design
- @data-engineer (Dara) - Schema design, RLS policies, migrations
- @sm (River) - Story creation por epic
- @dev (Dex) - Implementação
- @qa (Vera) - QA gates, test strategy
- @devops (Gage) - Deploy, CI/CD, Stripe integration

Customização:
- Cada agente recebe contexto: arquivos do PRD, análise técnica, roadmap
- @architect designado como "Technical Lead"
- @pm designado como "Product Lead"
- Stories criadas em paralelo por epic (workflow coordenado)
```

### Architect Prompt

Após PRD aprovado:

```
Crie arquitetura técnica detalhada para ZapCRM baseada neste PRD.

Foco:
1. Schema multi-tenant unificado (SmartZap + NossoCRM)
2. Bridge layer event-driven (Supabase Realtime + Upstash QStash)
3. RLS policies completas
4. API contracts (WhatsApp webhook, CRM endpoints, Stripe)
5. Data flow diagrams (WhatsApp → CRM, CRM → WhatsApp)
6. Deployment strategy (Vercel, Supabase, Stripe)

Output:
- Architecture document (docs/architecture/zapccrm-architecture.md)
- ER diagram (multi-tenant)
- Sequence diagrams (key flows)
- Infrastructure as Code templates (Supabase migrations)
```

---

**Documento Finalizado:** 2026-02-28
**Versão:** 1.0
**Status:** Pronto para Squad Creator
**Próximo Passo:** Chamar `/squad-creator` com este PRD
