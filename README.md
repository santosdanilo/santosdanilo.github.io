# Danilo Santos — portfolio

A bilingual, static professional portfolio for **https://santosdanilo.github.io**. Evidence-led positioning for senior full-stack opportunities, a forward-looking AI applications section, and a procedural WebGL agent workshop with an animated illustrated fallback. Built with Jekyll and Dracula-inspired styling; no application server or third-party runtime requests are required.

## Preview locally

With Ruby 3.3, Node.js 22, Bundler, and npm:

```sh
bundle install
npm ci
JEKYLL_ENV=production bundle exec jekyll build
npm run build:assets
python3 -m http.server 4000 --bind 127.0.0.1 --directory _site
```

Open http://127.0.0.1:4000. English is at `/`, Brazilian Portuguese at `/pt/`.

## Content and design

- `_data/profile.yml`: shared contact links, company names, résumé path.
- `_data/en.yml`, `_data/pt.yml`: translated content grouped by section (`hero`, `proof`, `work`, `approach`, `direction`, `career`, `contact`). Navigation labels and their anchors are stored together.
- `_layouts/portfolio.html`: locale selection and section order. Keep presentation markup in the includes below.
- `_includes/portfolio/`: one template per section, plus the head, header, footer, error page, and reusable project card.
- `_includes/workshop.html`: accessible workshop section and bilingual animation controls.
- `_includes/agent-scene.html`: original illustrated fallback, animated by the shared timeline.
- `assets/js/agent-workshop.js`: lazy loading, playback, visibility, reduced motion, and fallback controller.
- `assets/js/agent-webgl.js`: procedural Three.js robots and a coordinated application-building scene.
- `assets/js/workshop-state.js`: shared 22-second human-led construction timeline.
- `assets/js/vendor/`: locally hosted Three.js 0.170.0 and its MIT license.
- `assets/css/workshop.css`: WebGL canvas, fallback, and playback controls.
- `_includes/project-diagram.html`: conceptual project diagrams, not product screenshots.
- `assets/css/portfolio.scss`: Jekyll/Sass entry point that imports the component styles.
- `assets/css/critical.scss`: header, hero, and proof-strip styles; the asset build inlines its minified output on the English and Portuguese portfolio pages.
- `_sass/portfolio/`: design tokens and base styles, navigation, hero, proof, work, approach, fallback illustration, AI direction, career, contact, and motion. Responsive rules live with their component.
- `assets/js/portfolio.js`: progressive mobile navigation and language-anchor preservation.
- `scripts/build-assets.mjs`: bundles/minifies browser JavaScript, combines/minifies generated CSS, inlines critical above-the-fold styles, fingerprints deployed assets and rewrites references, preserves the workshop's lazy WebGL chunk, and strips unbundled copies from `_site`.
- `package.json` / `package-lock.json`: pinned esbuild build tooling; no third-party runtime requests are added.
- `assets/images/danilo.webp`: original optimized portrait, retained as the source image.
- `assets/images/danilo-cutout.webp`: full-size portrait cutout source. Responsive compressed WebP variants are emitted with content-hashed filenames; no runtime image-processing service is used.
- `assets/images/portrait-network.svg`: decorative UI/API/data network layer, emitted with a content-hashed filename as a high-priority HTML image separate from the portrait.
- `assets/documents/Danilo-Santos-Resume.pdf`: supplied English résumé, shared by both languages.

### Editing workflow

1. Change copy in the matching section of **both** language data files. Use plain text; the templates provide the markup. Arrays of contributions, projects, principles, and roles are rendered automatically.
2. Change a section's markup in `_includes/portfolio/<section>.html`. Reordering the page only requires changing the include order in `_layouts/portfolio.html`.
3. Change its styling in `_sass/portfolio/_<component>.scss`, including any responsive rules. Scene playback and renderer-specific styling remain in `assets/css/workshop.css`.
4. Run the build and checker, then review both languages at desktop and mobile widths.

The narrative is **positioning → proof → case studies → working approach → AI direction → career foundation → contact**. The case studies cover API/React performance and backend architecture, route-ready time and frontend build measurements (GBDEV-230), payment-system modernization, and rapid product validation. The timeline adds career context rather than repeating each case study. GBDEV-230 leads with end-to-end route-ready wait as a proxy for perceived loading time, and keeps post-only Lighthouse scores, route-level variation, bundle-size trade-offs, and backend dependencies in expandable measurement notes. Do not present the entry chunk reduction as a reduction in total emitted JavaScript or route transfer size.

