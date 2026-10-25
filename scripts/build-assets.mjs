import { readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { build, transform } from "esbuild";

const root = process.cwd();
const output = path.join(root, "_site");
const jsOutput = path.join(output, "assets/js");
const cssOutput = path.join(output, "assets/css");

await rm(path.join(jsOutput, "chunks"), { recursive: true, force: true });
await build({
  absWorkingDir: root,
  entryPoints: ["assets/js/portfolio.js", "assets/js/agent-workshop.js"],
  outdir: jsOutput,
  entryNames: "[name].min",
  chunkNames: "chunks/[name]-[hash]",
  bundle: true,
  splitting: true,
  format: "esm",
  platform: "browser",
  target: ["es2020"],
  minify: true,
  legalComments: "none",
  metafile: true,
});

const stylesheets = await Promise.all(
  ["portfolio.css", "workshop.css"].map((name) =>
    readFile(path.join(cssOutput, name), "utf8"),
  ),
);
const { code: css } = await transform(stylesheets.join("\n"), {
  loader: "css",
  minify: true,
  target: "safari15",
});
const combinedCss = path.join(cssOutput, "site.min.css");
await writeFile(combinedCss, css);

const criticalSource = await readFile(
  path.join(cssOutput, "critical.css"),
  "utf8",
);
const { code: criticalMinified } = await transform(criticalSource, {
  loader: "css",
  minify: true,
  target: "safari15",
});
const criticalCss = criticalMinified.replace(
  /url\((['"]?)\.\.\/images\/([^)'\"]+)\1\)/g,
  "url(/assets/images/$2)",
);
for (const page of ["index.html", "pt/index.html"]) {
  const outputPath = path.join(output, page);
  const html = await readFile(outputPath, "utf8");
  const marker = "__CRITICAL_CSS__";
  if (html.split(marker).length !== 2) {
    throw new Error(`Expected one critical CSS placeholder in ${page}`);
  }
  await writeFile(outputPath, html.replace(marker, criticalCss));
}

// Replace Jekyll's unbundled copies in the deployed artifact with minified entries.
await Promise.all(
  [
    path.join(jsOutput, "portfolio.js"),
    path.join(jsOutput, "agent-workshop.js"),
    path.join(jsOutput, "agent-webgl.js"),
    path.join(jsOutput, "workshop-state.js"),
    path.join(jsOutput, "vendor/three.module.min.js"),
    path.join(jsOutput, "scripts.js"),
    path.join(cssOutput, "portfolio.css"),
    path.join(cssOutput, "portfolio.css.map"),
    path.join(cssOutput, "critical.css"),
    path.join(cssOutput, "workshop.css"),
  ].map((file) => rm(file, { force: true })),
);

const cssBytes = (await stat(combinedCss)).size;
const jsBytes = await Promise.all(
  ["portfolio.min.js", "agent-workshop.min.js"].map(
    async (name) => (await stat(path.join(jsOutput, name))).size,
  ),
);
console.log(
  `Built minified assets: CSS ${cssBytes} B; JavaScript entries ${jsBytes.join(" + ")} B (WebGL remains a lazy chunk).`,
);
