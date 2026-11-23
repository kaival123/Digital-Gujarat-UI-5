# Digital Gujarat – redesign ("Aurora Ink")

## Identity
- **Palette** (`src/tokens.scss`): ink `#0b1020` / `#1a1d4d`, brand indigo `#4f46e5` → violet `#8b5cf6`, amber accent `#f59e0b`, cool neutrals (`#f6f7fb` page, `#fff` cards, `#e3e6f3` borders). Full dark-mode token set.
- **Type:** Sora (display) + Inter (body); fluid `--fs-h1/h2/h3`.
- **Shape/elevation:** radii 12 / 16 / 24 / 32 / pill; tinted layered shadows; brand glow for primary actions.
- **Signature elements:** dark aurora banners (home hero + every inner-page banner), floating glass pill header, pill buttons with gradient primary, eyebrow chips, rounded aurora footer, dotted-grid texture.
- **Theme picker** (top bar) now offers Indigo (default), Sky, Emerald, Teal, Rose, Amber; every colour comes from `--brand*`, so the whole site re-tints.
- Variables renamed: `--dg-orange*`→`--brand*`, `--dg-accent-2/3`→`--brand-2/3`, `--dg-navy*`→`--ink*`, `--grad-navy`→`--grad-ink`.

## Checklist (✔ = implemented and viewed in the browser unless noted)
**Shared**
- ✔ Top bar · ✔ floating header + nav + Services dropdown · ✔ mobile menu (below 1180 px)
- ✔ Footer · ✔ Loader (index.html + main.ts progress) · ✔ Ctrl+K palette · ✔ theme picker · ✔ page banner (`app-page-hero`)
- ✔ Buttons, inputs, selects, select-buttons, tabs, accordion, p-card, tables, paginator, dialogs, messages (PrimeNG skins in `pages.scss`)
- ✔ a11y drawer on tokens (second pass fixed a dark-mode bug: tiles stayed white under light text)
**Home** – ✔ hero + slider · ✔ search card · ✔ ticker · ✔ explorer · ✔ stats · ✔ trending carousel · ✔ steps · ✔ promo · ✔ FAQ · ✔ glimpses slider (rebuilt as "timed cards" component) · ✔ partners marquee · ✔ holidays · ✔ CTA band
**Routes (all 22 + 404)** – `/`, `about-us`, `sugam-digital-gujarat`, `services/{citizen,digital-sevasetu,janseva,linked}`, `latest-update`, `faq`, `sitemap`, `feedback`, `feedback-dashboard`, `help-desk`, `videos`, `promotional-campaign`, `user-manual`, 6 policy pages, `**`.
- Viewed at 1440 px: home (all sections, light + dark), about, sugam, linked, latest-update, faq, sitemap, help-desk, videos, campaign, user-manual, feedback-dashboard, feedback.
- Also viewed at 1440 px in a second pass: services/citizen and services/janseva (digital-sevasetu shares the template, only its overflow at 375 px was checked), terms-conditions and accessibility-statement (the other four policy pages share that template).
- Overlays viewed: login menu, accessibility drawer (light + dark), video dialog, Services menu, Ctrl+K palette, theme picker with all six themes applied (Indigo, Sky, Emerald, Teal, Rose, Amber).

## Verification actually run
- `ng build` production: passes (initial 1.09 MB raw / 234 kB transfer).
- 375 px: all 22 routes + 404 → 0 px horizontal overflow, correct titles, 0 broken images on the 15 routes where images were counted.
- 768 px: home hero viewed. 1440 px dark mode: explorer, stats, FAQ, holidays viewed. Theme picker: Emerald applied site-wide then reset to Indigo. Services menu and Ctrl+K palette opened and viewed.
- Grep for old colours/fonts (orange hexes, old navies, Poppins/Lato/Plus Jakarta, `--dg-orange`) → none left in `src`.