Professional claims were checked against the private brag document's canonical work history, relevant experiences, and evidence ledger. Keep results specific: the API reduction is **warm latency** averaged over 100 requests; the React reduction is **initial mount time**, not overall application speed. AI-assisted professional delivery is established experience; building AI-enabled applications is the next direction, supported by personal RAG work and completed foundation modules. Do not turn that future direction into an unsupported production AI claim.

Stable section IDs (`expertise`, `work`, `experience`, `about`, `contact`) are shared across languages; `about` now contains the AI direction. Case-study IDs also match across languages. `/about/` and `/contact/` retain legacy entry points. The original Voyager theme files remain available for historical layouts but are not loaded by the portfolio.

## Build and validate

```sh
npm ci
JEKYLL_ENV=production bundle exec jekyll build --trace
npm run build:assets
python3 scripts/check_site.py
node --check assets/js/portfolio.js
node --check assets/js/agent-workshop.js
node --check assets/js/agent-webgl.js
node --check assets/js/workshop-state.js
```

The link checker validates local assets, page destinations, matching fragment IDs across languages, translated page language, nonempty headings and their hierarchy, structured data, and metadata in the generated output. Jekyll emits compressed Sass; `build:assets` inlines minified critical CSS, combines/minifies the remaining CSS, and fingerprints CSS, JS, and hero images before validation and deployment. The full stylesheet is a low-priority preload with a no-JavaScript fallback. Source modules remain readable under `assets/js/`. Also review desktop/mobile layouts, keyboard navigation, no-JavaScript navigation, and reduced-motion behavior after visual changes.

## Agent workshop

The workshop illustrates the working-approach section (`/#workshop`, `/pt/#workshop`), after the results and case studies. A human coordinator introduces an idea, delegates to three procedural robots, reviews their work, directs a fix, and approves the result over six stages. No model or texture assets are downloaded. Three.js is imported only near the viewport, and the illustrated fallback stays visible until a successful WebGL frame. Rendering is capped at 30 fps with capped pixel density and pauses offscreen or in hidden tabs. Pause/play and replay work for either renderer.

The upper-right icon controls have localized accessible names and tooltips. The workshop stays in normal document flow; agents' soles meet the platform, and only their arms and heads move while working. The portrait and project diagrams have a pointer-following tilt (up to ten degrees), a small lift, and responsive shadows, enabled only for fine pointers with motion allowed. The portrait cutout and network background move in separate layers. Tilt strength and parallax distance are centralized in `assets/js/portfolio.js`; scrolling, resizing, pointer exit, or a motion-preference change resets the effect. Earlier career roles appear in a separate, subdued block below the main timeline.

WebGL initialization or context loss switches to the animated DOM fallback. With JavaScript unavailable, the illustration remains static. Reduced-motion preferences show the completed illustration without loading WebGL until the visitor explicitly chooses play. Scene state does not use live announcements, avoiding repeated screen-reader interruptions.

For browser verification, block the WebGL module or make canvas `getContext('webgl2')` return `null` before page load, then confirm the interface assembly and controls still work. Also test a `webglcontextlost` event, changing reduced-motion preferences, leaving/re-entering the viewport, and both languages.

## GitHub Pages

`.github/workflows/pages.yml` installs locked Ruby and Node dependencies, builds the Jekyll site, bundles/minifies and fingerprints CSS, JS, and hero images, validates the generated output, then builds pull requests and deploys pushes to `master`. Dependencies are recorded in `Gemfile.lock` and `package-lock.json`. Fingerprinted URLs prevent stale asset content from being reused after deploys. GitHub Pages controls its own cache lifetime (the audit reported 10 minutes); fingerprints do not change that TTL, and this repository cannot set static asset response headers there.

In the repository's **Settings → Pages**, select **GitHub Actions** as the publishing source. The workflow deploys `_site` to the existing `santosdanilo.github.io` address. Repository settings and publication are separate from local development; a local build does not publish changes.

The production URL lives in `_config.yml`; update it and `robots.txt` if using a custom domain. No analytics or external font requests are configured.
