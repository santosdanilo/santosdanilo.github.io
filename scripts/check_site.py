"""Validate the generated portfolio without third-party dependencies."""

import json
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
        self.feed(path.read_text())

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
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

    def handle_data(self, data):
        if self.json_script:
            self.json_text += data

    def handle_endtag(self, tag):
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
print(f"Validated {len(pages)} HTML pages, {count} local references, metadata, language routes, JSON-LD and sitemap.")
