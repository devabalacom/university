/* Contrast of card text against the artwork actually rendered behind it.

   The colour check in user-sim compares computed colours, which says nothing
   about a white line sitting on a bright part of a photograph. This screenshots
   each page with the text layer hidden, reads the pixels under every line of a
   card, and reports the worst pixel behind it — the average is useless here,
   since a scrim can be dark over 95% of a card and still leave a heading lying
   across a gold ring.

       astro build && node tools/scrim-contrast.mjs   # needs a server over ./dist

   Anything below 4.5:1 is printed. Silence means every line clears it at every
   width listed. */
import { chromium } from "playwright-core";
const EXE = "/home/claude_code/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell";
const b = await chromium.launch({ executablePath: EXE });
const canvasPage = await b.newPage();
await canvasPage.setContent("<canvas id=c></canvas>");

for (const w of [320,360,390,414,480,600,700,760,768,860,900,1000,1024,1100,1200,1366,1440,1600,1920]) {
  const ctx = await b.newContext({ viewport: { width: w, height: 1000 } });
  const p = await ctx.newPage();
  await p.goto("http://localhost:8131/university/", { waitUntil: "networkidle" });
  const boxes = await p.evaluate(() =>
    [...document.querySelectorAll(".b-card")].flatMap((c) =>
      [...c.querySelectorAll("h2,h3,.b-lead,.b-more")].map((t) => {
        const r = t.getBoundingClientRect();
        return {
          cls: c.className.replace("b-card ", ""),
          tag: t.className || t.tagName,
          art: !!c.querySelector("img"),
          plate: getComputedStyle(c).backgroundColor,
          x: Math.round(r.x), y: Math.round(r.y + window.scrollY),
          w: Math.round(r.width), h: Math.round(r.height),
          color: getComputedStyle(t).color,
        };
      })
    )
  );
  await p.addStyleTag({ content: ".b-card__content{visibility:hidden}" });
  const png = (await p.screenshot({ fullPage: true })).toString("base64");
  const rows = await canvasPage.evaluate(async ({ png, boxes }) => {
    const img = new Image();
    img.src = "data:image/png;base64," + png;
    await img.decode();
    const c = document.getElementById("c");
    c.width = img.width; c.height = img.height;
    const g = c.getContext("2d");
    g.drawImage(img, 0, 0);
    const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    const L = (r, gg, bb) => 0.2126 * lin(r) + 0.7152 * lin(gg) + 0.0722 * lin(bb);
    const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    return boxes.map((t) => {
      if (t.w < 4 || t.h < 4) return null;
      const [tr, tg, tb] = t.color.match(/\d+/g).map(Number);
      const tl = L(tr, tg, tb);
      const d = g.getImageData(t.x, t.y, Math.min(t.w, c.width - t.x), Math.min(t.h, c.height - t.y)).data;
      let worst = Infinity, sum = 0, n = 0, foreign = 0;
      const [pr, pg, pb] = (t.plate.match(/\d+/g) || [0, 0, 0]).map(Number);
      for (let i = 0; i < d.length; i += 4 * 2) {
        const r = ratio(tl, L(d[i], d[i + 1], d[i + 2]));
        if (r < worst) worst = r;
        sum += r; n++;
        /* a plain card must show its own plate behind every line — anything else
           means a neighbour is painting over it and the text has left its card */
        if (!t.art && Math.abs(d[i] - pr) + Math.abs(d[i + 1] - pg) + Math.abs(d[i + 2] - pb) > 24) foreign++;
      }
      return { ...t, worst: +worst.toFixed(2), avg: +(sum / n).toFixed(2), foreign: Math.round((foreign / n) * 100) };
    }).filter(Boolean);
  }, { png, boxes });
  for (const r of rows) {
    if (r.worst < 4.5)
      console.log(`${String(w).padStart(5)}px ${r.cls.padEnd(11)} ${String(r.tag).padEnd(8)} контраст, худший ${String(r.worst).padStart(5)}  средний ${r.avg}`);
    if (!r.art && r.foreign > 2)
      console.log(`${String(w).padStart(5)}px ${r.cls.padEnd(11)} ${String(r.tag).padEnd(8)} ${r.foreign}% строки лежит не на своей подложке`);
  }
  await ctx.close();
}
await b.close();
