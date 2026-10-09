---
name: ЛидСливс24
description: A deadpan amoCRM clone built to make sure the client never buys, plus its straight-faced marketing landing.
colors:
  sidebar-navy: "#13304f"
  sidebar-navy-top: "#0f2742"
  sidebar-text: "#9fb3c8"
  action-blue: "#2f80ed"
  action-blue-hover: "#1f6fdc"
  action-blue-border: "#2268c9"
  link-blue: "#0057a9"
  anti-coral: "#ff5b36"
  anti-coral-hover: "#f04a24"
  anti-coral-soft: "#fff0eb"
  success-green: "#27ae60"
  success-soft: "#e6f6ec"
  danger-red: "#e2574c"
  danger-soft: "#fdecea"
  warning-amber: "#e4b248"
  market-lime: "#d7f56b"
  ink-text: "#363b44"
  muted-grey: "#92989b"
  stage-title-grey: "#6b6d72"
  line-grey: "#c5c5c5"
  line-soft: "#e8eaeb"
  input-border: "#d7dadc"
  workspace-grey: "#f5f5f5"
  surface-white: "#ffffff"
  widgets-grey: "#e4e4e4"
  row-hover: "#f2f7fd"
  toast-navy: "#23384c"
  landing-sky: "#1d6fb8"
  landing-sky-deep: "#175c9b"
  landing-coral-hi: "#ff7452"
  landing-ink: "#0e2238"
  landing-paper: "#f2f5f8"
  landing-muted: "#5b636e"
  landing-line: "#dde3e9"
  landing-on-navy-soft: "#c3d3e4"
typography:
  crm-title:
    fontFamily: "PT Sans, Arial, sans-serif"
    fontSize: "18px"
    fontWeight: 700
    lineHeight: 1.35
  crm-section-header:
    fontFamily: "PT Sans Caption, PT Sans, Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 700
    letterSpacing: "1px"
  crm-body:
    fontFamily: "PT Sans, Arial, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.35
  crm-body-sm:
    fontFamily: "PT Sans, Arial, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.35
  crm-label-caps:
    fontFamily: "PT Sans Caption, PT Sans, Arial, sans-serif"
    fontSize: "12px"
    fontWeight: 700
    letterSpacing: "0.5px"
  crm-table-head:
    fontFamily: "PT Sans Caption, PT Sans, Arial, sans-serif"
    fontSize: "11px"
    fontWeight: 700
    letterSpacing: "0.6px"
  landing-display:
    fontFamily: "Sofia Sans Extra Condensed, PT Sans, Arial, sans-serif"
    fontSize: "clamp(60px, 21vw, 96px)"
    fontWeight: 900
    lineHeight: 0.86
    letterSpacing: "0"
  landing-headline:
    fontFamily: "Sofia Sans Extra Condensed, PT Sans, Arial, sans-serif"
    fontSize: "clamp(40px, 10vw, 72px)"
    fontWeight: 800
    lineHeight: 0.92
  landing-lead:
    fontFamily: "PT Sans, Arial, sans-serif"
    fontSize: "19px"
    fontWeight: 400
    lineHeight: 1.45
  landing-body:
    fontFamily: "PT Sans, Arial, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.55
rounded:
  chip: "3px"
  base: "4px"
  panel: "8px"
  pill: "10px"
  sheet: "14px"
  round: "50%"
spacing:
  card-gap: "6px"
  control-gap: "8px"
  column-gap: "12px"
  field-gap: "14px"
  modal-pad: "20px"
  page-gutter: "24px"
  landing-gutter: "20px"
  landing-section: "72px"
