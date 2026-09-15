# Merge Analysis — Chat Assistant + Arc Flow Carousel

Read-only pass. No code changed, nothing installed.

## 0. Premise corrections (read first)

| Stated | Actual |
|---|---|
| "Two template folders" | One folder (`chat-assitant-ui/`, 95 files) + one **integration-prompt markdown** (`library-grid-prompt.md`, 601 lines). Template B is not a project — it is a single component + demo pasted into a prompt file. It has no `package.json`, config, theme, or router of its own. |
| "21st.dev carousel/library **grid**" | Template B is `ArcFlowCarousel` — a GSAP-driven **fanned arc carousel** (cards ride a circle, drag/flick/wheel). There is no grid. Built by "Hyperiux Vault", not 21st.dev (`library-grid-prompt.md:15`). |
| "without losing either one's animations… framer-motion majors" | **Neither template uses framer-motion or `motion`.** Template A is pure CSS keyframes + `requestAnimationFrame`. Template B is GSAP ticker + direct DOM style writes. The framer-motion decision rule is moot. |
| "If both define Tailwind themes" | Only A defines a theme. B ships zero tokens (hardcoded `bg-black`, a `surfaceColor` prop, rgba shadows). |
| "two shadcn `button.tsx` with different variants" | Only one `button.tsx` exists. No component-name collision (see §3.5). |

**Blocking question → §6 Q1.** Everything below assumes `ArcFlowCarousel` is the intended right-hand pane.

---

## 1. Inventory

| | **A — chat-assitant-ui** | **B — library-grid-prompt.md** |
|---|---|---|
| Form | Full Next.js project, 95 files | 1 md file: `arc-flow-carousel.tsx` + `demo.tsx` + an npm instruction |
| Framework / router | Next **16.0.10**, App Router, RSC on | none — plain client component |
| React | **19.2.0** / react-dom 19.2.0 | uses `useSyncExternalStore`, block-bodied ref callbacks → React 19 safe |
| Tailwind | **v4.1.9**, CSS-first. No `tailwind.config`. `@import "tailwindcss"` + `@theme inline` (`app/globals.css:1,77-116`); `components.json` has `"config": ""` | utility classes only; all v4-compatible |
| Theme tokens | OKLCH, shadcn **new-york**, base `neutral`, `cssVariables: true`. `:root` 30 tokens (`globals.css:6-40`), `.dark` 30 (`42-75`), `@theme inline` 36 mappings (`77-116`), `--radius: 0.625rem` | **none** |
| Component lib | shadcn/ui — 57 files in `components/ui/`. **Only `button.tsx` + `dropdown-menu.tsx` are imported** by app code | none |
| Animation | CSS `@keyframes` in `app/globals.css` (11 keyframes) + `tw-animate-css@1.3.3` + hand-rolled rAF | **gsap** — `gsap.ticker`, `gsap.utils.clamp/snap`. **Not in `package.json`, not in `pnpm-lock.yaml`** |
| State | local `useState` in `ChatShell` + `localStorage` (`chat-shell.tsx:19-20,36-65`). No store, no context mounted | all refs, zero React state for motion (`library-grid-prompt.md:142-165`) |
| Icons | `lucide-react@0.454.0` | none |
| Fonts | `Geist` + `Geist_Mono` via `next/font/google` (`layout.tsx:3,7-8`), wired at `globals.css:78-79` | none |
| Data | AI Gateway via `ai@6.0.38` `streamText` (`app/api/chat/route.ts`) | 8 inline base64 JPEGs, ~145 KB (`library-grid-prompt.md:22-29`) |
| Deps | 42 prod (26 `@radix-ui/*`, `ai`, `next-themes`, `embla-carousel-react`, `recharts`, `sonner`, `vaul`, `cmdk`, `zod`, `date-fns`, `react-hook-form`, `clsx`, `tailwind-merge`, `class-variance-authority`, `tailwindcss-animate`, `@vercel/analytics`, `input-otp`, `react-day-picker`, `react-resizable-panels`, `autoprefixer`) + 8 dev (`tailwindcss`, `@tailwindcss/postcss`, `postcss`, `tw-animate-css`, `typescript`, `@types/{node,react,react-dom}`) | **`gsap`** (one line, `library-grid-prompt.md:600`) |
| Installed? | **No `node_modules`.** `pnpm install` required before any build | — |