## Not done / limits
- Not tested: Safari/Firefox, real devices, landscape phones, keyboard-only pass, screen readers, Lighthouse, slow-network loader behaviour, the drawer's high-contrast / invert / monochrome states, the image lightbox, the 404 page at desktop width. White text on the Amber theme button is only ~3:1 contrast.
- Per-page *layouts* of inner pages keep their original structure (cards/grids/tables); they were re-skinned and given the new banner, not re-composed.
- Bundle budget raised (warn 1.2 MB / error 1.5 MB) instead of trimming PrimeNG; images remain unoptimised PNG/JPG.
- Feedback form still has no backend (pre-existing). No functionality, routes or data were changed.

## Files modified
`src/tokens.scss` (new), `base.scss`, `hero.scss`, `home-sections.scss`, `pages.scss`, `anim.scss`, `responsive.scss`, `dropdown.scss`, `coverflow.scss`, `perf.scss`, `a11y.scss`, `a11y-drawer.scss`, `styles.scss`, `index.html`, `main.ts`, `app/app.ts` (theme list, variable names), `app/app.config.ts` (preset variable names), `app/app.html` (menubar breakpoint), `app/pages/home.html` (trending icon wrapper), `angular.json` (budget), `.claude/launch.json`, `docs/REDESIGN.md`. No new dependencies.

## Glimpses slider (rebuilt)
Replaces the expanding-panel slider with a native Angular port of the CodePen "Timed Cards Opening": `src/app/shared/glimpse-slider.ts` + `src/glimpses.scss`. A full-bleed stage shows the active photo; a strip of upcoming cards sits bottom-right; on change the next card grows from its slot to fill the stage while the old photo zooms out. Arrows, clickable cards, swipe, ←/→ keys, progress line (its animation end advances the slide), slide counter, "View photo" button (opens the existing lightbox). Autoplay pauses on hover/focus and while the lightbox is open; reduced-motion / "Pause animation" users get no timer and no grow animation. No Swiper/GSAP dependency added. Verified: next/prev/card click/lightbox via script, desktop + 375 px views, no overflow. Not verified: tablet width view, other browsers. The source photos are only 276×299 px, so they are shown whole in a framed picture over a blurred copy of themselves (never cropped or stretched across the stage); larger source images would make them sharper.

## About Us slider (restyled)
`src/coverflow.scss` + `AboutPage.pos()` now render the photos as a 3D stack ported from the CodePen "Dermal Health Science" carousel: the front card is sharp and raised; the other photos sit behind it to the left, smaller and fainter, and each change rotates the stack (0.8 s ease). Glass-style card frames; arrows, dots, click-a-card, swipe, ←/→ keys and the pause-on-hover autoplay are unchanged. Verified: next/prev/dot/click states via script, desktop + 375 px views, no overflow. Not verified: tablet width, other browsers.

## Hero slider (rebuilt, 3D glass slabs)
Inspired by the CodePen "3d threejs – slider" (acerabde/dPGKvdG), done in CSS 3D instead of WebGL (no three.js dependency). Each hero slide is a glass slab in a perspective stage; the active slab sits in front, neighbours recede left/right with rotateY, depth, blur and fade, and a 1 s glide plus a light sheen sweep plays on each change. Slides are doubled into a ring of 4 so wrap-around happens off-stage. Arrows, progress dots, swipe, ←/→ keys, autoplay (7 s; paused on hover/focus; off for reduced-motion / "Pause animation"). Off-stage slabs are `aria-hidden` + `inert`. Code: `home.ts` (hero* members), `home.html`, `hero.scss`. Replaced the PrimeNG carousel in the hero only.
Verified [Run]: next ×5 / prev / dot click cycle correctly, 1 `<h1>`, 0 overflow at 1440 and 375, mid-transition and settled views at 1440 and 375. Not verified: tablet width, other browsers, reduced-motion with OS setting, real-device performance (backdrop blur on large slabs).

