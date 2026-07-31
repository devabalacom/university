/**
 * user-sim — drives the site the way a person with a goal would, and records
 * where that person hits friction.
 *
 * It is deliberately dumb about the site's internals: each journey is written
 * as a human intent ("find out whether this is a consultancy"), and the only
 * things it may use to satisfy that intent are what a visitor can actually
 * see — visible link text, headings, and the viewport. If the intent cannot
 * be satisfied that way, that is a finding, not a bug in the script.
 *
 *   node tools/user-sim.mjs                    # all journeys, desktop + mobile
 *   OUT=/tmp/sim node tools/user-sim.mjs       # choose the output directory
 *
 * Writes <OUT>/log.json (machine-readable) and <OUT>/*.png (what the user saw).
 */
import { chromium } from "playwright-core";
import fs from "node:fs";
import path from "node:path";

const EXE = process.env.CHROME
  ?? "/home/claude_code/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell";
const ORIGIN = process.env.ORIGIN ?? "http://localhost:4321";
const BASE = "/university";
const OUT = process.env.OUT ?? "/tmp/user-sim";
fs.mkdirSync(OUT, { recursive: true });

const DEVICES = [
  { id: "desktop", width: 1440, height: 900 },
  { id: "mobile", width: 375, height: 812 },
];

/* ── journeys ───────────────────────────────────────────────────────────
   goal      what the visitor is trying to achieve, in their words
   start     where they land
   steps     each step is either
               {find: "visible text"}        click the first visible link/button whose text matches
               {read: /regex/}               the answer must be visible somewhere on the page
               {reach: "css"}                the element must exist and be reachable
   Steps run in order. The first failure ends the journey and is recorded. */
const JOURNEYS = [
  {
    id: "skeptic",
    who: "Руководитель, пришёл по ссылке. Хочет за минуту понять, что это и не консалтинг ли",
    goal: "Понять, чем занимается институт, и выяснить, консалтинг это или нет",
    start: `${BASE}/`,
    steps: [
      { read: /согласованност/i, why: "предмет должен быть виден на первом экране" },
      { find: "Об институте", why: "хочет узнать про организацию" },
      { read: /вывод о системе перестал быть мнением|объект исследования/i, why: "должен найти, зачем институт существует" },
      { read: /не является|консалтинг/i, why: "хочет проверить, не консалтинг ли это" },
    ],
  },
  {
    id: "method",
    who: "Аналитик, слышал про «девять уровней». Хочет понять, что это и как уровень диагностируется",
    goal: "Понять, что такое девять уровней и как определяется режим уровня",
    start: `${BASE}/`,
    steps: [
      { find: "Читать метод", why: "самый заметный призыв на первом экране" },
      { read: /девять уровней/i, why: "должен попасть туда, куда обещала карточка" },
      { read: /дефицит/i, why: "хочет увидеть режимы" },
      { read: /гиперактивац/i, why: "три режима должны быть перечислены" },
      { reach: ".lv__btn", why: "переключатель уровней должен существовать" },
    ],
  },
  {
    id: "verifier",
    who: "Исследователь. Не верит на слово, ищет источники и фальсификаторы",
    goal: "Найти источники утверждений и то, что их опровергает",
    start: `${BASE}/`,
    steps: [
      { find: "Публикации", why: "ищет, где опубликованы результаты" },
      { read: /основание|уровень доказательности/i, why: "хочет увидеть требования к публикации" },
      { find: "Границы предсказуемости", why: "открывает единственную публикацию" },
      { read: /Lorenz|Ashby|Salganik/i, why: "источники должны быть указаны" },
      { read: /что опровергнет|фальсифиц|не утверждает/i, why: "ищет фальсификатор" },
    ],
  },
  {
    id: "case",
    who: "Практик. Хочет увидеть, как выглядит результат работы, прежде чем читать теорию",
    goal: "Найти живой пример вывода со всеми полями",
    start: `${BASE}/`,
    steps: [
      { find: "Разбор целиком", why: "с главной должен быть путь к разбору" },
      { read: /локус/i, why: "поле локуса — часть стандарта вывода" },
      { read: /что опровергнет/i, why: "фальсификатор обязателен в каждом выводе" },
      { read: /горизонт обратимости/i, why: "ещё одно обязательное поле" },
      { read: /свободная энергия/i, why: "девятое поле" },
    ],
  },
  {
    id: "contact",
    who: "Потенциальный заказчик. Прочитал, заинтересовался, хочет написать",
    goal: "Найти способ связаться с институтом",
    start: `${BASE}/`,
    steps: [
      { reach: 'a[href^="mailto:"], a[href^="tel:"], a[href*="contact"], a[href*="kontakt"], form',
        why: "нужен реальный способ связи, а не слово «связь» в тексте" },
    ],
  },
  {
    id: "reader",
    who: "Пришёл из мессенджера сразу на публикацию. Дочитал и хочет понять, кто это написал",
    goal: "Прочитать публикацию и вернуться к тому, кто её выпустил",
    start: `${BASE}/publikacii/granicy-predskazuemosti/`,
    steps: [
      { read: /предсказание работает/i, why: "текст должен начинаться сразу" },
      { find: "Метод", why: "после статьи нужен следующий шаг" },
      { read: /девять уровней/i, why: "должен попасть в метод" },
    ],
  },
];