**A file ledger (95).** Root: `.gitignore`, `package.json`, `pnpm-lock.yaml`, `components.json`, `next.config.mjs`, `postcss.config.mjs`, `tsconfig.json`. `app/`: `layout.tsx`, `page.tsx`, `globals.css`, `chat/page.tsx`, `api/chat/route.ts`. `components/chat/`: `chat-shell.tsx`, `message-list.tsx`, `message-bubble.tsx`, `markdown-renderer.tsx`, `analysis-word-span.tsx`, `composer.tsx`, `animated-orb.tsx`, `audio-waveform.tsx`, `typing-indicator.tsx`. `components/`: `theme-provider.tsx`. `components/ui/` (57): accordion, alert-dialog, alert, aspect-ratio, avatar, badge, breadcrumb, button-group, button, calendar, card, carousel, chart, checkbox, collapsible, command, context-menu, dialog, drawer, dropdown-menu, empty, field, form, hover-card, input-group, input-otp, input, item, kbd, label, menubar, navigation-menu, pagination, popover, progress, radio-group, resizable, scroll-area, select, separator, sheet, sidebar, skeleton, slider, sonner, spinner, switch, table, tabs, textarea, toast, toaster, toggle-group, toggle, tooltip, use-mobile.tsx, use-toast.ts. `hooks/`: `use-mobile.ts`, `use-toast.ts`. `lib/`: `utils.ts`. `styles/`: `globals.css` *(dead — not imported)*. `public/`: `apple-icon.png`, `icon.svg`, `icon-dark-32x32.png`, `icon-light-32x32.png`, `placeholder-logo.png`, `placeholder-logo.svg`, `placeholder-user.jpg`, `placeholder.jpg`, `placeholder.svg`, `images/claude.svg`, `images/google.webp`, `images/gpt.png`.

---

## 2. Animation map

### 2A — Chat assistant