## Hero: official structure + calm motion
Slider mechanics unchanged. Slide copy now reads as a government portal: (1) lockup — emblem seal + "Government of Gujarat / Official citizen services portal"; (2) **DIGITAL GUJARAT** wordmark with a small saffron-white-green rule; (3) the slide headline; (4) lead, CTAs, key facts. The wordmark is `aria-hidden` (the single `<h1>` stays visually hidden). Motion: removed perpetual floating, orbiting and spinning (`hero-mesh`, orbit, photo frame, glass chips); entry is one short staggered 0.6 s fade-up (14 px). Files: `app/pages/home.html`, `hero.scss`. Verified [Run]: 1440 and 375 px views, 0 overflow, 1 h1. Mid-transition frames were seen, settled desktop view confirmed; tablet and other browsers not checked.

### Hero photo area (official)
Orbit ring and three floating glass chips removed. The photo has a thin saffron-white-green edge and a single docked white info card (20+ services online · Track applications · Secure SSO login). Slab transitions are now disabled until the page loader has gone (`heroReady`), so slabs no longer glide into place on first paint. Files: `home.html`, `home.ts`, `hero.scss`. Verified [Run]: settled 1440 px view; 375 px layout of the card not re-viewed after this change.

### Hero blob animation
The photo is clipped to an organic blob whose border-radius morphs slowly (14 s loop, `blobMorph`); two soft gradient blobs (indigo→violet, amber→rose) drift and morph behind it (18 s / 23 s, `blobDrift`) via `.hero-visual::before/::after`. All blob motion is off under `prefers-reduced-motion` and the in-site "Pause animation" setting. Slider autoplay now starts only after the page loader has gone. Files: `hero.scss`, `home.ts`. Verified [Run]: settled 1440 px view. Not checked: 375/768 px blob sizing, other browsers.

### Hero photo blob (pen-matched; background blobs kept)
Replaced the earlier multi-blob version: the photo is now a single liquid blob using the exact keyframes/timing of CodePen Murmi/bGjExXo ("animated blob shaped photo"): `border-radius` 60% 40% 30% 70% / 60% 30% 70% 40% ↔ 30% 60% 70% 40% / 50% 60% 30% 60%, 7 s ease-in-out infinite (`liquid` in `hero.scss`). The two drifting gradient background blobs (`.hero-visual::before/::after`, `blobDrift`) are kept. Off under reduced-motion / "Pause animation". Verified [Run]: computed border-radius changes over time at ~800 px pane width; 1440 and 375 px not re-viewed.

### Colour theme: Teal Green is now the default
Default brand `#0f766e` → `#059669` → `#99f6e4` (white text on the brand ≈ 5:1), amber accent kept. Ink surfaces shifted to deep green-teal (`#06181c` / `#0b3b3f`), neutrals to cool green-greys, dark mode retinted, page loader gradients updated. Files: `tokens.scss`, `index.html`, `hero.scss` (one fallback), `app/app.ts` (theme list: "Teal Green" first/default; old "Teal" removed as a duplicate; Indigo, Sky, Emerald, Rose, Amber remain in the picker; stored choice `dg-theme` still honoured). Verified [Run]: hero and search card at 1440 px. Not re-viewed: other sections/pages, dark mode, the picker's other themes on the new ink surfaces, contrast measurements.

### Colour theme: "Govt Blue" is now the default (replaces Teal Green as default)
Brand `#1e40af` → `#2563eb` → `#bfdbfe` (white on brand ≈ 8.7:1), saffron/amber accent kept, navy ink surfaces (`#0a1730` / `#10285a`), cool blue-grey neutrals, dark mode retinted, loader updated. Picker: Govt Blue (default), Teal Green, Indigo, Sky, Emerald, Rose, Amber. Files: `tokens.scss`, `index.html`, `hero.scss`, `app/app.ts`. Verified [Run]: hero at 1440 px. Not re-viewed: other sections/pages, dark mode, contrast measurements.

