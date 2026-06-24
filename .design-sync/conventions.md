## Flore — convenções do design system

App de gestão para profissionais de estética/saúde. Estética "botânica profissional":
terracota + verde-sálvia sobre pergaminho, títulos em serifa itálica.

### Setup e estilização

Os componentes são **shadcn/ui sobre Base UI**, estilizados com **classes utilitárias
Tailwind v4** apoiadas em design tokens (CSS custom properties). **Não há provider
obrigatório** — os componentes renderizam estilizados desde que `styles.css` esteja
carregado (ele define os tokens e importa o CSS dos componentes). Use as classes
utilitárias e os tokens; não escreva CSS solto nem invente nomes de classe.

### Tokens (use sempre via classe utilitária ou `var(--token)`)

| Papel | Classe utilitária | Token |
|---|---|---|
| Fundo da página (pergaminho) | `bg-background` | `--background` |
| Texto principal (charcoal verde) | `text-foreground` | `--foreground` |
| Ação primária (terracota) | `bg-primary` `text-primary-foreground` | `--primary` |
| Superfície de cartão | `bg-card` | `--card` |
| Popover/menu | `bg-popover` | `--popover` |
| Secundário / sutil | `bg-secondary` `bg-muted` | `--secondary` `--muted` |
| Texto sutil (sálvia) | `text-muted-foreground` | `--muted-foreground` |
| Destaque / hover | `bg-accent` `text-accent-foreground` | `--accent` |
| Erro / destrutivo | `bg-destructive` `text-destructive` | `--destructive` |
| Bordas / inputs | `border-border` `border-input` | `--border` `--input` |
| Sidebar (charcoal escuro) | `bg-sidebar` `text-sidebar-foreground` | `--sidebar` |
| Raio | `rounded-lg` / `rounded-xl` | `--radius` |

### Tipografia

- Corpo: **Geist Sans** (`font-sans`, padrão).
- Títulos de marca / modais / logo: **Playfair Display** em itálico — use a classe
  `font-display italic` (ex.: `<h2 className="font-display italic text-xl">`).

### Componentes de overlay (Base UI)

`Dialog`, `Sheet`, `Select`, `Popover`, `DropdownMenu` controlam abertura via `open` /
`defaultOpen` na raiz. Componha as partes (`DialogContent`, `DialogHeader`, `DialogTitle`,
`DialogFooter`; `SelectTrigger`+`SelectContent`+`SelectItem`; etc.) — veja o `.prompt.md`
de cada componente. `DropdownMenuLabel` deve ficar dentro de `<DropdownMenuGroup>`.

### Marca

`FloreLogo` renderiza `<img src="/logotipo.png">` + o nome em Playfair itálico. **A app
precisa servir `/logotipo.png` na raiz** para o logo aparecer. Props: `size`, `showText`,
`textColor`.

### Onde está a verdade

Leia `styles.css` (e o CSS que ele importa) para o vocabulário completo de tokens, e o
`<Componente>.prompt.md` / `<Componente>.d.ts` de cada componente para a API e exemplos.

### Exemplo idiomático

```tsx
<Card className="w-80">
  <CardHeader>
    <CardTitle>Consulta de retorno</CardTitle>
    <CardDescription>Maria Helena · Quinta às 14h30</CardDescription>
    <CardAction><Badge>Confirmado</Badge></CardAction>
  </CardHeader>
  <CardContent>
    <p className="text-muted-foreground">Avaliação de evolução do tratamento.</p>
  </CardContent>
  <CardFooter className="gap-2">
    <Button>Confirmar</Button>
    <Button variant="outline">Reagendar</Button>
  </CardFooter>
</Card>
```