/* ── helpers ─────────────────────────────────────────────────────────── */

const norm = (s) => (s ?? "").replace(/\s+/g, " ").trim().toLowerCase();

async function visibleTargets(page) {
  return page.evaluate(() => {
    const out = [];
    let i = 0;
    document.querySelectorAll("a[href], button").forEach((el) => {
      el.setAttribute("data-sim", String(i++)); // stable handle for the click
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      if (cs.display === "none" || cs.visibility === "hidden" || Number(cs.opacity) === 0) return;
      if (r.width === 0 || r.height === 0) return;
      out.push({
        sim: el.getAttribute("data-sim"),
        text: (el.textContent || el.getAttribute("aria-label") || "").replace(/\s+/g, " ").trim(),
        tag: el.tagName,
        href: el.getAttribute("href"),
        top: Math.round(r.top + window.scrollY),
        h: Math.round(r.height),
      });
    });
    return out;
  });
}

async function pageText(page) {
  return page.evaluate(() => document.body.innerText.replace(/\s+/g, " "));
}

/** Reveal collapsed content the way a user would — open accordions/tabs. */
async function expandAll(page) {
  return page.evaluate(() => {
    let opened = 0;
    document.querySelectorAll('[aria-expanded="false"]').forEach((b) => {
      if (b instanceof HTMLElement) { b.click(); opened++; }
    });
    return opened;
  });
}

/* ── run one journey ─────────────────────────────────────────────────── */

async function runJourney(page, dev, j) {
  const rec = {
    journey: j.id, device: dev.id, who: j.who, goal: j.goal,
    steps: [], console: [], http: [], ok: true, shots: [],
  };
  const onConsole = (m) => { if (m.type() === "error") rec.console.push(m.text().slice(0, 200)); };
  const onResp = (r) => { if (r.status() >= 400) rec.http.push(`${r.status()} ${r.url()}`); };
  page.on("console", onConsole);
  page.on("response", onResp);

  await page.goto(ORIGIN + j.start, { waitUntil: "networkidle" });
  await page.waitForTimeout(300);

  let stepNo = 0;
  for (const step of j.steps) {
    stepNo++;
    const url = page.url().replace(ORIGIN, "");
    const entry = { n: stepNo, url, why: step.why };

    if (step.read) {
      // what is on screen without scrolling, vs anywhere on the page
      const beforeExpand = await pageText(page);
      let hit = step.read.test(beforeExpand);
      let neededExpand = false;
      if (!hit) {
        const opened = await expandAll(page);
        if (opened) {
          await page.waitForTimeout(200);
          hit = step.read.test(await pageText(page));
          neededExpand = hit;
        }
      }
      const aboveFold = await page.evaluate((src) => {
        const re = new RegExp(src.source, src.flags);
        const vh = window.innerHeight;
        let found = false;
        document.querySelectorAll("h1,h2,h3,p,li,td,span,b").forEach((el) => {
          if (found) return;
          const r = el.getBoundingClientRect();
          if (r.top >= 0 && r.top < vh && re.test(el.textContent || "")) found = true;
        });
        return found;
      }, { source: step.read.source, flags: step.read.flags });

      entry.kind = "read";
      entry.query = String(step.read);
      entry.found = hit;
      entry.aboveFold = aboveFold;
      entry.neededExpand = neededExpand;
      if (!hit) { entry.fail = "текста нет на странице"; rec.ok = false; }
    }

    if (step.find) {
      const targets = await visibleTargets(page);
      const want = norm(step.find);
      const match = targets.find((t) => norm(t.text).includes(want));
      entry.kind = "find";
      entry.query = step.find;
      entry.found = Boolean(match);
      if (match) {
        entry.target = { text: match.text.slice(0, 60), href: match.href, height: match.h, topPx: match.top };
        entry.scrollNeededPx = Math.max(0, match.top - 100);
        entry.tapTargetOk = match.h >= 24;
        try {
          const loc = page.locator(`[data-sim="${match.sim}"]`).first();
          await loc.scrollIntoViewIfNeeded({ timeout: 5000 });
          await loc.click({ timeout: 5000 });
          await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
          await page.waitForTimeout(300);
          entry.landedOn = page.url().replace(ORIGIN, "");
        } catch (e) {
          entry.fail = "элемент найден, но клик не сработал: " + String(e).slice(0, 120);
          rec.ok = false;
        }
      } else {
        entry.fail = "на странице нет видимой ссылки с таким текстом";
        entry.visibleChoices = targets.slice(0, 24).map((t) => t.text.slice(0, 42)).filter(Boolean);
        rec.ok = false;
      }
    }

    if (step.reach) {
      const n = await page.locator(step.reach).count();
      entry.kind = "reach";
      entry.query = step.reach;
      entry.found = n > 0;
      if (!n) { entry.fail = "элемента нет"; rec.ok = false; }
    }

    const shot = `${j.id}-${dev.id}-${stepNo}.png`;
    await page.screenshot({ path: path.join(OUT, shot) });
    rec.shots.push(shot);
    entry.shot = shot;
    rec.steps.push(entry);
    if (entry.fail) break;
  }

  page.off("console", onConsole);
  page.off("response", onResp);
  return rec;
}

