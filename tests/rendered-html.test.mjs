import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(new Request(`http://localhost${path}`, { headers: { accept: "text/html", host: "localhost" } }), { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
}

test("renders the Migrz design lab", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Migrz — Six UI Directions/);
  assert.match(html, /Six directions for Migrz/);
  assert.match(html, /Your achievements/);
  assert.match(html, /The Merit Index/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton|Your site is taking shape/);
});

test("contains all six distinct concepts and research-led content", async () => {
  const source = await readFile(new URL("app/design-lab.tsx", root), "utf8");
  for (const id of ["merit", "atlas", "signal", "dossier", "northstar", "quiet"]) assert.match(source, new RegExp(`\\"${id}\\"`));
  for (const term of ["EB-1A", "NIW", "Global Talent", "48 hours", "six countries"]) assert.match(source, new RegExp(term, "i"));
  assert.match(source, /ArrowRight/);
  assert.match(source, /aria-pressed/);
});