| # | Animation | File:lines | Trigger | Properties | Dependencies | Verdict |
|---|---|---|---|---|---|---|
| A1 | `orb-intro` | `globals.css:364-382` ← `message-list.tsx:142` | mount, gated on `hasAnimated` (`message-list.tsx:26,31-48`) | translateY −100px→0, scale 4→1, blur 30→0px, opacity 0→1; 4s | `hasAnimated` state; parent `h-full` flex-center at `message-list.tsx:141` | **PORT-AS-IS** |
| A2 | `text-blur-intro` / `-delay` | `globals.css:553-573` ← `message-list.tsx:145,148` | mount, same gate; delay variant +0.3s | blur 12→0, opacity 0→1, translateY 10→0; 1.5s | same `hasAnimated` gate | **PORT-AS-IS** |
| A3 | `composer-intro` | `globals.css:385-400` ← `composer.tsx:206` | mount (`composer.tsx:94-97`), 1s delay, 4s | translateY 100px→0, opacity 0→1 | **parent is `fixed bottom-4 left-0 right-0`** — anchored to viewport, will span both panes | **MUST-ADAPT** |
| A4 | `orb-hue-rotate` | `globals.css:403-419` ← inline `animated-orb.tsx:43` | mount, infinite 8s linear | `filter: hue-rotate` | none | **PORT-AS-IS** |
| A5 | `orb-hue-rotate-blur` | `globals.css:422-438` ← inline `animated-orb.tsx:54` | mount, infinite 6s reverse | `filter: blur(var(--orb-blur)) hue-rotate` | `--orb-blur` set inline `animated-orb.tsx:53` | **PORT-AS-IS** |
| A6 | `orb-orbit-1..5` | `globals.css:441-529`, classes `532-550` ← `animated-orb.tsx:60,70,80,90,100` | mount, infinite 4–7s | rotate + translateX(15–35%) + counter-rotate + scale | `translateX` % resolves against the circle's own box, **not** the viewport | **PORT-AS-IS** |
| A7 | `slide-up-bounce` (`.user-message-enter`) | `globals.css:191-207` ← `message-bubble.tsx:28` | new **user** message mounts | translateY 20→−4→0, opacity; 0.5s spring bezier | none | **PORT-AS-IS** |
| A8 | Assistant bubble enter | `message-bubble.tsx:29` | assistant bubble mounts | `animate-in fade-in slide-in-from-bottom-2`, 300ms | `tw-animate-css` (`globals.css:2`) | **PORT-AS-IS** |
| A9 | Typing indicator enter + 3 dots | `typing-indicator.tsx:7` (enter), `:23-25` (dots) | `isStreaming` && last msg empty (`message-list.tsx:116-120,171`) | enter: opacity+Y; dots: `animate-bounce`, staggered `animationDelay` 0/150/300ms | `tw-animate-css` + Tailwind core | **PORT-AS-IS** |
| A10 | `image-bounce` | `globals.css:222-241` ← `composer.tsx:220` | file picked (`composer.tsx:189-190`), self-clears at 400ms | scale 0→1.1→0.95→1, opacity | `showImageBounce` state | **PORT-AS-IS** |
| A11 | Per-word blur reveal | `analysis-word-span.tsx:16-48` (rAF), applied `:50-59` | mount of each streamed word (`markdown-renderer.tsx:139,156,190,204`) | `filter: blur` 16→0px, opacity 0→1, 600ms cubic ease-out | `requestAnimationFrame`; `mountedRef` guard `:14,17-18` | **PORT-AS-IS** |
| A12 | Streaming smooth auto-scroll | `message-list.tsx:66-104` | `isStreaming && autoScroll` | `container.scrollTop` lerp 3%/frame | `containerRef` = the component's **own** `overflow-y-auto` div (`:132-134`) — **not** window | **PORT-AS-IS** |
| A13 | Jump-to-bottom | `message-list.tsx:58-64` | `messages.length` change | `scrollTop = scrollHeight` | same containerRef | **PORT-AS-IS** |
| A14 | Bubble growth transition | `message-bubble.tsx:65-67,72` | content grows while streaming | `all` 0.4s cubic-bezier; `max-height`/opacity | `willChange: height` | **PORT-AS-IS** |
| A15 | Sticky assistant avatar | `message-bubble.tsx:37` | `isStreaming` | `sticky bottom-4`, `transition-all` 300ms | needs the scroll container as containing block (already is) | **PORT-AS-IS** |
| A16 | Audio waveform bars | `audio-waveform.tsx:41-79`, bars `:93-101` | `isRecording && stream` | per-bar height, `transition-all` 75ms, rAF loop | WebAudio `AnalyserNode`, `MediaStream` | **PORT-AS-IS** |
| A17 | `animate-bounce-subtle` | used `composer.tsx:316` | `isRecording` | — | **class is never defined anywhere** | **BROKEN → §3.9** |
| A18 | `gradient-text-animated`, `analysis-word-gradient`, `streaming-word`/`blur-reveal`, `ripple-wave`, `orb-float-1..4` | `globals.css:128-159`, `161-171`, `174-188`, `210-219`, `244-344`+`347-361` | **never fires** — 0 TSX references; `orb-float`'s `.orb-circle-*` block at `347-361` is overridden by `532-550` | — | — | **DEAD → §6 Q2** |

### 2B — Arc Flow Carousel (all refs `library-grid-prompt.md`)

