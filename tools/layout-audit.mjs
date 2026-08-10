/* Element-level layout audit.

   `user-sim.mjs` reports horizontal overflow per page, but global.css sets
   `body{overflow-x:hidden}` — which hides exactly the failure worth catching:
   a block wider than its container is clipped silently instead of producing a
   scrollbar. So this walks the DOM rather than the page, at every breakpoint
   the stylesheet defines and a few either side of them.

   It reports three things, and every table it finds:
     self-overflow-x  content wider than its own box, with nothing to scroll
     clipped-y        text taller than a box whose overflow-y is hidden
     past-viewport    a box reaching past the viewport edge

       node tools/layout-audit.mjs                  # needs `astro build` + a
       ORIGIN=http://localhost:4321 node tools/…    # server over ./dist

   A finding is a fact about the layout: something is drawn where it cannot be
   read. */
import { chromium } from "playwright-core";
import { readdirSync } from "node:fs";
import { join } from "node:path";

const EXE =
  process.env.EXE ??
  "/home/claude_code/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell";
const ORIGIN = process.env.ORIGIN ?? "http://localhost:8131";
const BASE = "/university";
const DIST = process.env.DIST ?? "dist";

/* every built route, so a new page is covered without editing this file */
const pages = [];
(function walk(dir, url) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) walk(join(dir, e.name), `${url}${e.name}/`);
    else if (e.name === "index.html") pages.push(url);
  }
})(DIST, "/");
pages.sort();

const VIEWPORTS = [320, 360, 390, 414, 768, 899, 900, 1024, 1060, 1100, 1200, 1440];

const probe = () => {
  const out = [];
  const vw = document.documentElement.clientWidth;
  const label = (el) => {
    const id = el.id ? `#${el.id}` : "";
    const cls =
      typeof el.className === "string" && el.className
        ? "." + el.className.trim().split(/\s+/).slice(0, 3).join(".")
        : "";
    return `${el.tagName.toLowerCase()}${id}${cls}`;
  };
  const text = (el) => (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 46);
  const scrollableAncestor = (el) => {
    for (let p = el.parentElement; p; p = p.parentElement) {
      const ox = getComputedStyle(p).overflowX;
      if (ox === "auto" || ox === "scroll") return p;
    }
    return null;
  };

  for (const el of document.querySelectorAll("body *")) {
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden") continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    const scrollable = scrollableAncestor(el);

    const selfOver = el.scrollWidth - el.clientWidth;
    if (
      selfOver > 1 &&
      cs.overflowX !== "auto" &&
      cs.overflowX !== "scroll" &&
      !scrollable
    ) {
      out.push({ kind: "self-overflow-x", el: label(el), by: Math.round(selfOver), text: text(el) });
    }

    if (
      el.scrollHeight - el.clientHeight > 1 &&
      cs.overflowY === "hidden" &&
      el.textContent.trim() &&
      !el.querySelector("img,svg,picture")
    ) {
      out.push({
        kind: "clipped-y",
        el: label(el),
        by: Math.round(el.scrollHeight - el.clientHeight),
        text: text(el),
      });
    }

    /* the skip link is parked at left:-9999px on purpose until it is focused */
    const parked = r.left < -1000 || el.matches(".skip") || el.closest(".skip");
    if ((r.right > vw + 1 || r.left < -1) && !scrollable && cs.position !== "fixed" && !parked) {
      if (el.children.length === 0 || el.matches("h1,h2,h3,h4,h5,p,li,td,th,span,a")) {
        out.push({
          kind: "past-viewport",
          el: label(el),
          by: Math.round(Math.max(r.right - vw, -r.left)),
          text: text(el),
        });
      }
    }
  }

  const tables = [...document.querySelectorAll("table,.tbl")].map((t) => {
    const pr = t.parentElement.getBoundingClientRect();
    const cells = [...t.querySelectorAll("tbody td")];
    return {
      el: label(t),
      mode: getComputedStyle(t).display === "block" ? "стопкой" : "таблицей",
      labelled: cells.filter((c) => c.hasAttribute("data-m")).length,
      cells: cells.length,
      spill: Math.round(t.scrollWidth - pr.width),
    };
  });

  return { findings: out, tables };
};

const b = await chromium.launch({ executablePath: EXE });
let bad = 0;
for (const width of VIEWPORTS) {
  const ctx = await b.newContext({ viewport: { width, height: 900 } });
  const p = await ctx.newPage();
  for (const path of pages) {
    await p.goto(`${ORIGIN}${BASE}${path}`, { waitUntil: "networkidle" });
    const { findings, tables } = await p.evaluate(probe);
    const seen = new Set();
    const uniq = findings.filter((f) => {
      const k = `${f.kind}|${f.el}|${f.text}`;
      return seen.has(k) ? false : (seen.add(k), true);
    });
    if (uniq.length) {
      bad += uniq.length;
      console.log(`\n${width}px  ${path}`);
      for (const f of uniq.slice(0, 12))
        console.log(`   ${f.kind.padEnd(16)} +${String(f.by).padStart(4)}px  ${f.el}  «${f.text}»`);
      if (uniq.length > 12) console.log(`   … ещё ${uniq.length - 12}`);
    }
    for (const t of tables.filter((t) => t.spill > 1)) {
      bad++;
      console.log(`\n${width}px  ${path}\n   ТАБЛИЦА ${t.el} выходит за контейнер на ${t.spill}px (${t.mode})`);
    }
  }
  await ctx.close();
}
console.log(bad ? `\n=== находок: ${bad} ===` : "\n=== чисто на всех вьюпортах ===");
await b.close();
process.exit(bad ? 1 : 0);