## Premium redesign below the banner ("Ivory & Ink") — `src/premium.scss`
**Locked (not touched):** the home banner (`.hero` and its slider/blob/info card), the inner-page banner (`app-page-hero` / `.page-hero`), and the top bar + floating header that sit on the banner. `premium.scss` is the last partial in `styles.scss`, reads only its own `--p-*` tokens, and targets only zones below the banner (`.quick`, `.ticker`, `.section`, `.stats`, `.promo`, `.cta-band`, `.site-footer` and the inner-page primitives), so the banner keeps rendering from `tokens.scss` unchanged. No existing token was edited. `body` background now uses `--p-bg`; text colour is set on `main`, not `body` (a body colour change leaked into the header and was reverted).
**Direction:** warm porcelain surfaces, deep ink text, champagne-gold hairlines, Fraunces serif display (added to the Google Fonts link in `index.html`), 18/26/34 px radii, softer layered shadows. Primary buttons are deep navy with a gold ring on hover (promo uses gold). Theme picker still works: the navy/links/glows follow `--brand`.
**Redesigned:** quick search card · latest ticker · service explorer (underline tabs, gold-edge cards) · stats (editorial numbers strip, was dark gradient band) · trending carousel + arrows/dots · how-it-works timeline · Sugam promo (inset navy panel) · FAQ accordion (rule-based) · glimpses slider (frame, controls, serif titles) · important-links marquee (grayscale → colour) · holidays panel + calendar · closing CTA (ivory/gold) · footer (navy, gold headings) · About photo slider controls · inner pages: toolbars, service cards, news list, sitemap lists, feedback form, help desk, video cards, campaign cards/gallery, manuals, policy prose, tabs, tables, paginator, inputs, selects, dialogs, 404.
**Overlays restyled (styles only):** Ctrl+K palette and the accessibility drawer panel (navy/gold header, serif titles, gold active states; high-contrast profile excluded via `:not(.a11y-contrast)`). **Not redesigned on purpose:** top bar, header and the floating accessibility button (they sit on the banner).

## Structure layer: new layouts, not just new skins (`src/structure.scss`, `src/structure-pages.scss`)
Feedback was that the premium pass only re-skinned the old layouts. Section structures below the banner were rebuilt (templates changed; data, routes and behaviour kept):
**Home:** find band (lead + search left, asymmetric category tiles right) · service atlas (sticky numbered category rail + two-column service list; tabs are now a `tablist` driven by `cat`/`catData` signals instead of PrimeNG Tabs) · figures (statement + bento numbers, wide navy first/last tiles) · trending (intro column + 2-up carousel) · how it works (sticky heading + stacked numbered rows) · Sugam promo (standee breaks out of the panel) · FAQ (accordion + dark help card) · glimpses / links (left-aligned head rows) · links (two opposing marquee rows; second is `aria-hidden`) · holidays (calendar first) · closing CTA (centred statement with rings) · footer (helpdesk band on top, wider brand, two-column quick links).
**Inner pages:** service lists (sticky filter rail + category nav + horizontal cards) · latest update (related-portals rail + dated timeline) · videos (first video featured at 2×2) · policy pages (policy nav rail + document) · feedback (story column + form) · sitemap (numbered open columns) · about (copy first, photo stack second, numbered feature columns).
Locked as before: home banner, inner banners, top bar/header, floating accessibility button.
Verified [Run]: banner signatures unchanged (home 1440 + 375, `/faq` banner 1440); 46 route loads (23 routes × 375/1440): 0 overflow, 0 broken images, one `<h1>`, footer + help band present; atlas tab switch swaps the list (Citizen → Sugam); palette and drawer unaffected. Not verified: 768 px visuals, dark mode of the new layouts, keyboard order in the new rails, other browsers.