| # | Animation | Lines | Trigger | Properties | Dependencies | Verdict |
|---|---|---|---|---|---|---|
| B1 | Staggered entrance reveal | `291-301` (draw) + `315-320` (clock) + `162`,`337` (init) | mount, wall-clock 1100ms | inner `opacity` 0→1, `translate3d(0, cardHeight*0.35 → 0)`, cubic ease-out; per-card delay `|angle|/maxAngle * 0.45` | `gsap.ticker`, `revealRef`, `layoutRef.cardHeight`; **delay derives from `maxAngle`, computed from stage width** (`191-192`) | **MUST-ADAPT** (re-size only — narrower stage ⇒ smaller `maxAngle` ⇒ compressed stagger; tune `cardRatio`) |
| B2 | Fan chase (exponential lerp) | `305-334` | every ticker frame | `current → target`; per-card `slotOffsets` with distance-based follow rate; writes `translate3d + rotate(rad)`, `width`, `height`, `zIndex`, `visibility` | `gsap.ticker.add` (`338`), `layoutRef`, `STAGGER_LAG_STRENGTH`/`MIN_FOLLOW_FRACTION` (`108,110`) | **PORT-AS-IS** |
| B3 | Idle auto-rotate drift | `324-331` | continuous while `autoRotateSpeed && !dragging && !hovered && !reduceMotion` | `target += speed * dt` | `hoveredRef` via pointerenter/leave (`436-441`,`447-448`) | **PORT-AS-IS** |
| B4 | Pointer drag + flick momentum | `344-405` | pointerdown/move/up/cancel **on the stage element** | `target` in radians; 90ms velocity window, `MAX_FLICK` 9, optional `gsap.utils.snap` | `setPointerCapture` (`363`), `layoutRef.radius` (`372`) | **PORT-AS-IS** |
| B5 | Wheel / trackpad | `407-423` | `wheel` on stage, `{passive:false}` + `preventDefault()` (`413`) | `target += delta/radius` | `wheelControl` default `"horizontal"` (`94,125`) — only intercepts when `|deltaX| > |deltaY|` | **MUST-ADAPT → §3.8** |
| B6 | Keyboard arrows | `425-434` | `keydown` on focused stage (`tabIndex=0`, `476`) | `target ± step` | — | **PORT-AS-IS** |
| B7 | Card hover overlay + caption | `519-553` | `group-hover` | overlay opacity 0→100 (300ms); caption `translate-y-4→0` + opacity (300ms) | Tailwind `group` on card (`499`) | **PORT-AS-IS** |
| B8 | Geometry measure | `169-224` | mount + **stage** resize | radius, cardWidth/Height, step, centerX/Y, maxAngle, `slotCount` | **`ResizeObserver` observes `stageRef`** (`221-222`), `window.resize` only as fallback (`217`) | **PORT-AS-IS** — this is why the whole system survives re-parenting |
| B9 | Reduced-motion | `48-61`, consumed `162,235-236,388,508,522,533` | `matchMedia` change | disables reveal, flick, hover-reveal | `useSyncExternalStore` | **PORT-AS-IS** |
| B10 | Caption type scale | `543`, `548` | static | `text-[1.4vw]` / `text-[1.1vw]` | **`vw` = viewport width, not pane width** | **MUST-ADAPT** |

### Viewport-assumption flags

| Location | Assumption | Fix |
|---|---|---|
| `chat-shell.tsx:188` | `h-dvh` | → `h-full` |
| `composer.tsx:206` | `fixed bottom-4 left-0 right-0` | → `absolute` (parent already `relative`) |
| `library-grid-prompt.md:471` | `h-dvh w-full` | → `h-full w-full` |
| `library-grid-prompt.md:543,548` | `vw` font units | → fixed `text-sm`/`text-xs` |
| `library-grid-prompt.md:413` | `wheel` `preventDefault` | keep `wheelControl="horizontal"` explicitly |
| `library-grid-prompt.md:288` | computed `zIndex` up to ~4 digits | pane needs `isolate` |
| `globals.css:122-124` | body-level `bg-background` | harmless — both panes set their own background |
| `message-list.tsx:134` | `absolute inset-0 overflow-y-auto` | **already pane-relative — no edit** |

---

## 3. Conflicts and resolutions