components:
  button-default:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.ink-text}"
    typography: "{typography.crm-label-caps}"
    rounded: "{rounded.base}"
    padding: "0 14px"
    height: "38px"
  button-primary:
    backgroundColor: "{colors.action-blue}"
    textColor: "{colors.workspace-grey}"
    typography: "{typography.crm-label-caps}"
    rounded: "{rounded.base}"
    padding: "0 14px"
    height: "38px"
  button-primary-hover:
    backgroundColor: "{colors.action-blue-hover}"
  button-anti:
    backgroundColor: "{colors.anti-coral}"
    textColor: "{colors.surface-white}"
    typography: "{typography.crm-label-caps}"
    rounded: "{rounded.base}"
    padding: "0 14px"
    height: "38px"
  button-anti-hover:
    backgroundColor: "{colors.anti-coral-hover}"
  button-danger:
    backgroundColor: "{colors.danger-red}"
    textColor: "{colors.surface-white}"
    rounded: "{rounded.base}"
    height: "38px"
  button-sm:
    padding: "0 10px"
    height: "30px"
  input:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.ink-text}"
    typography: "{typography.crm-body}"
    rounded: "{rounded.base}"
    padding: "0 10px"
    height: "36px"
  tag:
    backgroundColor: "#e9eef3"
    textColor: "#50606b"
    rounded: "{rounded.chip}"
    padding: "0 7px"
    height: "20px"
  tag-hot:
    backgroundColor: "{colors.anti-coral-soft}"
    textColor: "#b8381a"
  page-header:
    backgroundColor: "{colors.surface-white}"
    typography: "{typography.crm-section-header}"
    padding: "0 24px"
    height: "64px"
  sidebar:
    backgroundColor: "{colors.sidebar-navy}"
    textColor: "{colors.sidebar-text}"
    width: "65px"
  deal-card:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.ink-text}"
    rounded: "{rounded.base}"
    padding: "6px 8px 7px"
  kanban-column:
    backgroundColor: "{colors.workspace-grey}"
    width: "290px"
  toast:
    backgroundColor: "{colors.toast-navy}"
    textColor: "{colors.surface-white}"
    rounded: "{rounded.base}"
    padding: "12px 14px"
  modal:
    backgroundColor: "{colors.surface-white}"
    rounded: "{rounded.base}"
    width: "520px"
  tabbar-mobile:
    backgroundColor: "{colors.surface-white}"
    textColor: "#8a949b"
    height: "58px"
  landing-button-coral:
    backgroundColor: "{colors.anti-coral}"
    textColor: "{colors.landing-ink}"
    rounded: "{rounded.base}"
    padding: "0 26px"
    height: "56px"
  landing-button-coral-hover:
    backgroundColor: "{colors.landing-coral-hi}"
  landing-button-line:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.sidebar-navy}"
    rounded: "{rounded.base}"
    padding: "0 26px"
    height: "56px"
  landing-button-ghost:
    textColor: "{colors.surface-white}"
    rounded: "{rounded.base}"
    padding: "0 16px"
    height: "44px"
---

# Design System: ЛидСливс24

## Overview

**Creative North Star: "The Stone-Faced Back Office"**

ЛидСливс24 is a parody that only works if nobody blinks. The CRM is a faithful, dense, working amoCRM clone: a 65px navy rail, 64px white section headers, a grey workspace, caps-labelled kanban columns with 2px stage lines, three-column deal cards, amo analytics and a marketplace. Nothing in the chrome is a joke. The joke lives in copy, data and inverted logic, and in exactly one visual deviation: the coral «anti» action that leads away from the sale and is therefore the loudest thing on screen.

The system has two registers that share one palette. The **CRM** (primary, Operate mode) is quiet, grey, small-type and information-dense, measured off amoCRM. The **landing** (sub-system, Persuade mode, classes prefixed `ld-`) is a straight-faced SaaS page: a saturated sky-blue field owns the first screen and the finale, white and cool paper alternate between, navy carries dense blocks, and coral is reserved for buttons and the moments where a lead gets «слит». Its headlines switch to a condensed 800/900 caps face; its body stays PT Sans; its demonstrations are rebuilt CRM components (feed notes, list table, market tiles, incident card), so the landing visibly belongs to the product.

Density is amo density: 13–15px text, 38px controls, 6px between cards, 12px between columns. Depth is soft and navy-tinted, used for things that float (menus, modals, toasts, the dragged card), never for resting surfaces.

**Key Characteristics:**
- Pixel-faithful amoCRM chrome; humour carried by words, not by styling.
- One coral anti-action per screen; blue is the normal, legitimate action.
- PT Sans everywhere in the CRM, PT Sans Caption bold caps for section headers, column names, buttons and table heads.
- Flat bordered surfaces at rest; navy-tinted shadows only on floating layers.
- Mobile follows the amo app: bottom tab bar, one stage per screen, bottom sheets.
- Landing shares the palette but speaks louder: sky field, condensed caps display, CRM components as proof.

## Colors

An amo-neutral grey workspace framed by deep navy, with a single legitimate blue for actions and a single coral for the inverted, anti-sale action.

### Primary
- **Ledger Navy** (sidebar-navy): the 65px sidebar rail, the «Отмаз» floating button, and on the landing the dense navy sections and the logo tile. Its darker step **Rail Head Navy** (sidebar-navy-top) is the account block at the top of the rail. Navy also tints every shadow in the system.
- **Ordinary Action Blue** (action-blue, hover action-blue-hover, edge action-blue-border): primary buttons, focus outlines and input focus borders, switches, checkboxes, the active mobile tab. It is the colour of doing the normal CRM thing.
- **Deal Link Blue** (link-blue): every link and deal title (deal cards render the deal name in this blue, as amo does).

