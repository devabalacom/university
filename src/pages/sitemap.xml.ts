import type { APIRoute } from "astro";

// Every page is src/pages/**/index.astro, so its folder is its URL.
const pages = Object.keys(import.meta.glob("./**/index.astro"))
  .map((file) => file.replace(/^\.\//, "").replace(/index\.astro$/, ""))
  .sort();

export const GET: APIRoute = ({ site }) => {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const urls = pages
    .map((path) => `  <url><loc>${new URL(`${base}/${path}`, site)}</loc></url>`)
    .join("\n");
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    { headers: { "Content-Type": "application/xml; charset=utf-8" } },
  );
};