| # | Conflict | Resolution |
|---|---|---|
| 3.1 | **Animation libs don't overlap.** A = CSS+rAF, B = GSAP. `gsap` absent from `package.json` and `pnpm-lock.yaml` | Add **`gsap@^3.13`** as the single new runtime dep. No API-migration table needed — nothing is being upgraded. |
| 3.2 | `node_modules` not installed; lockfile present | `pnpm install` once before the merge pass. Blocks build, not the merge design. |
| 3.3 | **Two `globals.css`.** `app/globals.css` (573 L, live, has all keyframes) vs `styles/globals.css` (125 L, v0 boilerplate, identical minus keyframes, **imported by nothing**) | `app/globals.css` wins. Delete `styles/globals.css`. |
| 3.4 | **Duplicate hooks.** `hooks/use-mobile.ts` ≡ `components/ui/use-mobile.tsx`; `hooks/use-toast.ts` ≡ `components/ui/use-toast.ts` (byte-identical) | Neither is imported. Leave both; zero build cost. → §6 Q5 |
| 3.5 | **Carousel co-existence.** `components/ui/carousel.tsx` is the embla shadcn carousel; B lands as `arc-flow-carousel.tsx` | Different filenames ⇒ no overwrite, no name collision. Keep both, keep `embla-carousel-react`. Do **not** rename. |
| 3.6 | **Theme tokens.** A has the only token set; B has none | **A's `app/globals.css` wins.** It is the only complete set (30 `:root` + 30 `.dark` + 36 `@theme inline` mappings, radius scale, font vars) and every shadcn component compiles against it. B contributes nothing to remap — it uses hex + a `surfaceColor` prop. Optional one-way map: add `--color-library-surface: #000000` and pass it as `surfaceColor`. |
| 3.7 | **Stacking.** B writes `zIndex` up to ~4 digits per card (`:288`); A's composer sits at `z-10` and its dropdown at `z-[9999]` (`composer.tsx:356`) | Give **each pane** `position:relative; isolation:isolate; z-index:0`. B's indices then stay inside the right pane. The dropdown portals to `body` (`DropdownMenuPortal`, `composer.tsx:351`) so it stays above regardless. |
| 3.8 | **Wheel capture.** B `preventDefault`s wheel events (`:413`); `touchAction:"pan-y"` (`:480`) | With `wheelControl="horizontal"` (the default) it only intercepts horizontal-dominant wheel deltas, so vertical scrolling over the right pane is unaffected. Pass it explicitly so a later prop change can't silently swallow page scroll. |
| 3.9 | **`animate-bounce-subtle` undefined** (`composer.tsx:316`) — a Tailwind-v3-config keyframe lost in the v4 CSS-first migration | Either add the keyframe to `app/globals.css` or drop the class. Currently a silent no-op on the recording button. → §6 Q3 |
| 3.10 | **Dark mode half-wired.** `@custom-variant dark` (`globals.css:4`) + `.dark` tokens + `next-themes` installed, but `ThemeProvider` (`components/theme-provider.tsx`) is **never mounted** in `layout.tsx` | Leave light-only for the demo. Left pane is `bg-stone-50`, right pane is `#000` — the split is intentional contrast, not a theme bug. → §6 Q10 |
| 3.11 | Global `* { @apply border-border outline-ring/50 }` (`globals.css:119-121`) applies a default border colour to B's cards | Harmless — border-width stays 0. No action. |
| 3.12 | **145 KB of base64 JPEGs** inline in B's component (`:22-29`) | Extract to `lib/library-items.ts` on port. Never leave them in the component file. → §6 Q8 |
| 3.13 | React 19 ref-callback semantics — a ref callback that *returns* a value is treated as a cleanup fn | B's ref callbacks are block-bodied (`:496-498`, `:503-505`) and return `undefined`. Already correct. No action. |
| 3.14 | `next.config.mjs` sets `typescript.ignoreBuildErrors: true` | Type errors from the merge will not fail the build. Run `tsc --noEmit` manually after merging. |

---

## 4. Container contract

**Root.** `app/page.tsx:1-5` currently `redirect("/chat")`. Replace with the split view; `/` becomes the demo.

```
<main className="h-dvh w-screen overflow-hidden flex flex-col md:flex-row">
  <section id="chat-pane"    className="relative h-1/2 md:h-full md:w-1/2 shrink-0 overflow-hidden isolate bg-stone-50" />
  <section id="library-pane" className="relative h-1/2 md:h-full md:flex-1     overflow-hidden isolate bg-black" />
</main>
```

