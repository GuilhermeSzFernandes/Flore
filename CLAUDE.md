# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # servidor de desenvolvimento (Next.js 15)
npm run build        # build de produção
npm run lint         # ESLint
npm run seed:admin   # cria usuário admin no banco (lê ADMIN_EMAIL / ADMIN_PASSWORD do .env.local)
npx drizzle-kit push # aplica mudanças de schema no Neon sem gerar migrations
```

Não há testes automatizados no projeto. Validação é feita manualmente via `npm run build` e fluxo no browser.

## Stack

Next.js 15 (App Router) · TypeScript · Drizzle ORM + Neon (PostgreSQL serverless) · Auth.js v5 · shadcn/ui + Tailwind CSS v4 · Sonner (toasts)

## Arquitetura e convenções críticas

### Sistema de autenticação com três papéis

`src/auth.ts` define dois providers:
- **Google** → JWT recebe `role: 'patient'` automaticamente (pacientes acessam via Google)
- **Credentials** → JWT recebe `role: 'professional'` ou `'admin'` (profissionais usam e-mail/senha)

O papel é gravado no JWT no callback `jwt()` e propagado para `session.user.role`. O tipo de provider no momento do login determina o papel — não o campo `role` da tabela `users` diretamente para o Google.

O middleware (`src/middleware.ts`) separa as rotas por papel:
- `/dashboard`, `/agenda`, `/pacientes`, `/configuracoes`, `/onboarding` → apenas `professional`
- `/minha-ficha` → apenas `patient`
- `/admin/*` → apenas `admin`
- `/agendar/[slug]` → público, sem autenticação

### Grupos de rotas

```
(app)/          → profissional autenticada (sidebar + layout)
(auth)/         → login e registro (sem layout de app)
agendar/[slug]  → link público de agendamento da paciente
admin/          → painel administrativo (usuário admin)
minha-ficha/    → ficha da paciente (Google OAuth)
onboarding/     → configuração inicial do perfil profissional
```

### Server Actions para todas as mutações

Não há Route Handlers para mutações. Tudo passa por Server Actions em `src/actions/`. Todas retornam `{ success: boolean; error?: string }`. Usar `revalidatePath()` no final de cada action que altera dados exibidos em páginas.

### Agendamentos com paciente opcional

`appointments.patientId` pode ser `null` — acontece quando agendado via link público (`/agendar/[slug]`). Nesses casos não há restrições clínicas para exibir. O `patientName` e `patientPhone` são sempre copiados diretamente no registro do agendamento (desnormalização intencional).

### Vinculação de paciente ao Google

Em `minha-ficha/page.tsx`: quando uma paciente faz login com Google, o sistema busca um registro em `patients` pelo e-mail e preenche `patients.userId` se ainda estiver nulo. É a única forma de vincular ficha clínica à conta Google.

### Limites de plano

`src/lib/plan.ts` define `PLAN_LIMITS`. Verificar `canCreateAppointment()` e `canAddPatient()` **antes** de inserir no banco nas Server Actions — não confiar na UI para impedir. Planos `beta` e `free` têm limite de 30 agendamentos/mês e 30 pacientes.

### Design system

Paleta definida via CSS custom properties OKLch em `src/app/globals.css`:
- `--primary`: terracota `oklch(0.575 0.115 27)`
- `--background`: pergaminho `oklch(0.963 0.006 80)`
- `--foreground`: charcoal verde `oklch(0.155 0.015 155)`
- `--sidebar`: charcoal escuro (mesmo foreground)

Fonte display: Playfair Display (`font-display`), disponível em itálico. Fonte body: Geist Sans. Usar `font-display italic` para títulos de modais e painéis.

Datas sempre formatadas com `date-fns` locale `ptBR`.

### Fuso horário — PADRÃO OBRIGATÓRIO

Timestamps são gravados em **UTC** no banco, mas o app opera no fuso **`America/Sao_Paulo`**. O servidor de produção (Vercel) roda em **UTC** — por isso `new Date()`, `startOfMonth`, `setHours`, `format()` etc. no server **calculam no fuso errado** e deslocam dias/horários em ~3h (um atendimento às 22h de SP cai no dia seguinte).

**Nunca** use `new Date()`, `new Date(str)` ou `.toISOString().slice(0,10)` cru para lógica de calendário no server. Use sempre os helpers de `src/lib/datetime.ts`:

- `nowInApp()` — "agora" no fuso SP. Base para `startOfDay`/`startOfMonth`/`endOfMonth`/etc. do date-fns (que preservam o fuso do `TZDate`).
- `toAppTz(instant)` — converte um instante do banco (Date/ISO) para SP. Use antes de `isSameDay`/`getHours`/`format()` **no server** para exibir/comparar horário local.
- `parseAppDateTime(str)` — interpreta string de relógio de parede sem fuso (`"YYYY-MM-DD"` ou `"YYYY-MM-DDTHH:MM"`, ex: `<input type="datetime-local">`) como horário SP. Use no lugar de `new Date(str)` para esses campos.
- `appDateString(instant?)` — data-calendário SP como `"YYYY-MM-DD"` (para o "hoje" e comparações com colunas `date`, ex: `blockedTimes.date`).
- `appTimeOnDay(instant, hh, mm)` — instante de `HH:MM` (parede SP) no dia SP de `instant`. Para janelas de dia e pausas (almoço).

Regras:
- **Instante** (ex: `reminderSentAt: new Date()`, `gte(startsAt, new Date())`) não precisa de tratamento — um instante independe de fuso.
- **Fronteira de calendário, parsing de horário digitado e formatação de exibição no server** sempre passam pelos helpers.
- **`birthDate`** é date-only (`"YYYY-MM-DD"`) sem hora — formatar com `new Date(birthDate + 'T00:00:00')` já está correto; **não** envolver em `toAppTz` (deslocaria o dia).
- **Client components** (`'use client'`) rodam no fuso do navegador; para usuárias no Brasil já é SP. O tratamento é obrigatório no **server** (pages, server actions).

### Horários de atendimento (`workingHours`)

Armazenado como JSON em coluna `text` na tabela `professionals`. Formato `WeekSchedule`:

```json
{ "mon": { "open": "09:00", "close": "18:00" }, "tue": null, ..., "sun": null }
```

- `null` = dia fechado; chave ausente = fechado (trate com `!= null`, não `!== null`)
- **Edição**: usar `WorkingHoursEditor` de `src/app/(app)/servicos/WorkingHoursEditor.tsx`
- **Exibição**: usar `WorkingHoursView` + `parseSchedule` de `BusinessDataCard.tsx` — dias consecutivos com mesmo horário são agrupados em ranges (ex: "Seg – Sex")
- Nunca usar `<Input>` ou `<Textarea>` raw para este campo
- `parseSchedule(raw)` retorna `null` para strings inválidas; exibir nada nesse caso

### Horários bloqueados (`blockedTimes`)

Tabela para exceções de agenda (feriados, ausências pontuais):

```
id, professionalId, date (YYYY-MM-DD), startTime (HH:MM | null), endTime (HH:MM | null), reason, createdAt
```

- `startTime = null && endTime = null` → dia inteiro bloqueado
- Actions em `src/actions/blocked-times.ts`: `addBlockedTime`, `removeBlockedTime`, `getUpcomingBlockedTimes`
- Verificado em `loadBookingData` (action) e `getAvailableSlots` (BookingModal) para impedir agendamentos no horário bloqueado

### Admin

Criado via `npm run seed:admin` (script `src/db/seed-admin.ts`). Acessa `/admin` com Credentials. Pode alterar planos dos profissionais em `/admin/profissionais`.
