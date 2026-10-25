import { createHash } from "node:crypto";
import { readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { build, transform } from "esbuild";

const root = process.cwd();
const output = path.join(root, "_site");
const jsOutput = path.join(output, "assets/js");
const cssOutput = path.join(output, "assets/css");
const imageOutput = path.join(output, "assets/images");
const fingerprint = (contents) =>
  createHash("sha256").update(contents).digest("hex").slice(0, 12);

async function removeMatching(directory, pattern) {
  const entries = await readdir(directory, { withFileTypes: true });
  await Promise.all(
    entries
      .filter((entry) => entry.isFile() && pattern.test(entry.name))
      .map((entry) => rm(path.join(directory, entry.name), { force: true })),
  );
}

async function fingerprintImage(sourceName, outputStem) {
  const source = path.join(imageOutput, sourceName);
  const contents = await readFile(source);
  const name = `${outputStem}-${fingerprint(contents)}${path.extname(sourceName)}`;
  await writeFile(path.join(imageOutput, name), contents);
  await rm(source);
  return name;
}

async function htmlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const file = path.join(directory, entry.name);
      return entry.isDirectory() ? htmlFiles(file) : [file];
    }),
  );
  return nested.flat().filter((file) => file.endsWith(".html"));
}

await rm(path.join(jsOutput, "chunks"), { recursive: true, force: true });
await removeMatching(
  jsOutput,
  /^(?:portfolio|agent-workshop)-[\da-f]+\.min\.js$/,
);
await removeMatching(cssOutput, /^site-[\da-f]+\.min\.css$/);
await removeMatching(
  imageOutput,
  /^(?:danilo-cutout-(?:480|640)|portrait-network)-[\da-f]+\.(?:webp|svg)$/,
);

const portrait480 = await fingerprintImage(
  "danilo-cutout-480.webp",
  "danilo-cutout-480",
);
const portrait640 = await fingerprintImage(
  "danilo-cutout-640.webp",
  "danilo-cutout-640",
);
const portraitNetwork = await fingerprintImage(
  "portrait-network.svg",
  "portrait-network",
);
await rm(path.join(imageOutput, "danilo-cutout.webp"), { force: true });

const javascript = await build({
  absWorkingDir: root,
  entryPoints: ["assets/js/portfolio.js", "assets/js/agent-workshop.js"],
  outdir: jsOutput,
  entryNames: "[name]-[hash].min",
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

function entryName(source) {
  const match = Object.entries(javascript.metafile.outputs).find(
    ([, metadata]) => metadata.entryPoint?.endsWith(source),
  );
  if (!match) throw new Error(`Missing bundled entry for ${source}`);
  return path.basename(match[0]);
}

const portfolioScript = entryName("assets/js/portfolio.js");
const workshopScript = entryName("assets/js/agent-workshop.js");

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
const cssContents = Buffer.from(css);
const cssName = `site-${fingerprint(cssContents)}.min.css`;
const combinedCss = path.join(cssOutput, cssName);
await writeFile(combinedCss, cssContents);

const criticalSource = await readFile(
  path.join(cssOutput, "critical.css"),
  "utf8",
);
const { code: criticalCss } = await transform(criticalSource, {
  loader: "css",
  minify: true,
  target: "safari15",
});
const replacements = new Map([
  ["__CRITICAL_CSS__", criticalCss],
  ["__SITE_CSS__", cssName],
  ["__PORTFOLIO_JS__", portfolioScript],
  ["__PORTRAIT_480__", portrait480],
  ["__PORTRAIT_640__", portrait640],
  ["__PORTRAIT_NETWORK__", portraitNetwork],
]);

for (const outputPath of await htmlFiles(output)) {
  let html = await readFile(outputPath, "utf8");
  for (const [placeholder, value] of replacements) {
    html = html.replaceAll(placeholder, value);
  }
  if (/__[A-Z0-9_]+__/.test(html)) {
    throw new Error(`Unresolved production asset placeholder in ${outputPath}`);
  }
  await writeFile(outputPath, html);
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
    path.join(imageOutput, "danilo-cutout.webp"),
    path.join(imageOutput, "danilo-cutout-480.webp"),
    path.join(imageOutput, "danilo-cutout-640.webp"),
    path.join(imageOutput, "portrait-network.svg"),
  ].map((file) => rm(file, { force: true })),
);

const cssBytes = (await stat(combinedCss)).size;
const jsBytes = await Promise.all(
  [portfolioScript, workshopScript].map(
    async (name) => (await stat(path.join(jsOutput, name))).size,
  ),
);
console.log(
  `Built fingerprinted assets: CSS ${cssName} (${cssBytes} B); JavaScript entries ${jsBytes.join(" + ")} B; hero images ${portrait480}, ${portrait640}, ${portraitNetwork}.`,
);