/* ── page-level checks a user feels but cannot name ──────────────────── */

async function ergonomics(page, dev, url) {
  await page.goto(ORIGIN + url, { waitUntil: "networkidle" });
  await page.evaluate(async () => {
    window.scrollTo(0, document.body.scrollHeight);
    await new Promise((r) => setTimeout(r, 500));
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(300);
  return page.evaluate(() => {
    const vw = window.innerWidth;
    const res = { url: location.pathname, scrollH: document.documentElement.scrollHeight, vw };
    res.horizontalOverflow = document.documentElement.scrollWidth > vw + 1;
    res.spill = [];
    document.querySelectorAll("body *").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0) return;
      if (r.right > vw + 0.5 || r.left < -0.5) {
        const kids = [...el.children].some((c) => {
          const q = c.getBoundingClientRect();
          return q.right > vw + 0.5 || q.left < -0.5;
        });
        let scroller = false;
        for (let n = el.parentElement; n; n = n.parentElement) {
          const ox = getComputedStyle(n).overflowX;
          if (ox === "auto" || ox === "scroll") { scroller = true; break; }
        }
        if (!kids && !scroller && !el.classList.contains("skip")) {
          res.spill.push(`${el.tagName}.${typeof el.className === "string" ? el.className : ""} "${(el.textContent || "").trim().slice(0, 40)}"`);
        }
      }
    });
    res.h1 = document.querySelectorAll("h1").length;
    res.tinyTargets = [...document.querySelectorAll("a[href],button")]
      .filter((e) => {
        const r = e.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && r.height < 24 && !e.classList.contains("skip");
      })
      .map((e) => (e.textContent || "").trim().slice(0, 24));
    res.imagesNoAlt = [...document.images].filter((i) => i.alt === null).length;
    res.brokenImages = [...document.images].filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.currentSrc);
    // how far down the page is the first real content heading
    const h = document.querySelector("main h1, main h2");
    res.firstHeadingTop = h ? Math.round(h.getBoundingClientRect().top + window.scrollY) : null;
    // Contrast of every text node against its effective background.
    //
    // Composites semi-transparent backgrounds over their ancestors instead of
    // treating them as opaque, and refuses to guess when a gradient or image
    // sits behind the text — those are reported separately as "unmeasurable"
    // rather than as failures, so the list stays trustworthy.
    const parse = (c) => {
      const m = (c.match(/[\d.]+/g) || []).map(Number);
      if (m.length < 3) return null;
      return { r: m[0], g: m[1], b: m[2], a: m.length > 3 ? m[3] : 1 };
    };
    const over = (fg, bg) => ({
      r: fg.r * fg.a + bg.r * (1 - fg.a),
      g: fg.g * fg.a + bg.g * (1 - fg.a),
      b: fg.b * fg.a + bg.b * (1 - fg.a),
      a: 1,
    });
    const lum = ({ r, g, b }) => {
      const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    /** Effective background, or null when something unpaintable is behind. */
    const effectiveBg = (el) => {
      const layers = [];
      let n = el;
      while (n && n !== document.documentElement) {
        const cs = getComputedStyle(n);
        if (cs.backgroundImage && cs.backgroundImage !== "none") return null; // gradient/photo
        const c = parse(cs.backgroundColor);
        if (c && c.a > 0) {
          layers.push(c);
          if (c.a >= 1) break;
        }
        n = n.parentElement;
      }
      let acc = { r: 255, g: 255, b: 255, a: 1 };
      for (let i = layers.length - 1; i >= 0; i--) acc = over(layers[i], acc);
      return acc;
    };
    res.contrast = [];
    res.contrastUnmeasurable = 0;
    const seen = new Set();
    document.querySelectorAll("p,li,td,th,h1,h2,h3,h4,span,b,a,button,cite").forEach((el) => {
      const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
      if (!own) return; // only elements that paint their own text
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      const cs = getComputedStyle(el);
      if (cs.visibility === "hidden" || Number(cs.opacity) === 0) return;
      if (el.closest("[aria-hidden='true']")) return; // decorative, exempt from 1.4.3
      const bg = effectiveBg(el);
      if (!bg) { res.contrastUnmeasurable++; return; }
      const fgRaw = parse(cs.color);
      if (!fgRaw) return;
      const fg = fgRaw.a < 1 ? over(fgRaw, bg) : fgRaw;
      const L1 = lum(fg), L2 = lum(bg);
      const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
      const px = parseFloat(cs.fontSize);
      const bold = Number(cs.fontWeight) >= 700;
      const large = px >= 24 || (px >= 18.66 && bold);
      const need = large ? 3 : 4.5;
      if (ratio < need) {
        const key = `${cs.color}|${JSON.stringify(bg)}|${Math.round(px)}`;
        if (seen.has(key)) return;
        seen.add(key);
        res.contrast.push({ ratio: Number(ratio.toFixed(2)), need, px: Math.round(px), color: cs.color,
          bg: `rgb(${Math.round(bg.r)}, ${Math.round(bg.g)}, ${Math.round(bg.b)})`,
          sel: `${el.tagName.toLowerCase()}.${typeof el.className === "string" ? el.className.trim().split(/\s+/).join(".") : ""}`,
          sample: (el.textContent || "").trim().slice(0, 40) });
      }
    });
    return res;
  });
}

