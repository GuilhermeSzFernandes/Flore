# design-sync — notas do repositório Flore

Contexto: este repo é uma **aplicação Next.js 15** (não uma biblioteca publicável). O
design system é composto pelos primitivos shadcn/ui em `src/components/ui/` + componentes
próprios em `src/components/`. A sincronização usa o **modo `package`** com um **entry
sintético customizado** (`.design-sync/ds-entry.tsx`) passado via `cfg.entry`.

## Decisões de build

- **Sem `dist/`**: o bundle é construído a partir de `.design-sync/ds-entry.tsx`, que
  re-exporta os componentes (lidando com `export default` de FloreLogo/PatientCombobox).
  `cfg.entry` aponta para ele; isso também fixa `PKG_DIR` na raiz do repo (via o
  `package.json` com `name: "flore"`).
- **`@/*`**: resolvido via `cfg.tsconfig` (`tsconfig.json`, paths `@/* → ./src/*`).
- **CSS Tailwind v4**: os componentes usam classes utilitárias que só existem após
  compilação. `cfg.buildCmd` roda `@tailwindcss/cli` sobre `.design-sync/tw-input.css`
  (espelha `src/app/globals.css` sem o import quebrado `shadcn/tailwind.css`, que está
  ausente em `node_modules` mas o `next build` tolera) e escreve
  `.design-sync/.cache/compiled.css`, apontado por `cfg.cssEntry`. **Sempre rode o
  `buildCmd` antes do conversor quando o source de componentes ou `tw-input.css` mudar.**
- **Fontes de marca**: o app injeta Geist Sans e Playfair Display via `next/font` em
  runtime (sem `@font-face`). Para previews/designs, baixei os woff2 do Fontsource e
  declarei `@font-face` em `.design-sync/fonts.css` (`cfg.extraFonts`). `tw-input.css`
  referencia "Geist" e "Playfair Display" como famílias primárias.
- **`.d.ts`**: como não há `.d.ts` compilado e os props vêm de `@base-ui` (não achatáveis),
  TODOS os contratos de API são fornecidos manualmente via `cfg.dtsPropsFor`.

## Componentes

- **Excluídos**: `WhatsAppReminderButton` e `FeedbackFAB` — importam server actions
  (`@/actions/*`) que puxam a camada de banco (drizzle/neon) e não empacotam para preview
  de browser. Para incluí-los no futuro, seria preciso stubar `@/actions/*` (alias para
  módulos vazios) — não feito nesta sincronização.
- **`Toaster`**: deferido (floor card). É runtime-only — toasts aparecem via `toast()` do
  sonner, sem estado estático renderizável. Não autorado de propósito.
- **`FloreLogo`**: o componente referencia `/logotipo.png` (asset absoluto). Copiei
  `public/logotipo.png` para a raiz do bundle (`ds-bundle/logotipo.png`) após cada build
  para o preview resolver. **Designs construídos com FloreLogo precisam que o app sirva
  `/logotipo.png`** — documentado no cabeçalho de convenções.

## Known render warns (verificadas como benignas)

- `[RENDER_THIN] Dialog` e `[RENDER_THIN] Sheet`: altura medida do root = 1px porque o
  conteúdo é portaled/`fixed`. As screenshots (`_screenshots/general__Dialog.png`,
  `__Sheet.png`) mostram o conteúdo completo renderizado. Ambos usam `cardMode: single`
  com viewport. **Benignas — não retrabalhar.**

## Overlays (Base UI)

Dialog, Sheet, Select, Popover, DropdownMenu são Base UI portaled. Previews usam
`defaultOpen` (e `modal={false}` quando aplicável) + `cfg.overrides.<Name>.cardMode:"single"`
com viewport. `DropdownMenuLabel` exige um `<DropdownMenuGroup>` em volta (senão
`MenuGroupContext is missing`).

## Performance

- Build completo ~5–7 min no Windows: dominado pela compilação esbuild dos ~19 previews
  (um spawn por preview). O `loadDts` sobre a raiz do repo também é lento mas conclui.
  Rode build/validate/capture como tarefas de background.

## Re-sync risks

- **Dados inline em previews**: os previews usam dados fictícios (clientes, datas) inline —
  não dependem de código upstream, seguros.
- **Fontes via CDN**: os woff2 foram baixados do Fontsource (`cdn.jsdelivr.net`) e estão
  commitados em `.design-sync/fonts/`; não dependem de rede no re-sync.
- **`compiled.css` é gitignored** (`.design-sync/.cache/`): num clone novo, rode
  `cfg.buildCmd` antes do conversor (o driver/resync deve fazer isso).
- **`dtsPropsFor` manual**: se a API real dos componentes mudar (ex: nova variante de
  Button), os contratos em `cfg.dtsPropsFor` precisam ser atualizados à mão — eles não são
  derivados do source.
- **`shadcn/tailwind.css` ausente**: se um dia for adicionado ao projeto, reavalie
  `tw-input.css` (hoje ele omite esse import deliberadamente).
