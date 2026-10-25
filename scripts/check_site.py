"""Validate the generated portfolio without third-party dependencies."""

import hashlib
import json
import re
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
import xml.etree.ElementTree as ET


class Page(HTMLParser):
    def __init__(self, path):
        super().__init__()
        self.path = path
        self.ids = set()
        self.refs = []
        self.lang = None
        self.canonical = False
        self.description = False
        self.title = False
        self.json_script = False
        self.json_text = ""
        self.headings = []
        self.heading_level = None
        self.heading_text = ""
        self.feed(path.read_text())

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if re.fullmatch(r"h[1-6]", tag):
            self.heading_level = int(tag[1])
            self.heading_text = ""
        if "id" in attrs:
            assert attrs["id"] not in self.ids, f"Duplicate ID in {self.path}: {attrs['id']}"
            self.ids.add(attrs["id"])
        if tag == "html":
            self.lang = attrs.get("lang")
        if tag == "title":
            self.title = True
        if tag == "meta" and attrs.get("name") == "description":
            self.description = bool(attrs.get("content"))
        if tag == "link" and attrs.get("rel") == "canonical":
            self.canonical = attrs.get("href", "").startswith("https://santosdanilo.github.io/")
        if tag == "script" and attrs.get("type") == "application/ld+json":
            self.json_script = True
            self.json_text = ""
        for key in ("href", "src"):
            if attrs.get(key):
                self.refs.append(attrs[key])
        for candidate in attrs.get("srcset", "").split(","):
            reference = candidate.strip().split(" ", 1)[0]
            if reference:
                self.refs.append(reference)

    def handle_data(self, data):
        if self.heading_level is not None:
            self.heading_text += data
        if self.json_script:
            self.json_text += data

    def handle_endtag(self, tag):
        if re.fullmatch(r"h[1-6]", tag) and self.heading_level is not None:
            self.headings.append((self.heading_level, self.heading_text.strip()))
            self.heading_level = None
        if tag == "script" and self.json_script:
            assert json.loads(self.json_text)["@type"] == "Person"
            self.json_script = False


root = Path("_site").resolve()
assert root.is_dir(), "Run jekyll build first"
pages = {path: Page(path) for path in root.rglob("*.html")}
assert pages[root / "index.html"].lang == "en"
assert pages[root / "pt/index.html"].lang == "pt-BR"
for relative in ("index.html", "pt/index.html", "404.html"):
    page = pages[root / relative]
    assert page.title and page.canonical and page.description, f"Missing metadata: {relative}"
    assert "{%" not in page.path.read_text(), f"Unrendered Liquid: {relative}"
    assert sum(level == 1 for level, _ in page.headings) == 1, f"Expected one H1: {relative}"
    previous = 0
    for level, text in page.headings:
        assert text, f"Empty translated heading in {relative}"
        assert level <= previous + 1, f"Skipped heading level at {text!r} in {relative}"
        previous = level

# Critical styles are embedded on the two portfolio routes; the full sheet is
# still available through preload and a no-JavaScript stylesheet fallback.
for relative in ("index.html", "pt/index.html"):
    html = pages[root / relative].path.read_text()
    assert "__CRITICAL_CSS__" not in html, f"Unbuilt critical CSS: {relative}"
    assert "<style>" in html and ".hero" in html, f"Missing critical styles: {relative}"
    assert 'rel="preload"' in html and 'as="style"' in html, f"Missing stylesheet preload: {relative}"
    assert "<noscript>" in html and 'rel="stylesheet"' in html, f"Missing no-script styles: {relative}"
    for pattern, label in (
        (r"/assets/css/site-[a-f0-9]{12}\.min\.css", "fingerprinted CSS"),
        (r"/assets/js/portfolio-[A-Z0-9]{8,12}\.min\.js", "fingerprinted app JS"),
        (r"danilo-cutout-480-[a-f0-9]{12}\.webp", "fingerprinted 480px portrait"),
        (r"danilo-cutout-640-[a-f0-9]{12}\.webp", "fingerprinted 640px portrait"),
        (r"portrait-network-[a-f0-9]{12}\.svg", "fingerprinted LCP image"),
    ):
        assert re.search(pattern, html), f"Missing {label}: {relative}"
    assert 'class="portrait-network"' in html and 'fetchpriority="high"' in html, f"LCP image is not prioritized in HTML: {relative}"
    assert 'class="portrait-network"' in html and 'loading="eager"' in html, f"LCP image must not be lazy-loaded: {relative}"

# Language switching preserves fragments, including links to individual cases.
assert pages[root / "index.html"].ids == pages[root / "pt/index.html"].ids, "Translated fragment IDs differ"
count = 0
for path, page in pages.items():
    for ref in page.refs:
        url = urlsplit(ref)
        if url.scheme or url.netloc:
            continue
        target = (root / unquote(url.path.lstrip("/"))) if url.path.startswith("/") else (path.parent / unquote(url.path))
        if not url.path:
            target = path
        if target.is_dir():
            target /= "index.html"
        assert target.is_file(), f"Broken link in {path.relative_to(root)}: {ref}"
        if url.fragment and target in pages:
            assert unquote(url.fragment) in pages[target].ids, f"Missing fragment in {path.relative_to(root)}: {ref}"
        count += 1
ET.parse(root / "sitemap.xml")
modules = 0
for script in (root / "assets/js").rglob("*.js"):
    for reference in re.findall(r'''(?:from\s*|import\s*\()\s*['"](\.[^'"]+)['"]''', script.read_text()):
        target = (script.parent / reference).resolve()
        assert target.is_relative_to(root) and target.is_file(), f"Missing local module in {script.relative_to(root)}: {reference}"
        modules += 1
assert (root / "assets/js/vendor/three-LICENSE.txt").is_file(), "Missing Three.js license"
fingerprinted_assets = (
    root / "assets/css/site-*.min.css",
    root / "assets/images/danilo-cutout-480-*.webp",
    root / "assets/images/danilo-cutout-640-*.webp",
    root / "assets/images/portrait-network-*.svg",
)
for pattern in fingerprinted_assets:
    matches = list(pattern.parent.glob(pattern.name))
    assert len(matches) == 1, f"Expected one fingerprinted asset matching {pattern}"
    asset = matches[0]
    digest = hashlib.sha256(asset.read_bytes()).hexdigest()[:12]
    assert digest in asset.name, f"Content hash does not match filename: {asset.relative_to(root)}"
for pattern in (
    root / "assets/js/portfolio-*.min.js",
    root / "assets/js/agent-workshop-*.min.js",
):
    matches = list(pattern.parent.glob(pattern.name))
    assert len(matches) == 1, f"Expected one bundled entry matching {pattern}"
for source_copy in (
    "assets/css/portfolio.css",
    "assets/css/portfolio.css.map",
    "assets/css/workshop.css",
    "assets/css/critical.css",
    "assets/css/site.min.css",
    "assets/js/portfolio.js",
    "assets/js/agent-workshop.js",
    "assets/js/agent-webgl.js",
    "assets/js/workshop-state.js",
    "assets/js/scripts.js",
    "assets/js/vendor/three.module.min.js",
    "assets/images/danilo-cutout.webp",
    "assets/images/danilo-cutout-480.webp",
    "assets/images/danilo-cutout-640.webp",
    "assets/images/portrait-network.svg",
):
    assert not (root / source_copy).exists(), f"Unbundled source included in production output: {source_copy}"
print(f"Validated {len(pages)} HTML pages, {count} local references, metadata, language routes, JSON-LD and sitemap.")
print(f"Validated {modules} local JavaScript module imports and the vendored Three.js license.")
