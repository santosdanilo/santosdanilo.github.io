# Danilo Santos — portfolio

A bilingual, static professional portfolio for **https://santosdanilo.github.io**. Custom Dracula-inspired styling, résumé-based case studies, and a lightweight SVG/CSS-style agent scene. Built with Jekyll; no application server, frontend runtime, or third-party scripts are required.

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
- `_includes/agent-scene.html`: decorative original agent illustration.
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
```

The link checker validates local assets, page destinations, fragment IDs, translated page language, structured data, and metadata in the generated output. Also review desktop/mobile layouts, keyboard navigation, no-JavaScript navigation, and reduced-motion behavior after visual changes.

## GitHub Pages

`.github/workflows/pages.yml` builds pull requests and builds/deploys pushes to `master`. Dependencies are recorded in `Gemfile.lock`.

In the repository's **Settings → Pages**, select **GitHub Actions** as the publishing source. The workflow deploys `_site` to the existing `santosdanilo.github.io` address. Repository settings and publication are separate from local development; a local build does not publish changes.

The production URL lives in `_config.yml`; update it and `robots.txt` if using a custom domain. No analytics or external font requests are configured.