## Official layer: from "fancy" to institutional (`src/official.scss`, last in `styles.scss`)
Direction change: the premium look (serif italics, gold hairlines, glows, big radii, outlined numerals) was replaced with a government-portal language. Same lock as before: banner, top bar, header and floating accessibility button untouched; the layer only targets zones below the banner.
- **Fonts:** Noto Sans (+ Noto Sans Gujarati for Gujarati script) for all body and headings below the banner (`--p-font`, loaded in `index.html`; Fraunces removed). The banner keeps Inter/Sora. Headings 700, no italics.
- **Colour:** cool off-white page (`#f4f6fa`), white surfaces, hairline `#d5dce8` borders, solid brand blue (follows the theme picker) for buttons, links and numerals; saffron `#ff9933` / white / green `#138808` used as the tricolour accent (section-title bars, footer stripe, find-band top bar, stat tile tops, eyebrow bullets). Saffron text variant `#b45309` for contrast.
- **Shape/motion:** radii 4–12 px (was 18–34), flat cards with 1 px borders, no glows/gradients on cards, hover = border/shadow change instead of lifts, outlined numerals replaced by solid numerals.
- **Components:** promo, help card, footer, first stat tile = solid dark blue; CTA = light blue tint with 4 px blue top rule; ticker label solid blue; overlays (palette, accessibility drawer) follow the same tokens.
Design tokens changed in `premium.scss` (`--p-*`); layout from the structure layer is unchanged.