| Contract term | Value |
|---|---|
| Sizing | `h-dvh` appears **exactly once**, on the root `<main>`. Both panes are `h-full`. Nothing below root reads a viewport unit. |
| Scroll ownership | **Left:** the pane never scrolls; `MessageList`'s own `absolute inset-0 overflow-y-auto` (`message-list.tsx:134`) is the sole scroll container — it already owns rAF auto-scroll (A12) and the scroll-up detector (`:107-113`). **Right:** no scroll by design — the carousel is `absolute inset-0` and consumes drag/wheel/keys. If a header or filter bar is added later, wrap it in its own `overflow-y-auto`; never let the pane itself scroll or B8's `ResizeObserver` will fight it. |
| Containment | Both panes `relative overflow-hidden isolate`. `relative` makes the composer's `absolute` anchor correct (A3) and gives B's `absolute inset-0` stage its box. `isolate` contains B's computed z-indices (3.7). `overflow-hidden` clips B's off-arc cards. |
| Chat intro | A1/A2/A3 run **inside** `#chat-pane`. A1/A2 already do (their parent is `h-full` flex-center). A3 needs the one-word `fixed`→`absolute` change. |
| Grid entrance | B1 runs inside `#library-pane`. Works unmodified because B8 observes `stageRef`, not `window` — geometry re-measures against the half-width pane on its own. |
| Responsive | Below `md`, panes stack. At half width, B's `cardRatio: 0.21` falls to the 150px `minCardWidth` clamp; re-tune props (§5B). |
| Theme winner | **A's `app/globals.css`** — the only complete token set, and what all 57 shadcn components compile against (3.6). |

**State layer → `zustand`.**

| | zustand (recommended) | React Context |
|---|---|---|
| Streaming re-renders | Grid subscribes via selector to `items` only. `setMessages` fires **once per streamed chunk** (`chat-shell.tsx:139-141`) and never touches the grid. | A provider above both panes re-renders the grid subtree on every chunk — while GSAP drives 12–20 cards at 60fps. This is the concrete disqualifier. |
| Fit with B's architecture | B is refs-not-state by design (`library-grid-prompt.md:142-165`). The ticker can read `useLibrary.getState()` outside React entirely — zero re-renders. | No equivalent escape hatch. |
| Cost | one ~1.2 KB dep | none |

Store shape: `{ items: LibraryItem[]; addItem(i): void; selectedId: string | null; setSelected(id): void; isGenerating: boolean }`, where `LibraryItem extends SmoothSliderItem` (`library-grid-prompt.md:63-69`). Keep `messages` **local to `ChatShell`** — only finished creatives enter the store.

*Zero-new-deps fallback:* split into two contexts (`LibraryStateContext` + `LibraryDispatchContext`) and keep `messages` local. Workable, but the grid still re-renders on every `items` change with no selector granularity.

---

## 5. Port checklist

### 5A — Chat assistant (6 edits)

| # | File:line | Edit |
|---|---|---|
| 1 | `app/page.tsx:1-5` | Replace `redirect("/chat")` with the §4 split-screen root. |
| 2 | `components/chat/chat-shell.tsx:188` | `h-dvh` → `h-full`. Keep `relative`, keep `bg-stone-50`, keep the inline boxShadow. |
| 3 | `components/chat/composer.tsx:206` | `fixed` → `absolute`. Keep `bottom-4 left-0 right-0 px-4 pointer-events-none z-10` and the `composer-intro` class. |
| 4 | `components/chat/composer.tsx:207` | *(optional fit)* `max-w-2xl` → `max-w-xl`. |
| 5 | `components/chat/composer.tsx:316` | Define `animate-bounce-subtle` in `app/globals.css`, or remove the class (3.9). |
| 6 | `styles/globals.css` | Delete — dead file (3.3). |

**No edits needed:** `message-list.tsx`, `message-bubble.tsx`, `animated-orb.tsx`, `typing-indicator.tsx`, `analysis-word-span.tsx`, `markdown-renderer.tsx`, `audio-waveform.tsx`, `app/globals.css`, `app/layout.tsx`, `lib/utils.ts`, all 57 `components/ui/*`. `MessageList` is already pane-relative and already owns its scroll container.

