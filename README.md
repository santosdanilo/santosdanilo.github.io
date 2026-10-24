# Danilo Santos — portfolio

A bilingual, static professional portfolio for **https://santosdanilo.github.io**. Custom Dracula-inspired styling, résumé-based case studies, and a procedural WebGL agent workshop with an animated illustrated fallback. Built with Jekyll; no application server or third-party runtime requests are required.

## Preview locally

With Ruby 3.3 and Bundler:

```sh
bundle install
bundle exec jekyll serve --host 127.0.0.1
```

Open http://127.0.0.1:4000. English is at `/`, Brazilian Portuguese at `/pt/`.

With Docker, from the repository root:

```sh
docker run --rm -it -p 4000:4000 -v "$PWD:/site" -v danilo-portfolio-gems:/usr/local/bundle -w /site ruby:3.3 bash -lc 'bundle install && bundle exec jekyll serve --host 0.0.0.0'
```

## Content and design

- `_data/profile.yml`: shared contact links, company names, résumé path.
- `_data/en.yml`, `_data/pt.yml`: translated copy, expertise, projects, and career history.
- `_layouts/portfolio.html`: shared page structure and metadata.
- `_includes/workshop.html`: accessible workshop section and bilingual animation controls.
- `_includes/agent-scene.html`: original illustrated fallback, animated by the shared timeline.
- `assets/js/agent-workshop.js`: lazy loading, playback, visibility, reduced motion, and fallback controller.
- `assets/js/agent-webgl.js`: procedural Three.js robots and a coordinated application-building scene.
- `assets/js/workshop-state.js`: shared 15-second construction timeline.
- `assets/js/vendor/`: locally hosted Three.js 0.170.0 and its MIT license.
- `assets/css/workshop.css`: WebGL canvas, fallback, and playback controls.
- `_includes/project-diagram.html`: conceptual project diagrams, not product screenshots.
- `assets/css/portfolio.scss`: design tokens, responsive layout, illustration, reduced-motion rules.
- `assets/js/portfolio.js`: progressive mobile navigation and language-anchor preservation.
- `assets/images/danilo.webp`: optimized portrait.
- `assets/documents/Danilo-Santos-Resume.pdf`: supplied English résumé, shared by both languages.

Keep factual career changes consistent across both language data files. Stable section IDs (`expertise`, `work`, `experience`, `about`, `contact`) are shared across languages. `/about/` and `/contact/` retain legacy entry points. The original Voyager theme files remain available for historical layouts but are not loaded by the portfolio.

## Build and validate

```sh
JEKYLL_ENV=production bundle exec jekyll build --trace
python3 scripts/check_site.py
node --check assets/js/portfolio.js
node --check assets/js/agent-workshop.js
node --check assets/js/agent-webgl.js
```

The link checker validates local assets, page destinations, fragment IDs, translated page language, structured data, and metadata in the generated output. Also review desktop/mobile layouts, keyboard navigation, no-JavaScript navigation, and reduced-motion behavior after visual changes.

## Agent workshop

The workshop sits below the hero (`/#workshop`, `/pt/#workshop`). Three procedural robots assemble interface panels, connect a server, scan the result, and celebrate. No model or texture assets are downloaded. Three.js is imported only near the viewport, and the illustrated fallback stays visible until a successful WebGL frame. Rendering is capped at 30 fps with capped pixel density and pauses offscreen or in hidden tabs. Pause/play and replay work for either renderer.

The upper-left icon controls have localized accessible names and tooltips. The workshop stays in normal document flow; agents' soles meet the platform, and only their arms and heads move while working. The portrait and project diagrams have a pointer-following tilt (up to four degrees), enabled only for fine pointers with motion allowed. Earlier career roles appear in a separate, subdued block below the main timeline.

WebGL initialization or context loss switches to the animated DOM fallback. With JavaScript unavailable, the illustration remains static. Reduced-motion preferences show the completed illustration without loading WebGL until the visitor explicitly chooses play. Scene state does not use live announcements, avoiding repeated screen-reader interruptions.

For browser verification, block the WebGL module or make canvas `getContext('webgl2')` return `null` before page load, then confirm the interface assembly and controls still work. Also test a `webglcontextlost` event, changing reduced-motion preferences, leaving/re-entering the viewport, and both languages.

## GitHub Pages

`.github/workflows/pages.yml` builds pull requests and builds/deploys pushes to `master`. Dependencies are recorded in `Gemfile.lock`.

In the repository's **Settings → Pages**, select **GitHub Actions** as the publishing source. The workflow deploys `_site` to the existing `santosdanilo.github.io` address. Repository settings and publication are separate from local development; a local build does not publish changes.

The production URL lives in `_config.yml`; update it and `robots.txt` if using a custom domain. No analytics or external font requests are configured.