### Icon fixes (official layer)
1. Icons vanished on hover in brand-filled states (find-band tiles, active category/policy links, step rows, stat tiles): the hover colour was saffron on a brand background, invisible on the Amber/Orange themes. Icons now go white on any brand fill.
2. Video play buttons were a pale rounded square with a tiny glyph; now a 60 px (84 px featured) circle with a 1.5–2 rem play icon.
3. PrimeNG forces `.pi { font-size: var(--p-icon-size) }` (14 px), which ignored container font sizes and left icons tiny in 40–56 px tiles; glyph sizes are now set on the icons themselves (find-band, stats, perks, help card, steps, footer social, slider arrows, manuals, …).
Checked [Run]: a contrast audit of every `.pi` icon below the banner across 15 routes on the Amber theme found nothing under 2.2:1 except the decorative ticker bullet; hover on a find-band tile and the active category link verified visually/computed. Not checked: dark mode, Rose/other themes, every hover state on every page (hover can't be forced in the audit).

### Carousel / icon-button fix
The trending carousel arrows (and the holiday calendar's month arrows) showed no icon: icon-only buttons inherited the text-button padding (`0.72rem 1.25rem`) from the official layer, squeezing the SVG to 2 px (0 px in the calendar). Icon-only buttons now have no padding and are flex-centred; measured glyph offset from the button centre is 0/0 for the carousel prev/next, glimpse arrows and calendar arrows (the carousel arrows were 11 px too high). Checked at 1440 px via computed geometry; not re-viewed in a screenshot.

### Overflow + alignment pass
- **Overflow:** service cards overflowed (icon image 84 px + padding on `content-box` from `pages.scss`, spilling over the title); images in cards/lists are now `border-box` and the title column can shrink. Scripted audit of 19 routes × 375/768/1440 (children escaping their parent, clipped text, page-level overflow): only one hit remains, the sitemap link rows, which use a deliberate −10 px margin for the hover highlight.
- **Alignment:** card number badge and favourite heart share one centre line (both centred at the same y); icon+text buttons, tabs, tags and "more" links are inline-flex with centred icons. Scripted icon-vs-text audit (15 routes × 1440/375): remaining differences are intentional (arrow centred across a two-line tile, icon beside a wrapped paragraph).
Not covered: overlapping text that doesn't escape its parent box, vertical rhythm/spacing consistency, and nothing was checked by screenshot at desktop width.

### Alignment pass 2
Timeline (Latest Update): the dots sat ~10 px right of the vertical line (dot offset ignored the list's 8 px padding); now centred exactly (measured diff 0 px at 1200 px). Row-alignment audit of flex/grid rows (centre-line spread > 3 px) across 15 routes × 1440/768: no real mismatches (one false positive: the vertically stacked CTA column). Not covered: spacing rhythm and alignment at 375 px, no desktop screenshots.

### Holidays section restructured
Old: a small calendar card beside a text block with a lot of empty space. New (`home.html`, `home.ts` `today`, `official.scss`): section head row (eyebrow + title left, note right) → two panels of equal height: a solid blue **"Today" tile** (big day number, weekday, month/year, legend, PDF button; saffron top rule) and a **full-width calendar** (7 columns stretched across, 54 px day cells, blue weekday labels). Stacks on ≤800 px with the date shown beside the legend. Also forced the calendar's PrimeNG `p-motion` wrapper visible (it was left with inline `display:none` in my test browser, which hid the calendar). Verified [Run] at 1440 px by geometry (tile 340 px + calendar 832 px, both 453 px tall, 5 rows); not viewed in a desktop screenshot; 768/375 px layout only checked at the 474 px pane (stacked).

### Holidays section, second structure (replaces the oversized calendar)
The full-width calendar was too large. Now: a **compact official calendar card** (400 px) on the left — solid brand-blue month bar with white title/arrows, small round day cells, today ringed in saffron, selected day solid blue, Sundays in dark orange as weekly off — and a **notice panel** on the right (white, blue top rule): blue date box with weekday and month, legend (Public Holiday = saffron, Weekly Off = dark orange), PDF button. Stacks on ≤800 px. Note: only Sundays are marked as weekly off; other weekly-off rules (e.g. alternate Saturdays) are not encoded because the project has no holiday data beyond the PDF. Verified [Run] at 1440 px by geometry (calendar 400×332, panel 772×334, cells 38 px, header #1e40af); not viewed in a screenshot.

### Icon-button centring (round 3)
Carousel and calendar arrows had their glyph 4 px left of centre: icon-only PrimeNG buttons kept the `gap: 0.5rem` meant for icon+text buttons next to an empty label span. Gap removed and the empty label hidden. Audit [Run] at 1440 px: every icon-only button/link on home and 8 other routes (arrows, hearts, paginator, social) now has its glyph within 1 px of centre on both axes.

### Alignment audit, all pages (no new defects found)
Scripted checks, run in iframes with animations frozen: (1) container left edges equal on every page; (2) cards in a grid row share top and height; (3) headings, eyebrows and tags stay inside their container; (4) eyebrow / title / text / button left edges match inside each intro block; (5) icon-only buttons centred (earlier pass); (6) icon+text rows and flex-row centre lines (earlier pass). Routes: 16 (home, about, 3 service lists/linked, latest update, FAQ, sitemap, feedback, feedback dashboard, help desk, videos, campaign, user manual, privacy, 404) × 1440/768/375 for (1)–(3), 12 routes × 1440/375 for (4). All clean after the fixes already made (timeline dots, service-card overlap, badge/heart, arrow glyphs). Limits: geometry only, no pixel review; subtle optical alignment (e.g. text baselines, spacing rhythm) isn't detected.

### Scroll-to-top button
The chevron sat 10 px above centre (round button laid out as `display:grid`; the earlier audits only looked inside `main`/`footer`, so this fixed button was missed). Now `inline-flex` centred; measured offset 0/0.

## Responsive pass: 320 → 1920 px
**Method:** scripted audit in iframes at 320, 360, 375, 390, 412, 480, 600, 768, 820, 1024, 1280, 1440 (first run, 15 routes) and 320, 360, 390, 480, 768, 1024, 1920 (re-run) checking page-level horizontal overflow, content running off-screen, children escaping parents, text under 11 px and tap targets under 32 px (≤768 px). Widths stand in for devices (small phones 320/360, iPhone 375/390/430-class, large phones 412/480, tablets 600/768/820, laptops 1024–1440, desktop/full-HD 1920); no real devices or browsers were used.
**Found and fixed** (`official.scss`, "responsive hardening"):
1. Privacy/policy pages at 320 px pushed the rail and document off-screen (a bare `1fr` single-column track grew with long words/URLs). All single-column states of the new layouts now use `minmax(0, 1fr)`, grid children get `min-width: 0`, and long text wraps (`overflow-wrap: anywhere`).
2. Touch targets under 32–40 px on ≤768 px / coarse pointers (footer links, link lists, "more" links, chips, category/policy rails, calendar month/year buttons and arrows, ticker label) now ≥ 40 px.
3. Extra small-phone (≤360 px) tuning: gutters, panel padding, headings, atlas/service rows, steps, calendar date box. ≥1700 px: slightly larger section titles and wider gaps.
**Result [Run]:** no page-level overflow at any tested width on any of the 15 routes; the only remaining audit hit is the sitemap link rows' deliberate −10 px hover margin; the partner-logo "small" hits at 320 px were lazy images not yet loaded in the hidden test frame.
**Not covered:** the locked banner (not edited, only page-level overflow checked), landscape phones, foldables, 2560 px+, real devices/browsers, screenshot review of every width.

### Dark mode colour fix
Problem: line-art service icons (dark PNGs) sat on dark tiles, and everything coloured with `--brand` (#1e40af on the default theme: links, labels, numerals, icons, "See all") was nearly invisible on near-black surfaces. Fix (`official.scss`, "dark mode" block): inside the zones below the banner `--brand` becomes a lighter tint built from the theme's own `--brand-2/--brand-3` (every theme keeps its hue; banner/header untouched), solid fills that carry white text (active category tab counts, calendar header, selected day, date box, paginator, toggle buttons, hover tiles) use `--brand-2`, image tiles get a light background, Sunday dates/legend use light orange, video play icon stays dark-on-white.
Verified [Run]: contrast audit in dark mode across 15 routes (text ≥ 4.5:1, icons ≥ 3:1): 45 failing groups before → only PrimeNG button transitions that never finish in the hidden test frame and the play icon (fixed afterwards) remain; atlas section viewed in a dark screenshot at 1024 px. Not re-audited after the last play-icon tweak, other themes in dark mode not checked, banner/header dark look unchanged by design.

### Dark-mode header navigation
Hover/active/focus states in the header nav (e.g. "About Us") used the raw theme blue (#1e40af) on the dark glass pill. In dark mode only, `.main-nav` and the dropdown/login menus now use the same lighter tint (`official.scss`, end of file). Light mode, the Login button and all banner styling are unchanged. Verified [Run]: nav labels at 14:1 contrast in dark mode at 1280 px (default state); hover/active/focus colours rely on the same variable and were not forced in a test.

### Dark-mode header search + hamburger
The header search circle icon (dark blue on the dark pill) was nearly invisible; it and the hamburger now use the lighter tint in dark mode. Measured [Run] contrast in dark mode: search icon 6.3:1, hamburger 6.4:1, Login icon 16.4:1, top-bar controls 19:1. Light mode unchanged.

### Sticky top bar + navigation pill (≥ 1181 px)
Top bar sticks at the top; the pill sticks directly under it (no gap). `app.ts` publishes the live top-bar height as `--topbar-h` (ResizeObserver, so the A−/A+ text-size control and wrapping can't misplace the pill). Under 1181 px the top bar wraps into several rows, so only the pill sticks there. Verified [Run] at 1280 px: bar top 0 and pill top 48 at scroll 0 / 300 / 2500. Not checked: other widths, with the a11y drawer open, screenshot.

### Opaque menus
The Services dropdown, login menu, language list, theme popover and the sticky header pill had translucent backgrounds (92% / 82% + blur) so page text showed through. They are now 100% opaque with no backdrop blur (`official.scss`). Verified [Run]: submenu and pill computed background `rgb(255,255,255)`, backdrop-filter none (light mode, 1280 px).

### Navbar: full-width and the only sticky element
Replaces the sticky top bar + floating pill. The top bar scrolls away; the navigation bar is edge-to-edge ("container-fluid"), square, opaque, with a bottom border and shadow, sticky at `top: 0`. It still overlays the top of the banner (height-0 wrapper), so the banner layout is unchanged. Removed the `--topbar-h` script from `app.ts`. Verified [Run] at 1280 px: bar left 0, width = viewport minus scrollbar, top 48 at rest (under the top bar) and 0 at scroll 300/2500; radius 0. Not checked: 375–1180 px mobile menu panel placement with the full-width bar, dark mode, screenshot.

### Navbar: pill at rest, full-width bar on scroll (supersedes the two entries above)
At rest the navigation is the floating pill inside the container, directly under the top bar. After 60 px of scroll (existing `scrolled` class) it eases (0.5 s, ease-out) into a full-width, square "container-fluid" bar with a bottom border and shadow, sticky at the top; scrolling back up eases it back. The top bar scrolls away (no sticky top bar, `--topbar-h` script removed). Reduced-motion users get no transition. Verified [Run] at 1280 px: end states (rest 1200 px, radius 999; scrolled 1265 px = viewport, radius 0, padding 8/31 px, shadow) and transition properties/duration; the animation itself could not be observed in my hidden test frame (animations and the scroll rAF don't tick there), so check it by scrolling in a normal browser.

### Four India-flag themes
Added to the colour-theme picker (`app/app.ts`, `app/app.html`): **Tricolour** (Chakra blue brand with saffron accent; swatch shows saffron/white/green), **Saffron** (#c2410c), **India Green** (#138808), **Chakra Blue** (#06038d). White text on each brand colour is ≥ 4.9:1. The picker now lists 11 themes; the swatch can be a custom gradient (`dot`). Verified [Run]: picker lists all 11, selecting Tricolour sets `--brand` #06038d and persists. Not reviewed page-by-page in each new theme, nor in dark mode.

## Citizen Login page (/citizen-login)
- New lazy route `citizen-login`, page `src/app/pages/citizen-login.ts`, styles `src/citizen-login.scss`; header Login / Register > Citizen Login now opens it.
- Content scanned from the official CitizenLogin.aspx: New User card, Registered User form (login type, user, password, captcha, policy, forgot password, Know Your Citizen ID), Latest Update list, manuals, helpline 1800 233 5500.
- Logos already existed in public/assets/img/logo. The page is a demo: no credentials are sent anywhere; captcha is client-generated; registration, manuals and forgot-password link to the official portal.
- Verified: build, 3 cards, live policy checks enable Login, captcha error message, no overflow at 320 px, dark tokens apply. Not checked: real devices, Gujarati language toggle.

## Helpdesk page (/help-desk) redesign
- Rebuilt `src/app/pages/help-desk.ts` + `src/help-desk.scss` from the official HelpDesk.aspx: heading, 10 AM-6 PM Mon-Sun hours, 8 support topics, toll free 1800 233 5500, dss-support@gujarat.gov.in, support.svg (saved to public/assets/img/support.svg).
- Added: live open/closed status, topic cards, quick links (FAQ, Feedback, manuals, Swagat).
- Verified: build, 8 topics, 6 links, image loads, no overflow, reveal on scroll. Not checked: mobile widths, dark mode visuals.

## Service detail page (/service/:cat/:idx)
- Service-card "Read more" now opens an in-app detail page (`src/app/pages/service-detail.ts`, `src/service-detail.scss`) instead of the official site. Linked Services / circulars tables no longer show 5 junk rows each.
- Data holds only title + image, so the page shows title, category, save, a generic 4-step apply flow, help-line, prev/next and related services. Per-service eligibility/documents/fees are NOT in the data; the page says so and links to the official portal for the application.
- Verified: build, link targets, detail page loads, save toggle, no overflow at 320 px, invalid index shows a not-found state.

## Service Details placeholder page (/services/service-details)
- Mirrors the official Services/ServiceDetails.aspx, which only shows "Message - Coming Soon - This Page is under construction - Go back to Home page". Built as `src/app/pages/service-coming-soon.ts` + `src/service-coming-soon.scss` with spinning gears, bouncing dots and a loading bar. The per-service page `/service/:cat/:idx` is unchanged.

## Service detail page - official layout + scanned data
- Rebuilt `/service/:cat/:idx` to the official layout: action pills (Download Form, Payment Terms & Condition dialog, Apply Online), collapsible instructions with Read-aloud (browser speech synthesis, not Bhashini). Data scanned from the official site (one throttled request per service) into `src/app/data/service-details.json` (643 of 652 services matched; 9 fall back to generic steps; Digital SevaSetu/Janseva pages have an SOP heading + intro and no form/PDF sidebar). Apply Online goes to the in-app Citizen login.