/* ── main ────────────────────────────────────────────────────────────── */

const browser = await chromium.launch({ executablePath: EXE });
const log = { origin: ORIGIN, journeys: [], ergonomics: [] };

for (const dev of DEVICES) {
  const ctx = await browser.newContext({ viewport: { width: dev.width, height: dev.height } });
  const page = await ctx.newPage();
  for (const j of JOURNEYS) {
    const rec = await runJourney(page, dev, j);
    log.journeys.push(rec);
    console.log(`${rec.ok ? "  ok  " : " FAIL "} ${dev.id.padEnd(7)} ${j.id.padEnd(9)} ${rec.steps.filter((s) => s.found).length}/${j.steps.length} шагов`);
  }
  for (const u of [`${BASE}/`, `${BASE}/institut/`, `${BASE}/metod/`, `${BASE}/primenenie/`, `${BASE}/publikacii/`, `${BASE}/publikacii/granicy-predskazuemosti/`]) {
    log.ergonomics.push({ device: dev.id, ...(await ergonomics(page, dev, u)) });
  }
  await ctx.close();
}
await browser.close();

fs.writeFileSync(path.join(OUT, "log.json"), JSON.stringify(log, null, 2));

/* ── console summary ─────────────────────────────────────────────────── */
console.log("\n── где путь оборвался ──");
for (const j of log.journeys.filter((x) => !x.ok)) {
  const bad = j.steps.find((s) => s.fail);
  console.log(`${j.device}/${j.journey}: шаг ${bad.n} — ${bad.fail}`);
  console.log(`    цель: ${j.goal}`);
  console.log(`    ждал: ${bad.query}  (${bad.why})`);
  if (bad.visibleChoices) console.log(`    видел: ${bad.visibleChoices.join(" · ")}`);
}
console.log("\n── эргономика ──");
for (const e of log.ergonomics) {
  const flags = [];
  if (e.horizontalOverflow) flags.push("ГОРИЗОНТАЛЬНЫЙ СКРОЛЛ");
  if (e.spill.length) flags.push(`выезд ${e.spill.length}`);
  if (e.h1 !== 1) flags.push(`h1=${e.h1}`);
  if (e.tinyTargets.length) flags.push(`мелкие цели ${e.tinyTargets.length}`);
  if (e.contrast.length) flags.push(`контраст ${e.contrast.length}`);
  if (e.brokenImages.length) flags.push(`битые картинки ${e.brokenImages.length}`);
  console.log(`${e.device.padEnd(7)} ${e.url.padEnd(42)} h=${String(e.scrollH).padStart(6)} ${flags.join(" · ") || "чисто"}`);
}
console.log(`\nлог: ${path.join(OUT, "log.json")}`);