### Secondary
- **Anti Coral** (anti-coral, hover anti-coral-hover, soft anti-coral-soft): the «anti» hero button that leads away from the sale, the anti menu item, the «hot» tag, and on the landing the CTA buttons, the strike through «НЕ», and text selection. On the landing, text on coral is **Deep Ink** (landing-ink), never white.

### Tertiary
- **Landing Sky** (landing-sky, deep step landing-sky-deep): the landing's own field; first screen, top bar, finale, sticky bar. It does not appear in the CRM.
- **Status set**: success-green / success-soft (won-equivalent states, confirmations), danger-red / danger-soft (badges, destructive modal heads, «Инцидент» states), warning-amber (warnings), market-lime (the «Установлено» plate in СливМаркет only).
- **Stage colours** are amo's pastel stage palette, applied per pipeline stage as the 2px column line, the drag-over column tint and stage chips: `#99ccff`, `#ffff99`, `#ffcc66`, `#f3beff`, `#ffcccc`, `#f9deff`, `#d0d0d0` (Оплата), `#87f2c0` (Слит), `#ff8f92` (Инцидент). They are data, not UI chrome.

### Neutral
- **Office Ink** (ink-text): all body text in both surfaces.
- **Muted Grey** (muted-grey): secondary meta, field labels, placeholder-adjacent copy. **Stage Title Grey** (stage-title-grey): column names and card footers.
- **Workspace Grey** (workspace-grey): the CRM canvas behind columns and tables. **Surface White** (surface-white): cards, headers, modals, tables. **Widgets Grey** (widgets-grey): dashboard widget field and feed month chips.
- **Line Grey** (line-grey) for card and quick-add borders; **Soft Line** (line-soft) for header, table and menu dividers; **Input Edge** (input-border) for fields.
- **Row Hover** (row-hover): pale blue hover for table rows and menu items.
- **Toast Navy** (toast-navy): the standard toast background.
- Landing neutrals: **Cool Paper** (landing-paper) alternating sections, **Landing Muted** (landing-muted) leads and meta, **Landing Line** (landing-line) rules, **On-Navy Soft** (landing-on-navy-soft) secondary text on navy.

### Named Rules
**The One Coral Rule.** The coral anti-action appears at most once per CRM screen. Everything that leads away from a sale is the most visible thing; there is only ever one of it.

**The Legitimate Blue Rule.** Blue means the normal, amo-standard action (save, add, primary). Never paint an anti-action blue or a normal action coral; the inversion depends on the two never trading places.

**The Stages Are Data Rule.** Pastel stage colours appear only where a stage is represented (column line, chip, drag-over tint, stage picker). They never become button, text or background colours elsewhere.

## Typography

**CRM Font:** PT Sans (with Arial, sans-serif), weights 400, 700 and 400 italic
**CRM Label Font:** PT Sans Caption 700 (with PT Sans, Arial)
**Landing Display Font:** Sofia Sans Extra Condensed 800/900 (with PT Sans, Arial)

**Character:** The CRM speaks in amo's plain humanist sans with small bold caps for structure; it reads as an office tool, which is the point. The landing adds a tall, condensed, shouting caps face so the parody headline lands like a real SaaS hero.

