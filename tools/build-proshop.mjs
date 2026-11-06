// Builds pro-shop/ from a checkout of the pro shop app.
//
//   node tools/build-proshop.mjs /path/to/app-checkout
//
// Copies the app's pages, scripts and styles, drops config.js (the live
// connection) and replaces db.js with tools/proshop-demo-db.js, an in-memory
// store of made-up rows. Fails if anything still points at a live service.

import { readdirSync, readFileSync, writeFileSync, mkdirSync, rmSync, copyFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const src = join(process.argv[2] ?? "", "app");
const out = join(here, "..", "pro-shop");
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

// Real business, staff and customer names are swapped for made-up ones.
function scrub(text) {
  return text
    .replace(/Perfexxxxion Pro Shop/g, "Demo Pro Shop")
    .replace(/Perfexxxxion/g, "Demo")
    .replace(/Jim Curtis/g, "Alex Sample")
    .replace(/Keith Reynolds/g, "Kim Rivers")
    .replace(/At Keiths/g, "At the bench")
    .replace(/\bKeith\b/g, "the manager");
}

const skip = new Set(["config.js", "db.js"]);
for (const name of readdirSync(src)) {
  if (skip.has(name)) continue;
  if (name.endsWith(".html")) {
    const html = readFileSync(join(src, name), "utf8")
      .replace(/<script src="config\.js[^"]*"><\/script>\s*/g, "")
      .replace(/src="db\.js[^"]*"/g, 'src="demo-db.js"')
      .replace("<head>", '<head>\n  <meta name="robots" content="noindex">');
    writeFileSync(join(out, name), scrub(html));
  } else if (/\.(js|css|json)$/.test(name)) {
    writeFileSync(join(out, name), scrub(readFileSync(join(src, name), "utf8")));
  }
}
copyFileSync(join(here, "proshop-demo-db.js"), join(out, "demo-db.js"));

for (const name of readdirSync(out)) {
  const text = readFileSync(join(out, name), "utf8");
  if (/supabase\.co|sb_publishable|config\.js|github\.com|perfexxxx|curtis|\bKeith\b/i.test(text.replace(/at_keiths/g, ""))) throw new Error(`${name} still references a live service`);
  if (name.endsWith(".html") && /src="db\.js/.test(text)) throw new Error(`${name} still loads db.js`);
}
console.log("pro-shop: built");