### 5B — Arc Flow Carousel (7 edits)

| # | Target | Edit |
|---|---|---|
| 1 | new `components/ui/arc-flow-carousel.tsx` | Paste `library-grid-prompt.md:16-565` verbatim. |
| 2 | new `lib/library-items.ts` | Move `VAULT_IMAGES` + `DEFAULT_META` + `defaultItems` (`:21-46`) out of the component (3.12). |
| 3 | component `:471` | `h-dvh w-full` → `h-full w-full`. Keep `relative overflow-hidden select-none`. |
| 4 | component `:543` | `text-[1.4vw]` → `text-sm` (or `text-[clamp(11px,1.1cqw,14px)]` with `@container` on the pane). |
| 5 | component `:548` | `text-[1.1vw]` → `text-xs`. |
| 6 | call site (from `library-grid-prompt.md:576-591`) | Re-size for a half-width pane: `cardRatio` 0.21 → ~0.34, `maxCardWidth` 320 → ~240. Keep `wheelControl="horizontal"` explicit (3.8). Pass `items` from the zustand store — the `items` prop already exists (`:72,113`), no component change. |
| 7 | `package.json` | Add `gsap@^3.13` (3.1). |

**No edits needed:** `measure()` / `ResizeObserver` (`:169-224`), the ticker (`:227-341`), pointer/wheel/key handlers (`:344-463`), reduced-motion (`:48-61`), card markup (`:493-561`). No animation is rewritten — only re-parented and re-sized.

---

## 6. Unclear items and questions

| # | Item | Question |
|---|---|---|
| **Q1** | **Template B identity.** The repo has one folder + one integration-prompt `.md`, and the component is a GSAP **arc carousel**, not a 21st.dev grid (§0). | **Blocking.** Is `ArcFlowCarousel` the intended right-hand "creative library", or is there a separate grid template not yet in the repo? Everything above assumes the former. |
| Q2 | **Dead CSS.** `.gradient-text-animated` (`globals.css:128-142`), `.analysis-word-gradient` (`145-159`), `.streaming-word`+`blur-reveal` (`174-188`), `ripple-wave` (`210-219`), `orb-float-1..4` (`244-344`) + the overridden `.orb-circle-*` block (`347-361`). Zero TSX references. | Not assuming these are unused. Delete, or were they staged for the ad-creative pass? |
| Q3 | `animate-bounce-subtle` (`composer.tsx:316`) — used, never defined. | Restore the keyframe or drop the class? |
| Q4 | `components/ui/` — 57 files, only `button.tsx` and `dropdown-menu.tsx` imported. | Leave all (tree-shaken, no cost) or prune to the two? |
| Q5 | `hooks/use-mobile.ts` ≡ `components/ui/use-mobile.tsx`; `hooks/use-toast.ts` ≡ `components/ui/use-toast.ts` — byte-identical, none imported. | Leave, or collapse to `hooks/`? |
| Q6 | Model switcher: `AI_MODELS` (`composer.tsx:20-26`) + `public/images/{google.webp,gpt.png,claude.svg}`. | Keep the Gemini/GPT-4o/Claude picker in an ad-engine demo, or pin one model? |
| Q7 | **Sound effects.** Launch chime on mount (`message-list.tsx:19,39-43`), click + record (`composer.tsx:100,106`) — remote blob URLs, `.catch()`-swallowed. | Autoplay may be browser-blocked **and** will be audible in the Loom recording. Keep, or mute for the pitch? |
| Q8 | 8 base64 stock JPEGs, ~145 KB (`library-grid-prompt.md:22-29`). | Replace with generated ad creatives before the pitch, or keep as placeholders? |
| Q9 | `app/chat/page.tsx` + its own metadata. | Keep `/chat` as a standalone route alongside the new `/`, or collapse into one? |
| Q10 | `next-themes` + `components/theme-provider.tsx` installed but never mounted; `.dark` tokens defined but unreachable. | Dark mode intentionally off for the demo? |
| Q11 | `next.config.mjs` `typescript.ignoreBuildErrors: true` (3.14). | Leave for demo speed, or flip on so the merge can't hide type breakage? |