### Hierarchy
- **CRM Title** (700, 18px): modal titles, empty-state titles.
- **CRM Section Header** (Caption 700, 14px, 1px tracking, uppercase): the section name in the 64px page header.
- **CRM Body** (400, 15px, 1.35): base text, inputs, table cells, menu items, deal titles.
- **CRM Body Small** (400, 13px): card meta, field labels, column meta, demo bar.
- **CRM Label Caps** (Caption 700, 12px, 0.5px tracking, uppercase): buttons (11px on the small size), column names (1px tracking), collapsed-column vertical labels.
- **CRM Table Head** (Caption 700, 11px, 0.6px tracking, uppercase, #8a9195): amo-style table headers.
- Scale tokens in code: 11 / 13 / 15 / 18 / 23px.
- **Landing Display** (900, clamp(60px, 21vw, 96px), 0.86, uppercase): the hero line only, preceded by an 800 question line at clamp(26px, 7.4vw, 36px).
- **Landing Headline** (800, clamp(40px, 10vw, 72px), 0.92, uppercase, max 18ch, balanced): section headings.
- **Landing Lead** (400, 19px, 1.45, max 58ch): section intros and the hero offer (max 34ch).
- **Landing Body** (400, 17px, 1.55): landing running text.

### Named Rules
**The Caption Caps Rule.** Structural labels in the CRM (section header, column names, buttons, table heads) are PT Sans Caption bold uppercase with 0.5–1px tracking. Running text is never set in caps.

**The Condensed Face Stays Home Rule.** Sofia Sans Extra Condensed belongs to the landing's headings, buttons and logo. It never enters the CRM.

## Layout

**CRM shell.** A fixed full-viewport flex shell: 65px navy rail on the left, then the main column. Every section opens with a 64px white header (title, search field separated by a 1px divider, meta, actions) at 24px horizontal padding. Content scrolls inside the main column, not the page.

**Kanban.** Columns are 290px wide with 12px between them and 24px page gutters; cards stack with 6px gaps. Column heads are sticky, centred, and end in a 2px line in the stage colour. «Оплата» and «Инцидент» collapse to 56px vertical strips. Scrollable lists reserve 76px at the bottom so the floating «Отмаз» button never covers the last row.

**Rhythm.** Controls are 38px (30px small); inputs 36px; table rows 40px; fields stack with 5px label gap and 14px between fields; modals pad 18–20px.

**Mobile (max-width 767px).** The rail disappears and a 58px white bottom tab bar takes over (24px icons, 11px labels, blue active). Page header drops to 52px with search and meta hidden; only buttons marked to keep stay. The pipeline shows one stage per screen with stage tabs. Modals become bottom sheets with a 14px top radius and a 38×4px grab handle; toasts sit above the tab bar; «Отмаз» shrinks to a 48px round button.

**Landing.** Max content width 1200px with 20px gutters; sections pad 72px vertically (finale 88/96px), alternating sky, white, cool paper and navy bands. The hero is a two-part grid: copy and coral CTA on the left, a live mini-pipeline on the right. Breakpoints in use: 600, 760, 900, 1100px (min-width), with a 719px max-width rule for the sticky mobile CTA bar.

## Elevation & Depth

Surfaces are flat and bordered at rest, as in amo; depth is reserved for layers that float above the workspace. All shadows are navy-tinted (rgba of #13304f), never neutral black, except tiny control details.

### Shadow Vocabulary
- **Pop** (`0 6px 24px rgba(19,48,79,0.16), 0 1px 4px rgba(19,48,79,0.1)`): menus, modals, toasts.
- **Drag** (`0 10px 28px rgba(19,48,79,0.22)`): the lifted deal card following the cursor, rotated 2deg.
- **Card hover** (`0 2px 6px rgba(19,48,79,0.1)`): deal card on pointer hover, with the border darkening to #a7aeb3.
- **Quick form** (`0 2px 10px rgba(19,48,79,0.08)`): inline add forms in columns.
- **Focus halo** (`0 0 0 3px rgba(47,128,237,0.15)`): focused inputs.
- **Anti glow** (`0 2px 8px rgba(255,91,54,0.28)`): the coral anti button only.
- **FAB** (`0 6px 18px rgba(19,48,79,0.35)`): the «Отмаз» floating button.
- Landing: deep negative-spread navy shadows under showcase objects (mini-pipeline `0 28px 60px -24px rgba(6,24,46,0.6)`), and the coral CTA `0 8px 20px -8px rgba(14,34,56,0.55)`, deepening on hover.

### Named Rules
**The Flat Until It Floats Rule.** Cards, columns, tables and headers carry a 1px border and no shadow at rest. A shadow means the element is above the page: open, hovered, dragged or floating.

## Shapes

Corners are small and practical: 4px on buttons, inputs, cards, menus, modals and toasts; 3px on tags, pills and swatches; 8px on landing showcase panels (boards, feeds); 10px on switches and counters; 14px only on mobile bottom sheets; circles for avatars, the chat button and the mobile FAB. Borders are 1px solid hairlines; dashed borders mean "a place for something" (quick-add slot, the drag placeholder). The landing adds a 2px ink top rule on comparison tables and 2px outlines on its line and ghost buttons.

## Components

### Buttons
Compact, caps, amo-shaped.
- **Shape:** gently squared (4px), 38px tall, 14px side padding; small size 30px.
- **Default:** white with soft line border, ink text; hover to #fafafa with a #cfd3d6 border; press nudges 1px down.
- **Primary:** Ordinary Action Blue with a darker blue border and near-white text.
- **Anti:** Anti Coral with a #e04a27 border, white text and the anti glow. One per screen.
- **Danger:** danger red, white text. **Ghost:** transparent, 4% black wash on hover. **Icon:** 38px square.
- **Disabled:** 55% opacity, no press motion.
- **Landing buttons:** 56px, 4px radius, condensed 800 caps at 24px. Coral with ink text and a lifting shadow (hover lightens to coral-hi, rises 1px, arrow slides 3px); Line is navy-outlined white that fills navy on hover; Ghost is a 44px white-outlined button on sky that inverts to white on hover.

### Chips
- **Tags:** 20px, 3px radius, #e9eef3 with #50606b text; the hot tag is coral-soft with #b8381a text.
- **Stage chips / stage pills:** stage colour dot or fill with a count, used on mobile stage tabs and stage pickers.

### Cards / Containers
- **Deal card:** white, 1px line-grey border, 4px radius, padding 6px 8px 7px. Top row contact + date (13px), deal title in link blue (15px), joke row (12px), footer in stage title grey. A «more» button appears on hover (always visible on touch). A freshly dropped card flashes pale yellow (#fff5d1) for 800ms.
- **Kanban column:** transparent on workspace grey; on drag-over the whole column and its sticky head tint to 24% of the stage colour.
- **Tables:** white, soft-line frame, 40px rows, caps heads with vertical dividers, row hover in Row Hover blue, tabular numerals right-aligned.
- **Modal:** white, 4px radius, pop shadow, 520px (860px wide variant); header with bottom rule, footer on #fafafa with right-aligned actions. Danger variant paints the header red.

### Inputs / Fields
- **Style:** 36px, Input Edge border, 4px radius, white; hover border #bfc4c7.
- **Focus:** border turns action blue with a 3px 15% blue halo; caret is action blue.
- **Label / error:** 13px muted label above, 13px danger-red error below.
- **Switch:** 36×20 pill, grey off, blue on, white 16px knob.

### Navigation
- **Sidebar:** 65px navy rail; 26px line icons (stroke 1.4) over 11px labels in sidebar text; hover to white with a 6% white wash; active is white, bold, stroke 1.8 on a 7% white wash. Red count badges sit at the icon's top right. A round 42px chat button sits at the bottom.
- **Page header:** see Layout; title in Caption caps 14px.
- **Mobile tab bar:** white, top hairline, grey items, blue bold active.

### Kanban Drag (signature)
Mouse drag like amo: the lifted card follows the cursor in a fixed layer, rotated 2deg with the drag shadow and a 160ms lift; the source slot remains as a dashed, 35%-opacity placeholder; the target column tints in its stage colour; the cursor is «grabbing» everywhere during the drag.

### Toasts
4px radius, Toast Navy, white 14px text, 18px icon; success icons in #7be0a6, danger toasts in #9e2b22, achievement toasts white with a gold #f3d27a border. Bottom right on desktop, above the tab bar on mobile.

### «Отмаз» FAB (signature)
A 44px navy capsule with a peach (#ffb39f) icon and bold 14px label, bottom right of the workspace; it rises 1px on hover. On mobile it becomes a 48px navy circle above the tab bar.

### Landing CRM Echoes (signature)
The landing demonstrates the product with rebuilt CRM pieces rather than illustrations: feed notes (white, 1px #e0e3e5 border, 4px radius, 36px round icon on #e8f1fb) on a workspace-grey panel with a month chip, a CRM-style list table, market tiles, and an incident card whose fields use the CRM line grey. These use CRM greys inside the landing's palette.

## Do's and Don'ts

### Do:
- **Do** measure new CRM screens against amoCRM: 65px rail, 64px header, 38px buttons, 290px columns, 6px card gaps, PT Sans 15px body.
- **Do** keep structural labels in PT Sans Caption bold caps (11–14px, 0.5–1px tracking).
- **Do** use action blue for every normal action and keep coral to one anti-action per screen.
- **Do** keep resting surfaces flat with 1px hairlines; add the navy-tinted pop shadow only to menus, modals, toasts and the dragged card.
- **Do** carry stage identity through the 2px stage line, stage chips and drag-over tints only.
- **Do** switch to bottom sheets, a bottom tab bar and one stage per screen below 768px.
- **Do** set ink (#0e2238) text on landing coral, and white on landing sky and navy.
- **Do** build landing proof sections out of real CRM components, so the landing looks like the product.

### Don't:
- **Don't** put the joke in the styling: no novelty colours, wobbly shapes or meme typography in the CRM; humour lives in copy and data.
- **Don't** use the amoCRM logo or name anywhere in the product.
- **Don't** use Sofia Sans Extra Condensed or the landing sky blue inside the CRM.
- **Don't** place two coral anti-actions on one CRM screen.
- **Don't** use neutral black shadows or shadows on resting cards, columns and tables.
- **Don't** use stage pastels as general-purpose UI colours.
- **Don't** round CRM controls beyond 4px; larger radii belong to switches, counters, landing panels and mobile sheets.
